'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAY_NAMES = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

// Max days per month (Feb=29 for leap years — this is a historical calendar)
const MAX_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

interface CalendarWidgetProps {
  currentDate: Date
}

export default function CalendarWidget({ currentDate }: CalendarWidgetProps) {
  const router = useRouter()
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth())

  const selectedDay = currentDate.getDate()
  const selectedMonth = currentDate.getMonth()

  const daysInMonth = MAX_DAYS[viewMonth]

  function handlePrevMonth() {
    setViewMonth(viewMonth === 0 ? 11 : viewMonth - 1)
  }

  function handleNextMonth() {
    setViewMonth(viewMonth === 11 ? 0 : viewMonth + 1)
  }

  function handleDayClick(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    router.push(`/?data=${mm}-${dd}`)
  }

  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth()

  return (
    <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
      {/* Month header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#b50926]">
        <button
          onClick={handlePrevMonth}
          className="text-white/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
          {MONTH_NAMES[viewMonth]}
        </h3>
        <button
          onClick={handleNextMonth}
          className="text-white/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Następny miesiąc"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day cells — simple grid of 1..N */}
      <div className="grid grid-cols-7 gap-px p-2">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const isSelected = viewMonth === selectedMonth && day === selectedDay
          const isToday = viewMonth === todayMonth && day === todayDay

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`
                py-2 text-center text-sm transition-colors cursor-pointer rounded-sm
                ${isSelected ? 'bg-[#b50926] text-white font-bold' : 'text-gray-800 hover:bg-[#b50926] hover:text-white'}
                ${isToday && !isSelected ? 'font-bold text-[#b50926]' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
