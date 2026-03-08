"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { format, subDays, eachDayOfInterval, startOfWeek, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"

type ChartDatum = Record<string, string | number | undefined>

type PieLabelProps = {
    cx?: number
    cy?: number
    midAngle?: number
    outerRadius?: number
    percent?: number
    name?: string | number
}

// --- Traffic Trend Chart ---
export function TrafficTrendChart({ data }: { data: ChartDatum[] }) {
    // Mock data generation if empty, or formatting
    // Assuming data is [{ date: '2023-01-01', pv: 100, uv: 50 }]
    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => format(parseISO(val), 'MM-dd')} />
                <YAxis tick={{fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                <Tooltip 
                     contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                     labelFormatter={(label) => format(parseISO(label), 'yyyy年MM月dd日')}
                />
                <Area type="monotone" dataKey="pv" stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" name="浏览量 (PV)" />
                <Area type="monotone" dataKey="uv" stroke="#82ca9d" fillOpacity={1} fill="url(#colorUv)" name="访客数 (UV)" />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// --- Tag Distribution Chart (Pie Chart) ---
export function TagPieChart({ data }: { data: ChartDatum[] }) {
    // Minimalist grayscale palette for a clean, professional look
    const COLORS = [
        'hsl(220, 15%, 65%)',  // Blue Gray
        'hsl(220, 15%, 55%)',  // Medium Gray
        'hsl(220, 15%, 45%)',  // Dark Gray
        'hsl(220, 12%, 70%)',  // Light Gray
        'hsl(220, 12%, 50%)',  // Steel Gray
        'hsl(220, 18%, 60%)',  // Slate Gray
        'hsl(220, 10%, 40%)',  // Charcoal
        'hsl(220, 13%, 75%)',  // Soft Gray
    ];

    // Custom label component for better readability
    const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: PieLabelProps) => {
                if (
                    cx === undefined ||
                    cy === undefined ||
                    midAngle === undefined ||
                    outerRadius === undefined ||
                    percent === undefined ||
                    name === undefined
                ) {
                    return null;
                }
        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 35;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text 
                x={x} 
                y={y} 
                fill="hsl(var(--foreground))" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                className="text-sm font-semibold"
                style={{ textShadow: '0 0 8px hsl(var(--background)), 0 0 4px hsl(var(--background))' }}
            >
                {`${name} ${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={500}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                    label={renderCustomLabel}
                    labelLine={{
                        stroke: 'hsl(var(--border))',
                        strokeWidth: 1.5
                    }}
                >
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            className="transition-opacity hover:opacity-80"
                        />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        borderColor: 'hsl(var(--border))', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        padding: '12px'
                    }}
                    itemStyle={{ 
                        color: 'hsl(var(--popover-foreground))',
                        fontWeight: 500
                    }}
                    formatter={(value, name) => [`${value ?? 0} 篇文章`, String(name ?? '')]}
                />
                <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ 
                        paddingTop: '30px',
                        fontSize: '14px'
                    }}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-foreground font-medium">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}

// --- GitHub Style Heatmap (Grid Implementation) ---
export function ActivityHeatmap({ data }: { data: { date: string, count: number }[] }) {
    // Generate dates for the last 52 weeks (approx 1 year), ending with Today
    const today = new Date();
    
    const endDate = today;
    const startDate = subDays(endDate, 365); 
    
    // We want a list of days that starts from a Sunday or adjusts to the grid
    const activityMap = new Map(data.map(item => [item.date.split('T')[0], item.count]));

    // Use a monochrome scale or primary color scale that fits dark mode better
    const getColor = (count: number) => {
        if (count === 0) return 'bg-zinc-100 dark:bg-zinc-800/40';
        if (count <= 1) return 'bg-sky-200 dark:bg-sky-900/60';
        if (count <= 3) return 'bg-sky-400 dark:bg-sky-700/80';
        return 'bg-sky-600 dark:bg-sky-500';
    };
    
    // ADJUSTMENT: We'll simple create a Grid of Weeks
    // 1. Calculate start of the first week (The Sunday before startDate)
    const startOfFirstWeek = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday
    const allDays = eachDayOfInterval({ start: startOfFirstWeek, end: endDate });
    
    // Group into weeks
    const weeks: Date[][] = [];
    let week: Date[] = [];
    
    allDays.forEach(day => {
        week.push(day);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    });
    if (week.length > 0) weeks.push(week); // last partial week

    // Generate month labels based on the weeks
    const monthLabels: { label: string, colIndex: number }[] = [];
    weeks.forEach((weekData, i) => {
        // If this week contains the 1st of a month, or simply change of month?
        // Usually GitHub puts the label on the column where the month starts.
        // Let's check if the week contains the 1st day of a month OR if the first day of the week is a new month
        const hasFirstDayOfMonth = weekData.some(d => d.getDate() === 1);
        
        if (hasFirstDayOfMonth) {
            // Find which month
            const d = weekData.find(d => d.getDate() === 1) || weekData[0];
             const label = format(d, 'MMM', { locale: zhCN });
             // Avoid duplicate adjacent labels (e.g. if week 1 starts in Oct, week 5 starts in Nov)
             if (!monthLabels.find(m => m.label === label && m.colIndex >= i - 3)) { // simple debounce
                 monthLabels.push({ label, colIndex: i });
             }
        }
    });
    
    // Configurable Grid Size
    const CELL_SIZE = 13; // slightly larger
    const GAP = 3; 
    const CELL_WITH_GAP = CELL_SIZE + GAP;

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar flex justify-center">
                <div className="min-w-max pl-1">
                    {/* Month Axis */}
                    <div className="flex text-xs text-muted-foreground mb-2 h-4 relative w-full">
                        {monthLabels.map((m, i) => (
                            <span 
                                key={i} 
                                style={{ 
                                    left: `${m.colIndex * CELL_WITH_GAP}px`, 
                                    position: 'absolute' 
                                }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                        {/* Day Axis */}
                        <div className="grid grid-rows-7 gap-[3px] text-[10px] text-muted-foreground mr-1 h-[109px] leading-[13px] pt-[1px]">
                             <span></span>
                             <span>一</span>
                             <span></span>
                             <span>三</span>
                             <span></span>
                             <span>五</span>
                             <span></span>
                        </div>

                        {/* Heatmap Grid */}
                        <div className="flex gap-[3px]"> 
                            {weeks.map((weekData, colIndex) => (
                                <div key={colIndex} className="grid grid-rows-7 gap-[3px]">
                                    {weekData.map((day, rowIndex) => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        // Don't render future days
                                        if (day > today) return <div key={rowIndex} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                                        
                                        const count = activityMap.get(dateStr) || 0;
                                        return (
                                            <div 
                                                key={dateStr}
                                                style={{ width: CELL_SIZE, height: CELL_SIZE }}
                                                className={`rounded-sm transition-all hover:scale-125 hover:ring-2 ring-primary/20 ${getColor(count)}`}
                                                title={`${format(day, 'yyyy年MM月dd日', { locale: zhCN })}: ${count} 篇文章`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-2 text-xs text-muted-foreground mt-4 pr-1">
                        <span>少</span>
                        <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="rounded-sm bg-zinc-100 dark:bg-zinc-800/40"></div>
                        <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="rounded-sm bg-sky-200 dark:bg-sky-900/60"></div>
                        <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="rounded-sm bg-sky-400 dark:bg-sky-700/80"></div>
                        <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="rounded-sm bg-sky-600 dark:bg-sky-500"></div>
                        <span>多</span>
                    </div>
                </div>
            </div>
        </div>
    )
}


