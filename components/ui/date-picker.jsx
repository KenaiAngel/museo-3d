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
    onChange?.(dateString);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      // Actualizar la posición antes de abrir
      const rect = triggerRef.current.getBoundingClientRect();
      setTriggerRect(rect);
    }
    setIsOpen(!isOpen);
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();

    const days = [];

    // Días del mes anterior
    for (let i = startDate - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    // Días del siguiente mes para completar la grilla
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
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

  return (
    <>
      <div className="relative date-picker-container" ref={triggerRef}>
        <div
          onClick={handleToggle}
          className={`w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-foreground rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 shadow-sm transition placeholder-gray-400 dark:placeholder-gray-500 flex items-center justify-between cursor-pointer ${
            isOpen ? "ring-2 ring-indigo-400 border-indigo-400" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span
              className={
                selectedDate
                  ? "text-foreground"
                  : "text-gray-400 dark:text-gray-500"
              }
            >
              {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen &&
        triggerRect &&
        typeof document !== "undefined" &&
        createPortal(
          <DatePickerContent
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            triggerRect={triggerRect}
            monthNames={monthNames}
            dayNames={dayNames}
            getDaysInMonth={getDaysInMonth}
            navigateMonth={navigateMonth}
          />,
          document.body
        )}
    </>
  );
}

function DatePickerContent({
  currentMonth,
  selectedDate,
  onDateChange,
  triggerRect,
  monthNames,
  dayNames,
  getDaysInMonth,
  navigateMonth,
}) {
  // Si no hay triggerRect, no renderizar nada
  if (!triggerRect) {
    return null;
  }

  const style = {
    position: "fixed",
    top: triggerRect.bottom + window.scrollY + 4,
    left: triggerRect.left + window.scrollX,
    minWidth: 320,
    zIndex: 99999,
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  const selectedDateObj = selectedDate
    ? new Date(selectedDate + "T00:00:00")
    : null;

  return (
    <div
      className="date-picker-content bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4"
      style={style}
    >
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-semibold text-foreground">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dayObj, index) => {
          const isToday = dayObj.date.toDateString() === today.toDateString();
          const isSelected =
            selectedDateObj &&
            dayObj.date.toDateString() === selectedDateObj.toDateString();

          return (
            <button
              key={index}
              type="button"
              onClick={() => onDateChange(dayObj.date)}
              className={`p-2 text-center text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                ${!dayObj.isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-foreground"}
                ${isToday ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold" : ""}
                ${isSelected ? "bg-indigo-600 text-white hover:bg-indigo-700" : ""}
              `}
            >
              {dayObj.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
