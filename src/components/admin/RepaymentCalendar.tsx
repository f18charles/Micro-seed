import React from "react";
import { LoanApplication } from "../../types";
import { cn } from "../../lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns";

interface RepaymentCalendarProps {
  loans: LoanApplication[];
}

export default function RepaymentCalendar({ loans }: RepaymentCalendarProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startDay = getDay(monthStart);

  const getRepaymentsForDay = (day: Date) => {
    return loans.flatMap(l => (l.repaymentSchedule || []).filter(i => {
      const dueDate = new Date(i.dueDate as string);
      return isSameDay(dueDate, day);
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-bold">{format(today, 'MMMM yyyy')}</h4>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(d => (
          <div key={d} className="text-[10px] text-center font-bold text-muted-foreground py-1">
            {d}
          </div>
        ))}
        
        {/* Empty cells for padding */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}
        
        {days.map((day, i) => {
          const repayments = getRepaymentsForDay(day);
          const isToday = isSameDay(day, today);
          
          return (
            <div 
              key={i} 
              className={cn(
                "h-10 border rounded-md flex flex-col items-center justify-center relative group cursor-pointer transition-colors",
                isToday ? "border-primary bg-primary/5" : "border-neutral-100 hover:bg-neutral-50",
                repayments.length > 0 && "border-orange-200 bg-orange-50/30"
              )}
            >
              <span className={cn(
                "text-[10px]",
                isToday ? "font-bold text-primary" : "text-neutral-600"
              )}>
                {format(day, 'd')}
              </span>
              
              {repayments.length > 0 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  <div className={cn(
                    "h-1 w-1 rounded-full",
                    repayments.some(r => r.status === 'overdue') ? "bg-red-500" : "bg-orange-500"
                  )} />
                  {repayments.length > 1 && <div className="h-1 w-1 rounded-full bg-orange-500" />}
                </div>
              )}

              {/* Tooltip-like hover */}
              {repayments.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-neutral-900 text-white text-[8px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                  <p className="font-bold mb-1 border-b border-white/20 pb-1">{repayments.length} Repayments Due</p>
                  {repayments.slice(0, 3).map((r, idx) => (
                    <p key={idx} className="truncate">• KSh {r.amount.toLocaleString()}</p>
                  ))}
                  {repayments.length > 3 && <p className="mt-1 opacity-60">+{repayments.length - 3} more</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-[10px] text-muted-foreground">Due</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-[10px] text-muted-foreground">Overdue</span>
        </div>
      </div>
    </div>
  );
}
