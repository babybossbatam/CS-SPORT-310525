
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
    <div className="p-0 bg-white rounded-lg shadow-sm border border-gray-200">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-4 bg-white", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4 bg-white",
          caption: "flex justify-center pt-3 relative items-center mb-4",
          caption_label: "text-lg font-semibold text-gray-800",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-8 w-8 bg-white p-0 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full flex items-center justify-center border-0 shadow-sm"
          ),
          nav_button_previous: "absolute left-2",
          nav_button_next: "absolute right-2",
          table: "w-full border-collapse bg-white",
          head_row: "flex mb-3",
          head_cell: "text-gray-600 w-10 h-8 font-medium text-sm text-center flex items-center justify-center",
          row: "flex w-full",
          cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: cn(
            "h-10 w-10 p-0 font-normal text-gray-800 hover:bg-blue-50 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200"
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
            <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
          ),
          IconRight: ({ className, ...props }) => (
            <ChevronRight className={cn("h-4 w-4", className)} {...props} />
          ),
        }}
        {...props}
      />
      <div className="flex justify-center pb-4 pt-2 bg-white">
        <button
          onClick={handleTodayClick}
          className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors bg-white border-0 cursor-pointer px-2 py-1"
        >
          Today
        </button>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
