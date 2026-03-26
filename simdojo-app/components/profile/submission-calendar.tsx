"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface SubmissionCalendarProps {
  calendar: Record<string, number>
}

export function SubmissionCalendar({ calendar }: SubmissionCalendarProps) {
  // Generate last 365 days
  const today = new Date()
  const days: { date: string; count: number; dayOfWeek: number }[] = []

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    days.push({
      date: dateStr,
      count: calendar[dateStr] || 0,
      dayOfWeek: d.getDay(),
    })
  }

  // Group into weeks (columns)
  const weeks: typeof days[] = []
  let currentWeek: typeof days = []

  // Pad first week
  if (days.length > 0) {
    for (let i = 0; i < days[0].dayOfWeek; i++) {
      currentWeek.push({ date: "", count: 0, dayOfWeek: i })
    }
  }

  for (const day of days) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  function getIntensity(count: number): string {
    if (count === 0) return "bg-muted"
    if (count <= 2) return "bg-primary/30"
    if (count <= 5) return "bg-primary/60"
    return "bg-primary"
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) =>
              day.date ? (
                <Tooltip key={di}>
                  <TooltipTrigger
                    className={`size-3 rounded-sm ${getIntensity(day.count)}`}
                  />
                  <TooltipContent>
                    <p className="text-xs">
                      {day.count} submission{day.count !== 1 ? "s" : ""} on {day.date}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div key={di} className="size-3" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
