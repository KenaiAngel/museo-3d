"use client";

import React, { useState, useEffect } from 'react';
import { validateGLB, diagnoseModel, testModelGeneration } from '../utils/validateGLB';
import { generateSimpleGLB } from '../utils/generateSimpleGLB';
import { generateMuralGLB, generateMuralGLBFallback } from '../utils/generateMuralGLB';

export default function ModelTester() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const addResult = (result) => {
    setResults(prev => [{
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      ...result
    }, ...prev]);
  };

  const testSimpleGLB = async () => {
    if (!isClient) {
      addResult({
        test: "Simple GLB",
        success: false,
        error: "Componente no montado en el cliente"
      });
      return;
    }

    setLoading(true);
    try {
      console.log("🧪 Probando generateSimpleGLB...");
      
      const blob = await generateSimpleGLB(true);
      const validation = await validateGLB(blob);
      const diagnostic = await diagnoseModel(blob);
      
      addResult({
        test: "Simple GLB",
        success: validation.isValid,
        blob,
        validation,
        diagnostic
      });
      
    } catch (error) {
      console.error("Error en test Simple GLB:", error);
      addResult({
        test: "Simple GLB", 
        success: false,
        error: error.message
      });
    }
    setLoading(false);
  };

  const testMuralGLB = async () => {
    if (!isClient) {
      addResult({
        test: "Mural GLB",
        success: false,
        error: "Componente no montado en el cliente"
      });
      return;
    }

    setLoading(true);
    try {
      console.log("🧪 Probando generateMuralGLB...");
      
      // Usar la imagen local que existe en el proyecto
      const testImageUrl = "/placeholder-image.jpg";
      const blob = await generateMuralGLB(testImageUrl);
      const validation = await validateGLB(blob);
      const diagnostic = await diagnoseModel(blob);
      
      addResult({
        test: "Mural GLB",
        success: validation.isValid,
        blob,
        validation,
        diagnostic
      });
      
    } catch (error) {
      console.error("Error en test Mural GLB:", error);
      addResult({
        test: "Mural GLB",
        success: false,
        error: error.message
      });
    }
    setLoading(false);
  };

  const testMuralGLBFallback = async () => {
    if (!isClient) {
      addResult({
        test: "Mural GLB Fallback",
        success: false,
        error: "Componente no montado en el cliente"
      });
      return;
    }

    setLoading(true);
    try {
      console.log("🧪 Probando generateMuralGLBFallback...");
      
      const blob = await generateMuralGLBFallback("#4F46E5", "MUSEO 3D");
      const validation = await validateGLB(blob);
      const diagnostic = await diagnoseModel(blob);
      
      addResult({
        test: "Mural GLB Fallback",
        success: validation.isValid,
        blob,
        validation,
        diagnostic
      });
      
    } catch (error) {
      console.error("Error en test Mural GLB Fallback:", error);
      addResult({
        test: "Mural GLB Fallback",
        success: false,
        error: error.message
      });
    }
    setLoading(false);
  };

  const testMuralWithCustomImage = async (imageUrl) => {
    if (!isClient) {
      addResult({
        test: "Mural Personalizado",
        success: false,
        error: "Componente no montado en el cliente"
      });
      return;
    }

    setLoading(true);
    try {
      console.log("🧪 Probando generateMuralGLB con imagen personalizada...");
      
      const blob = await generateMuralGLB(imageUrl);
      const validation = await validateGLB(blob);
      const diagnostic = await diagnoseModel(blob);
      
      addResult({
        test: "Mural Personalizado",
        success: validation.isValid,
        blob,
        validation,
        diagnostic,
        imageUrl
      });
      
    } catch (error) {
      console.error("Error en test Mural Personalizado:", error);
      addResult({
        test: "Mural Personalizado",
        success: false,
        error: error.message,
        imageUrl
      });
    }
    setLoading(false);
  };

  const runCompleteTest = async () => {
    if (!isClient) {
      addResult({
        test: "Complete Test",
        success: false,
        error: "Componente no montado en el cliente"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await testModelGeneration(() => generateSimpleGLB(true));
      addResult({
        test: "Complete Test",
        ...result
      });
    } catch (error) {
      addResult({
        test: "Complete Test",
        success: false,
        error: error.message
      });
    }
    setLoading(false);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [customImageUrl, setCustomImageUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setCustomImageUrl(url);
        testMuralWithCustomImage(url);
      } else {
        addResult({
          test: "Mural Personalizado",
          success: false,
          error: "El archivo debe ser una imagen"
        });
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setCustomImageUrl(url);
        testMuralWithCustomImage(url);
      } else {
        addResult({
          test: "Mural Personalizado",
          success: false,
          error: "El archivo debe ser una imagen"
        });
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🧪 Diagnóstico de Modelos 3D</h2>
      
      {!isClient && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            ⏳ Inicializando herramientas de diagnóstico...
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button 
          onClick={testSimpleGLB}
          disabled={loading || !isClient}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "⏳" : "🔹"} Test Simple GLB
        </button>
        
        <button 
          onClick={testMuralGLB}
          disabled={loading || !isClient}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "⏳" : "🖼️"} Test Mural GLB
        </button>
        
        <button 
          onClick={testMuralGLBFallback}
          disabled={loading || !isClient}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "⏳" : "🎨"} Test Fallback
        </button>
        
        <button 
          onClick={runCompleteTest}
          disabled={loading || !isClient}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "⏳" : "🔬"} Test Completo
        </button>
      </div>

      {/* Sección para imagen personalizada */}
      <div className="mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🖼️ Probar con Tu Propia Imagen
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-2">URL de Imagen:</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                disabled={loading || !isClient}
              />
              <button
                onClick={() => testMuralWithCustomImage(customImageUrl)}
                disabled={loading || !isClient || !customImageUrl}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Probar
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Subir Archivo:</label>
            <div
              className={`relative border-2 border-dashed rounded-md p-4 text-center transition-colors ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                disabled={loading || !isClient}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {dragActive ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    📁 Suelta la imagen aquí
                  </span>
                ) : (
                  <>
                    📎 Arrastra una imagen aquí o <span className="text-indigo-600 dark:text-indigo-400 font-medium">haz clic para seleccionar</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick test buttons for common images */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">🚀 Pruebas rápidas:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const url = 'https://images.unsplash.com/photo-1569163139394-de44cb3b4ef0?w=800&h=600&fit=crop';
                setCustomImageUrl(url);
                testMuralWithCustomImage(url);
              }}
              disabled={loading || !isClient}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              🎨 Arte Abstracto
            </button>
            <button
              onClick={() => {
                const url = 'https://images.unsplash.com/photo-1577720580827-78669ac5e5a8?w=800&h=600&fit=crop';
                setCustomImageUrl(url);
                testMuralWithCustomImage(url);
              }}
              disabled={loading || !isClient}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              🏛️ Arte Clásico
            </button>
            <button
              onClick={() => {
                const url = 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop';
                setCustomImageUrl(url);
                testMuralWithCustomImage(url);
              }}
              disabled={loading || !isClient}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              🌈 Mural Colorido
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                {result.success ? "✅" : "❌"} {result.test}
              </h3>
              <span className="text-sm text-gray-500">{result.timestamp}</span>
            </div>
            
            {/* Mostrar vista previa de la imagen para tests personalizados */}
            {result.imageUrl && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">🖼️ Imagen utilizada:</p>
                <img 
                  src={result.imageUrl} 
                  alt="Preview" 
                  className="max-w-32 max-h-24 object-cover rounded border"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {result.error && (
              <div className="text-red-600 text-sm mb-2">
                <strong>Error:</strong> {result.error}
              </div>
            )}
            
            {result.validation && (
              <div className="text-sm mb-2">
                <strong>Validación:</strong> 
                <span className={result.validation.isValid ? "text-green-600" : "text-red-600"}>
                  {result.validation.isValid ? " ✅ Válido" : ` ❌ ${result.validation.error}`}
                </span>
                {result.validation.info && (
                  <div className="ml-4 text-gray-600">
                    Tamaño: {(result.validation.info.size / 1024).toFixed(2)} KB | 
                    Versión: {result.validation.info.version}
                  </div>
                )}
              </div>
            )}
            
            {result.diagnostic && (
              <div className="text-sm">
                <div className="mb-2">
                  <strong>Diagnóstico:</strong>
                  <ul className="ml-4 list-disc list-inside">
                    {result.diagnostic.diagnosis.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                {result.diagnostic.recommendations.length > 0 && (
                  <div>
                    <strong>Recomendaciones:</strong>
                    <ul className="ml-4 list-disc list-inside">
                      {result.diagnostic.recommendations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {result.blob && (
              <div className="mt-2">
                <button 
                  onClick={() => downloadBlob(result.blob, `test-${result.test.toLowerCase().replace(/\s+/g, '-')}.glb`)}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                >
                  📥 Descargar GLB
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {results.length > 0 && (
        <button 
          onClick={() => setResults([])}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          🗑️ Limpiar Resultados
        </button>
      )}
    </div>
  );
}