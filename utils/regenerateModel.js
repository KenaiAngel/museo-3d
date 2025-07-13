// Script temporal para regenerar el modelo 3D corrupto
// Ejecutar en el browser console o como test

import { generateMuralGLB } from './utils/generateMuralGLB.js';
import { validateGLB } from './utils/validateGLB.js';
import { uploadModelToCloudinary } from './utils/uploadToCloudinary.js';

export const regenerateModel = async (imageUrl, muralTitle) => {
  try {
    console.log("🔧 Regenerando modelo para:", muralTitle);
    console.log("📷 Imagen URL:", imageUrl);
    
    // Generar nuevo modelo
    console.log("🎨 Generando modelo GLB...");
    const glbBlob = await generateMuralGLB(imageUrl);
    
    // Validar
    console.log("✅ Validando modelo...");
    const validation = await validateGLB(glbBlob);
    
    if (!validation.isValid) {
      throw new Error(`Modelo inválido: ${validation.error}`);
    }
    
    console.log("📊 Modelo válido:", {
      size: Math.round(glbBlob.size / 1024) + " KB",
      type: glbBlob.type
    });
    
    // Subir a Cloudinary
    console.log("☁️ Subiendo a Cloudinary...");
    const fileName = `${muralTitle.replace(/[^a-zA-Z0-9]/g, '_')}.glb`;
    const cloudinaryUrl = await uploadModelToCloudinary(glbBlob, fileName);
    
    console.log("✅ Modelo regenerado exitosamente!");
    console.log("🔗 Nueva URL:", cloudinaryUrl);
    
    return {
      success: true,
      url: cloudinaryUrl,
      size: glbBlob.size,
      validation
    };
    
  } catch (error) {
    console.error("❌ Error regenerando modelo:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Para usar:
// regenerateModel("https://res.cloudinary.com/daol1ohso/image/upload/v1752383749/murales/qweqwe.png", "qweqwe");
