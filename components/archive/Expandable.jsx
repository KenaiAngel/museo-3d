import { useEffect, useRef, useId } from "react";
import { motion } from "framer-motion";
import { useOutsideClick } from "./useOutsideClick";

export default function ExpandableCard({ card, onClose }) {
  const id = useId();
  const ref = useRef(null);
  useOutsideClick(ref, onClose);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 z-40 flex justify-center items-center p-4 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        layoutId={`card-${card.title}-${id}`}
        ref={ref}
        className="relative bg-white dark:bg-neutral-900 w-full max-w-6xl p-6 rounded-2xl shadow-xl z-50 flex flex-col md:flex-row min-h-[500px]"
      >
        {/* Botón de cierre en la esquina */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold text-red-500 z-10"
        >
          ×
        </button>

        {/* Imagen */}
        {card.src && (
          <div className="w-full md:w-3/5 flex justify-center items-center overflow-hidden max-h-[80vh]">
            <img
              src={card.src}
              alt={card.title}
              className="max-h-[80vh] w-auto object-contain rounded-lg shadow-xl"
            />
          </div>
        )}

        {/* Información */}
        <div className="w-full md:w-2/5 flex flex-col justify-center items-center text-center px-4 text-black">
          <h2 className="text-2xl font-semibold mt-2">{card.title}</h2>
          {card.autor && card.autor.includes(',') ? (
            <div className="text-sm">
              {card.autor.split(',').map((a, i) => (
                <div key={i}>{a.trim()}</div>
              ))}
            </div>
          ) : (
            <p className="text-sm">{card.autor}</p>
          )}
          <p className="text-sm">{card.colab}</p>
          <p className="text-sm">{card.tecnica}</p>
          <p className="text-sm">{card.medidas}</p>
          <p className="text-sm">{card.anio}</p>
          {card.description && (
            <p className="mt-2 text-sm">{card.description}</p>
          )}
          <div className="mt-4 text-sm overflow-auto max-h-60">
            {typeof card.content === "function" ? card.content() : card.content}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
