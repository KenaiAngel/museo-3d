"use client";

import { motion } from "framer-motion";
import { Upload, X } from "lucide-react";
import { useFileUpload } from "../hooks/useFileUpload";

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { getRootProps, getInputProps, isDragActive } = useFileUpload((result) => {
    onUploadSuccess?.(result);
    onClose();
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Subir Imagen
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz click'}
            </p>
            <p className="text-sm text-muted-foreground">
              Formatos soportados: JPG, PNG, GIF, WebP
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
