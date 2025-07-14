import React, { useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || "");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const triggerRef = React.useRef(null);
  const [triggerRect, setTriggerRect] = React.useState(null);

  // Sincronizar el valor externo con el estado interno
  React.useEffect(() => {
    setSelectedDate(value || "");
  }, [value]);

  // Actualizar la posición del trigger cuando se abre
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTriggerRect(rect);
    }
  }, [isOpen]);

  // Manejar click outside y escape
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".date-picker-content")) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  const handleDateChange = (date) => {
    const dateString = date.toISOString().split("T")[0];
    setSelectedDate(dateString);
    if (onChange) {
      onChange(dateString);
    }
    setIsOpen(false);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Días del mes anterior para completar la primera semana
    const prevMonth = new Date(year, month - 1, 0);
    const daysFromPrevMonth = startingDayOfWeek;
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month - 1, day),
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      });
    }

    // Días del siguiente mes para completar las 6 semanas
    const totalCells = 42; // 6 semanas × 7 días
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day),
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    const dateString = date.toISOString().split("T")[0];
    return dateString === selectedDate;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const calendarDays = generateCalendar();

  const calendarContent = (
    <div
      className="date-picker-content absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80"
      style={{
        top: triggerRect ? triggerRect.bottom + window.scrollY + 8 : 0,
        left: triggerRect ? triggerRect.left + window.scrollX : 0,
      }}
    >
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h3 className="font-semibold text-lg">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Nombres de los días */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayObj, index) => {
          const { day, isCurrentMonth, date } = dayObj;
          const selected = isDateSelected(date);
          const today = isToday(date);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateChange(date)}
              className={`
                p-2 text-sm rounded hover:bg-blue-50 transition-colors
                ${!isCurrentMonth ? "text-gray-300" : "text-gray-900"}
                ${selected ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
                ${today && !selected ? "bg-blue-100 text-blue-600" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
      >
        <span className={selectedDate ? "text-gray-900" : "text-gray-500"}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </span>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </button>

      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(calendarContent, document.body)}
    </div>
  );
}

export default DatePicker;
