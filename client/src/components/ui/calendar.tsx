
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
    <div className="p-0">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-4", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center mb-4",
          caption_label: "text-lg font-medium text-gray-900",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-8 w-8 bg-transparent p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full flex items-center justify-center border-0"
          ),
          nav_button_previous: "absolute left-2",
          nav_button_next: "absolute right-2",
          table: "w-full border-collapse",
          head_row: "flex mb-2",
          head_cell: "text-gray-500 rounded-md w-10 h-8 font-medium text-sm text-center flex items-center justify-center",
          row: "flex w-full",
          cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: cn(
            "h-10 w-10 p-0 font-normal text-gray-900 hover:bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          ),
          day_range_end: "day-range-end",
          day_selected: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600 rounded-lg",
          day_today: "bg-blue-500 text-white font-semibold rounded-lg",
          day_outside: "text-gray-300 opacity-50",
          day_disabled: "text-gray-400 opacity-50 cursor-not-allowed",
          day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
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
      <div className="flex justify-center pb-3">
        <button
          onClick={handleTodayClick}
          className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors bg-transparent border-0 cursor-pointer"
        >
          Today
        </button>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
