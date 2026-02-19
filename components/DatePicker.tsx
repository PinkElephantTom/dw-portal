'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMonthDay } from '@/lib/utils'

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

export default function DatePicker({ currentDate }: { currentDate: Date }) {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate())

  // Days in selected month (use a leap year to allow Feb 29)
  const daysInMonth = new Date(2024, selectedMonth, 0).getDate()

  function handleGo() {
    const d = new Date(2024, selectedMonth - 1, selectedDay)
    router.push(`/?data=${getMonthDay(d)}`)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      {/* Day select */}
      <select
        value={selectedDay}
        onChange={(e) => setSelectedDay(Number(e.target.value))}
        className="border border-gray-300 rounded-sm px-3 py-2 text-sm bg-white font-heading"
      >
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Month select */}
      <select
        value={selectedMonth}
        onChange={(e) => {
          const newMonth = Number(e.target.value)
          const maxDay = new Date(2024, newMonth, 0).getDate()
          setSelectedMonth(newMonth)
          if (selectedDay > maxDay) setSelectedDay(maxDay)
        }}
        className="border border-gray-300 rounded-sm px-3 py-2 text-sm bg-white font-heading"
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>

      {/* Go button */}
      <button
        onClick={handleGo}
        className="px-6 py-2 bg-[#b50926] hover:bg-[#8f071e] text-white font-heading text-sm uppercase tracking-wider transition-colors cursor-pointer"
      >
        Pokaż
      </button>
    </div>
  )
}
