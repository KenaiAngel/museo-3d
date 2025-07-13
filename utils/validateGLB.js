/**
 * Utilidades para validar y diagnosticar archivos GLB/GLTF
 */

/**
 * Valida si un blob es un archivo GLB válido
 * @param {Blob} blob - El blob a validar
 * @returns {Promise<{isValid: boolean, error?: string, info?: object}>}
 */
export async function validateGLB(blob) {
  try {
    if (!blob || !(blob instanceof Blob)) {
      return { isValid: false, error: "No es un Blob válido" };
    }

    if (blob.size === 0) {
      return { isValid: false, error: "El archivo está vacío" };
    }

    if (blob.size < 20) {
      return { isValid: false, error: "El archivo es demasiado pequeño para ser un GLB válido" };
    }

    // Leer los primeros bytes para verificar la cabecera GLB
    const arrayBuffer = await blob.slice(0, 20).arrayBuffer();
    const view = new DataView(arrayBuffer);

    // Magic number GLB: 0x46546C67 ("glTF" en little-endian)
    const magic = view.getUint32(0, true);
    const expectedMagic = 0x46546C67;

    if (magic !== expectedMagic) {
      return { 
        isValid: false, 
        error: `Magic number incorrecto. Esperado: ${expectedMagic.toString(16)}, obtenido: ${magic.toString(16)}` 
      };
    }

    // Versión GLB (debería ser 2)
    const version = view.getUint32(4, true);
    if (version !== 2) {
      return { 
        isValid: false, 
        error: `Versión GLB no soportada: ${version}. Solo se soporta la versión 2` 
      };
    }

    // Longitud total del archivo
    const length = view.getUint32(8, true);
    if (length !== blob.size) {
      return { 
        isValid: false, 
        error: `Longitud de archivo inconsistente. Header indica: ${length}, tamaño real: ${blob.size}` 
      };
    }

    return {
      isValid: true,
      info: {
        magic: magic.toString(16),
        version,
        length,
        size: blob.size,
        type: blob.type
      }
    };

  } catch (error) {
    return {
      isValid: false,
      error: `Error al validar GLB: ${error.message}`
    };
  }
}

/**
 * Diagnóstica problemas comunes en la generación de modelos 3D
 * @param {Blob} blob - El blob del modelo generado
 * @returns {Promise<{diagnosis: string[], recommendations: string[]}>}
 */
export async function diagnoseModel(blob) {
  const diagnosis = [];
  const recommendations = [];

  const validation = await validateGLB(blob);
  
  if (!validation.isValid) {
    diagnosis.push(`❌ Validación falló: ${validation.error}`);
    
    if (validation.error.includes("Magic number")) {
      recommendations.push("🔧 Verificar que el GLTFExporter esté configurado con binary: true");
      recommendations.push("🔧 Asegurar que el resultado del exporter sea un ArrayBuffer");
    }
    
    if (validation.error.includes("vacío") || validation.error.includes("pequeño")) {
      recommendations.push("🔧 Verificar que la escena tenga geometría válida");
      recommendations.push("🔧 Comprobar que no haya errores en el proceso de exportación");
    }
  } else {
    diagnosis.push("✅ Archivo GLB válido");
    diagnosis.push(`📊 Tamaño: ${(blob.size / 1024).toFixed(2)} KB`);
  }

  // Verificaciones adicionales de tamaño
  if (blob.size < 1000) {
    diagnosis.push("⚠️ Archivo muy pequeño (< 1KB)");
    recommendations.push("🔧 Verificar que la geometría y materiales se estén exportando correctamente");
  }

  if (blob.size > 50 * 1024 * 1024) { // 50MB
    diagnosis.push("⚠️ Archivo muy grande (> 50MB)");
    recommendations.push("🔧 Considerar reducir la resolución de texturas");
    recommendations.push("🔧 Optimizar la geometría");
  }

  return { diagnosis, recommendations };
}


