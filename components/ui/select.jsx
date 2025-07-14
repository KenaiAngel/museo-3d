import React from "react";
import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

export function Select({ children, value, onValueChange, placeholder }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value || "");
  const triggerRef = React.useRef(null);
  const [triggerRect, setTriggerRect] = React.useState(null);

  // Sincronizar el valor externo con el estado interno
  React.useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  // Actualizar la posición del trigger cuando se abre
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTriggerRect(rect);
    }
  }, [isOpen]);

  const handleSelect = (selectValue) => {
    setSelectedValue(selectValue);
    onValueChange?.(selectValue);
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

  // Obtener el texto a mostrar basado en el valor seleccionado
  const getDisplayText = () => {
    if (!selectedValue) return placeholder;

    // Buscar el item seleccionado entre los children
    let displayText = selectedValue;
    React.Children.forEach(children, (child) => {
      if (child.props.value === selectedValue) {
        displayText = child.props.children;
      }
    });
    return displayText;
  };

  return (
    <>
      <div className="relative" ref={triggerRef}>
        <SelectTrigger
          onClick={handleToggle}
          className={isOpen ? "ring-2 ring-indigo-400" : ""}
        >
          <SelectValue
            placeholder={placeholder}
            value={selectedValue}
            displayText={getDisplayText()}
          />
        </SelectTrigger>
      </div>
      {isOpen &&
        triggerRect &&
        typeof document !== "undefined" &&
        createPortal(
          <SelectContent
            onClose={() => setIsOpen(false)}
            triggerRect={triggerRect}
          >
            {React.Children.map(children, (child) =>
              React.cloneElement(child, { onSelect: handleSelect })
            )}
          </SelectContent>,
          document.body
        )}
    </>
  );
}

export function SelectTrigger({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 shadow-sm transition placeholder-gray-400 dark:placeholder-gray-500 flex items-center justify-between ${className}`}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder, value, displayText }) {
  return (
    <span className={!value ? "text-gray-400 dark:text-gray-500" : ""}>
      {displayText || placeholder}
    </span>
  );
}

export function SelectContent({ children, onClose, triggerRect }) {
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".select-content")) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Si no hay triggerRect, no renderizar nada
  if (!triggerRect) {
    return null;
  }

  const style = {
    position: "fixed",
    top: triggerRect.bottom + window.scrollY + 4,
    left: triggerRect.left + window.scrollX,
    width: triggerRect.width,
    zIndex: 99999,
  };

  return (
    <div
      className="select-content bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-80 overflow-y-auto"
      style={style}
    >
      {children}
    </div>
  );
}

export function SelectItem({ children, value, onSelect, image, description }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-3"
    >
      {image && (
        <img
          src={image}
          alt={children}
          className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">{children}</div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
