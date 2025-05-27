
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const today = new Date()
  
  const handleTodayClick = () => {
    if (props.onSelect) {
      props.onSelect(today)
    }
  }

  return (
    <div className="flex flex-col justify-center p-0 bg-white">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3 bg-white w-full max-w-[245px] min-w-[220px]", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-2 sm:space-x-2 sm:space-y-0",
          month: "space-y-2 bg-white w-full",
          caption: "flex justify-center pt-1 relative items-center mb-3",
          caption_label: "text-base font-semibold text-gray-800",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-6 w-6 bg-white p-0 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full flex items-center justify-center"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse bg-white min-w-[196px]",
          head_row: "flex mb-2",
          head_cell: "text-gray-600 flex-1 h-6 font-medium text-xs text-center flex items-center justify-center min-w-[29px]",
          row: "flex w-full",
          cell: "flex-1 h-7 text-center text-xs p-0 relative focus-within:relative focus-within:z-20 min-w-[29px]",
          day: cn(
            "h-7 w-full p-0 font-normal text-gray-800 hover:bg-blue-50 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 min-w-[29px]"
          ),
          day_range_end: "day-range-end",
          day_selected: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600 rounded-lg font-medium",
          day_today: "bg-blue-500 text-white font-semibold rounded-lg",
          day_outside: "text-gray-400 opacity-60",
          day_disabled: "text-gray-300 opacity-40 cursor-not-allowed",
          day_range_middle: "aria-selected:bg-blue-50 aria-selected:text-gray-800",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ className, ...props }) => (
            <ChevronLeft className={cn("h-3 w-3", className)} {...props} />
          ),
          IconRight: ({ className, ...props }) => (
            <ChevronRight className={cn("h-3 w-3", className)} {...props} />
          ),
        }}
        {...props}
      />
      <div className="flex justify-center pb-2 pt-0.5 bg-white">
        <button
          onClick={handleTodayClick}
          className="text-blue-500 text-xs font-medium hover:text-blue-600 transition-colors bg-white cursor-pointer px-0.5 py-0.5"
        >
          Today
        </button>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
