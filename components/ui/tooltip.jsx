import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";

export function Tooltip({ children }) {
  return children;
}

export function TooltipTrigger({ children, onOpen, onClose }) {
  // El trigger solo pasa los handlers
  return React.cloneElement(children, {
    onMouseEnter: (e) => {
      children.props.onMouseEnter && children.props.onMouseEnter(e);
      onOpen && onOpen();
    },
    onMouseLeave: (e) => {
      children.props.onMouseLeave && children.props.onMouseLeave(e);
      onClose && onClose();
    },
    tabIndex: 0,
    onFocus: (e) => {
      children.props.onFocus && children.props.onFocus(e);
      onOpen && onOpen();
    },
    onBlur: (e) => {
      children.props.onBlur && children.props.onBlur(e);
      onClose && onClose();
    },
    ref: children.ref,
  });
}

export function TooltipContent({ anchorRef, open, children, side = "top", className = "" }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef();

  useEffect(() => {
    if (open && anchorRef?.current && tooltipRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let top = 0, left = 0;
      if (side === "top") {
        top = rect.top + window.scrollY - tooltipRect.height - 8;
        left = rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;
      } else if (side === "bottom") {
        top = rect.bottom + window.scrollY + 8;
        left = rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;
      } else if (side === "right") {
        top = rect.top + window.scrollY + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + window.scrollX + 8;
      } else if (side === "left") {
        top = rect.top + window.scrollY + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left + window.scrollX - tooltipRect.width - 8;
      }
      setPos({ top, left });
    }
  }, [open, anchorRef, side, children]);

  if (!open) return null;
  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 99999,
        pointerEvents: "auto",
      }}
      className={
        "bg-white dark:bg-neutral-900 border-2 border-pink-400 dark:border-pink-700 rounded-xl shadow-xl p-2 text-xs min-w-[140px] max-w-xs whitespace-pre-line pointer-events-auto backdrop-blur-md " +
        className
      }
      role="tooltip"
    >
      {children}
    </div>,
    typeof window !== "undefined" ? document.body : null
  );
} 