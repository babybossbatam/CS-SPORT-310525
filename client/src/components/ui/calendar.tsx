
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
    <div className="p-0 bg-white">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-4 bg-white w-full min-w-[400px]", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4 bg-white w-full",
          caption: "flex justify-center pt-3 relative items-center mb-4",
          caption_label: "text-lg font-semibold text-gray-800",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-8 w-8 bg-white p-0 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full flex items-center justify-center"
          ),
          nav_button_previous: "absolute left-2",
          nav_button_next: "absolute right-2",
          table: "w-full border-collapse bg-white min-w-[350px]",
          head_row: "flex mb-3",
          head_cell: "text-gray-600 flex-1 h-8 font-medium text-sm text-center flex items-center justify-center min-w-[50px]",
          row: "flex w-full",
          cell: "flex-1 h-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 min-w-[50px]",
          day: cn(
            "h-10 w-full p-0 font-normal text-gray-800 hover:bg-blue-50 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 min-w-[50px]"
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
          className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors bg-white cursor-pointer px-2 py-1"
        >
          Today
        </button>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
