'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthDay } from '@/lib/utils'

const DAY_NAMES = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

interface CalendarWidgetProps {
  currentDate: Date
}

export default function CalendarWidget({ currentDate }: CalendarWidgetProps) {
  const router = useRouter()
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth())
  const [viewYear, setViewYear] = useState(currentDate.getFullYear())

  const selectedDay = currentDate.getDate()
  const selectedMonth = currentDate.getMonth()

  // First day of viewed month
  const firstDay = new Date(viewYear, viewMonth, 1)
  // Day of week (Monday=0 ... Sunday=6)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  // Days in this month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Days from previous month to fill first row
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate()

  // Build calendar grid (6 rows × 7 cols max)
  const cells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = []

  // Previous month fill
  for (let i = startDow - 1; i >= 0; i--) {
    const pm = viewMonth === 0 ? 11 : viewMonth - 1
    const py = viewMonth === 0 ? viewYear - 1 : viewYear
    cells.push({ day: prevMonthDays - i, month: pm, year: py, isCurrentMonth: false })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true })
  }

  // Next month fill (to complete 6 rows)
  const remaining = 42 - cells.length
  const nm = viewMonth === 11 ? 0 : viewMonth + 1
  const ny = viewMonth === 11 ? viewYear + 1 : viewYear
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: nm, year: ny, isCurrentMonth: false })
  }

  // Only show 5 rows if last row is entirely next month
  const rows = cells.length > 35 && cells[35].isCurrentMonth === false && cells[34].isCurrentMonth === false
    ? cells.slice(0, 35)
    : cells

  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  function handleDayClick(cell: typeof cells[0]) {
    const d = new Date(2024, cell.month, cell.day)
    router.push(`/?data=${getMonthDay(d)}`)
  }

  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth()

  return (
    <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
      {/* Month/Year header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#b50926]">
        <button
          onClick={handlePrevMonth}
          className="text-white/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={handleNextMonth}
          className="text-white/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Następny miesiąc"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((name) => (
          <div key={name} className="py-2 text-center text-[10px] font-heading font-semibold uppercase tracking-wide text-gray-400">
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {rows.map((cell, i) => {
          const isSelected = cell.isCurrentMonth && cell.day === selectedDay && cell.month === selectedMonth
          const isToday = cell.day === todayDay && cell.month === todayMonth && cell.isCurrentMonth

          return (
            <button
              key={i}
              onClick={() => handleDayClick(cell)}
              className={`
                py-2 text-center text-sm transition-colors cursor-pointer
                ${cell.isCurrentMonth ? 'text-gray-800 hover:bg-[#b50926] hover:text-white' : 'text-gray-300 hover:bg-gray-50'}
                ${isSelected ? 'bg-[#b50926] text-white font-bold' : ''}
                ${isToday && !isSelected ? 'font-bold text-[#b50926]' : ''}
              `}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
