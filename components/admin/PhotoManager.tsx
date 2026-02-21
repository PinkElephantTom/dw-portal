'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addPhoto, deletePhoto, updatePhoto, uploadPhotoFile } from '@/app/admin/actions'
import { Plus, Trash2, Image as ImageIcon, Pencil, X, Check, Upload, Link as LinkIcon } from 'lucide-react'

interface Photo {
  id: number
  url: string
  title: string | null
  author: string | null
  source: string | null
}

interface Props {
  eventId: number
  photos: Photo[]
}

export default function PhotoManager({ eventId, photos }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [addMode, setAddMode] = useState<'file' | 'url'>('file')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', author: '', source: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // === File handling ===

  function handleFileSelect(file: File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setAddError('Dozwolone formaty: JPG, PNG, WebP, GIF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setAddError('Maksymalny rozmiar pliku: 10 MB.')
      return
    }
    setSelectedFile(file)
    setAddError('')
    const reader = new FileReader()
    reader.onload = (e) => setFilePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  function clearFile() {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // === Add photo ===

  async function handleAdd(formData: FormData) {
    setAddError('')
    setAddLoading(true)
    formData.set('event_id', String(eventId))

    let result
    if (addMode === 'file' && selectedFile) {
      formData.set('file', selectedFile)
      result = await uploadPhotoFile(formData)
    } else {
      result = await addPhoto(formData)
    }

    setAddLoading(false)
    if (result?.error) {
      setAddError(result.error)
    } else {
      setShowAddForm(false)
      setAddError('')
      clearFile()
      router.refresh()
    }
  }

  // === Edit photo metadata ===

  function startEditing(photo: Photo) {
    setEditingId(photo.id)
    setEditForm({
      title: photo.title || '',
      author: photo.author || '',
      source: photo.source || '',
    })
    setEditError('')
  }

  async function handleSaveEdit() {
    if (editingId === null) return
    setEditLoading(true)
    setEditError('')

    const formData = new FormData()
    formData.set('title', editForm.title)
    formData.set('author', editForm.author)
    formData.set('source', editForm.source)

    const result = await updatePhoto(editingId, eventId, formData)
    setEditLoading(false)

    if (result?.error) {
      setEditError(result.error)
    } else {
      setEditingId(null)
      router.refresh()
    }
  }

  // === Delete photo ===

  async function handleDelete(photoId: number) {
    setDeletingId(photoId)
    const result = await deletePhoto(photoId, eventId)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div>
      {/* Photo list */}
      {photos.length > 0 ? (
        <div className="space-y-3 mb-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-20 h-20 shrink-0 bg-gray-100 rounded overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.title || ''}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info or Edit form */}
                {editingId === photo.id ? (
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Tytuł"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editForm.author}
                        onChange={(e) => setEditForm(f => ({ ...f, author: e.target.value }))}
                        placeholder="Autor"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={editForm.source}
                        onChange={(e) => setEditForm(f => ({ ...f, source: e.target.value }))}
                        placeholder="Źródło"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
                      />
                    </div>
                    {editError && (
                      <p className="text-xs text-red-600">{editError}</p>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={handleSaveEdit}
                        disabled={editLoading}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white bg-[#b50926] hover:bg-[#8f071e] disabled:bg-gray-400 rounded transition-colors"
                      >
                        <Check size={12} />
                        {editLoading ? '...' : 'Zapisz'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X size={12} />
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="text-gray-800 truncate font-medium">
                      {photo.title || 'Bez tytułu'}
                    </p>
                    <p className="text-gray-400 text-xs truncate mt-0.5">{photo.url}</p>
                    {photo.author && (
                      <p className="text-gray-500 text-xs mt-1">Autor: {photo.author}</p>
                    )}
                    {photo.source && (
                      <p className="text-gray-500 text-xs">Źródło: {photo.source}</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {editingId !== photo.id && (
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      onClick={() => startEditing(photo)}
                      className="p-1.5 text-gray-400 hover:text-[#b50926] hover:bg-red-50 rounded transition-colors"
                      title="Edytuj metadane"
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmDeleteId === photo.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(photo.id)}
                          disabled={deletingId === photo.id}
                          className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded transition-colors"
                        >
                          {deletingId === photo.id ? '...' : 'Tak'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          Nie
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(photo.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Usuń zdjęcie"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
          <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Brak zdjęć dla tego wydarzenia.</p>
        </div>
      )}

      {/* Add photo form */}
      {showAddForm ? (
        <form
          action={handleAdd}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
        >
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-200 rounded-md p-0.5 w-fit">
            <button
              type="button"
              onClick={() => { setAddMode('file'); setAddError('') }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                addMode === 'file'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload size={12} />
              Wgraj plik
            </button>
            <button
              type="button"
              onClick={() => { setAddMode('url'); setAddError(''); clearFile() }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                addMode === 'url'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LinkIcon size={12} />
              Podaj URL
            </button>
          </div>

          {/* File upload area */}
          {addMode === 'file' ? (
            <div>
              {filePreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filePreview}
                    alt="Podgląd"
                    className="max-h-40 rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                  <p className="text-xs text-gray-500 mt-1">{selectedFile?.name}</p>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-[#b50926] bg-red-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Przeciągnij zdjęcie lub <span className="text-[#b50926] font-medium">kliknij, aby wybrać</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF — max 10 MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL zdjęcia *
              </label>
              <input
                id="url"
                name="url"
                type="url"
                required={addMode === 'url'}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
          )}

          {/* Metadata fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="add-title" className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł
              </label>
              <input
                id="add-title"
                name="title"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="add-author" className="block text-sm font-medium text-gray-700 mb-1">
                Autor
              </label>
              <input
                id="add-author"
                name="author"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="add-source" className="block text-sm font-medium text-gray-700 mb-1">
                Źródło
              </label>
              <input
                id="add-source"
                name="source"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
          </div>

          {addError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {addError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={addLoading || (addMode === 'file' && !selectedFile)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#b50926] hover:bg-[#8f071e] disabled:bg-gray-400 text-white text-xs font-heading font-semibold uppercase tracking-wider rounded-md transition-colors"
            >
              {addLoading ? 'Dodawanie...' : 'Dodaj zdjęcie'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddError(''); clearFile() }}
              className="px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-[#b50926] border border-[#b50926] hover:bg-[#b50926] hover:text-white rounded-md transition-colors"
        >
          <Plus size={14} />
          Dodaj zdjęcie
        </button>
      )}
    </div>
  )
}
