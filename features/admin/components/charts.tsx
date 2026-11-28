'use client'

import { eachDayOfInterval, subDays, format, startOfWeek } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 轻量零依赖标签分布柱状图（替代未使用的 Recharts，减轻后台打包体积）
export function TagDistributionChart({
  data,
}: {
  data: Array<{ name: string; count: number }>
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
        暂无标签分布数据
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const pct = Math.max(8, Math.round((item.count / maxCount) * 100))
        return (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">#{item.name}</span>
              <span className="font-mono text-muted-foreground">{item.count} 篇</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/70">
              <div
                className="h-full rounded-full bg-foreground/75 transition-all duration-500 dark:bg-foreground/80"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// GitHub 风格创作活跃度热力图
export function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const today = new Date()
  const endDate = today
  const startDate = subDays(endDate, 365)

  const activityMap = new Map(data.map((item) => [item.date.split('T')[0], item.count]))

  const getColor = (count: number) => {
    if (count === 0) return 'bg-zinc-100 dark:bg-zinc-800/40'
    if (count <= 1) return 'bg-sky-200 dark:bg-sky-900/60'
    if (count <= 3) return 'bg-sky-400 dark:bg-sky-700/80'
    return 'bg-sky-600 dark:bg-sky-500'
  }

  const startOfFirstWeek = startOfWeek(startDate, { weekStartsOn: 0 })
  const allDays = eachDayOfInterval({ start: startOfFirstWeek, end: endDate })

  const weeks: Date[][] = []
  let week: Date[] = []

  allDays.forEach((day) => {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  })
  if (week.length > 0) weeks.push(week)

  const monthLabels: { label: string; colIndex: number }[] = []
  weeks.forEach((weekData, i) => {
    const hasFirstDayOfMonth = weekData.some((d) => d.getDate() === 1)
    if (hasFirstDayOfMonth) {
      const d = weekData.find((item) => item.getDate() === 1) || weekData[0]
      const label = format(d, 'MMM', { locale: zhCN })
      if (!monthLabels.find((m) => m.label === label && m.colIndex >= i - 3)) {
        monthLabels.push({ label, colIndex: i })
      }
    }
  })

  const CELL_SIZE = 13
  const GAP = 3
  const CELL_WITH_GAP = CELL_SIZE + GAP

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="custom-scrollbar flex w-full justify-center overflow-x-auto pb-4">
        <div className="min-w-max pl-1">
          <div className="relative mb-2 flex h-4 w-full text-xs text-muted-foreground">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                style={{
                  left: `${m.colIndex * CELL_WITH_GAP}px`,
                  position: 'absolute',
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="mr-1 grid h-[109px] grid-rows-7 gap-[3px] pt-[1px] text-[10px] leading-[13px] text-muted-foreground">
              <span />
              <span>一</span>
              <span />
              <span>三</span>
              <span />
              <span>五</span>
              <span />
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((weekData, colIndex) => (
                <div key={colIndex} className="grid grid-rows-7 gap-[3px]">
                  {weekData.map((day, rowIndex) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    if (day > today) {
                      return <div key={rowIndex} style={{ width: CELL_SIZE, height: CELL_SIZE }} />
                    }
                    const count = activityMap.get(dateStr) || 0
                    return (
                      <div
                        key={dateStr}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        className={`rounded-sm ring-primary/20 transition-all hover:scale-125 hover:ring-2 ${getColor(count)}`}
                        title={`${format(day, 'yyyy年MM月dd日', { locale: zhCN })}: ${count} 篇文章`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>少</span>
            <div className="h-3 w-3 rounded-sm bg-zinc-100 dark:bg-zinc-800/40" />
            <div className="h-3 w-3 rounded-sm bg-sky-200 dark:bg-sky-900/60" />
            <div className="h-3 w-3 rounded-sm bg-sky-400 dark:bg-sky-700/80" />
            <div className="h-3 w-3 rounded-sm bg-sky-600 dark:bg-sky-500" />
            <span>多</span>
          </div>
        </div>
      </div>
    </div>
  )
}
