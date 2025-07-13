export async function generateMuralGLB(imageUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      // Importar Three.js de manera dinámica para evitar problemas de SSR
      const THREE = await import('three');
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter');
      
      const scene = new THREE.Scene();
      const width = 2;
      const height = 1.5;

      // Cargar la textura con configuración mejorada
      const loader = new THREE.TextureLoader();
      
      // Configurar crossOrigin para manejar CORS
      loader.setCrossOrigin('anonymous');
      
      loader.load(
        imageUrl,
        (texture) => {
          try {
            // Configurar la textura para mejor calidad
            texture.flipY = false; // Importante para GLTF
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
            const material = new THREE.MeshBasicMaterial({ 
              map: texture,
              side: THREE.DoubleSide,
              transparent: false,
              opacity: 1.0
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Asegurar transformaciones válidas
            mesh.position.set(0, 0, 0);
            mesh.rotation.set(0, 0, 0);
            mesh.scale.set(1, 1, 1);
            
            scene.add(mesh);

            const exporter = new GLTFExporter();
            
            const exportOptions = {
              binary: true,
              onlyVisible: true,
              truncateDrawRange: true,
              embedImages: true,
              maxTextureSize: 2048, // Aumentado para imágenes
              includeCustomExtensions: false
            };

            exporter.parse(
              scene,
              (result) => {
                try {
                  if (result instanceof ArrayBuffer) {
                    const blob = new Blob([result], { type: "model/gltf-binary" });
                    
                    console.log("Mural GLB generado:", {
                      size: Math.round(blob.size / 1024) + " KB"
                    });
                    
                    resolve(blob);
                  } else {
                    reject(new Error("Error en la exportación: formato de resultado inválido"));
                  }
                } catch (error) {
                  reject(error);
                }
              },
              (error) => {
                reject(new Error(`Error al exportar mural 3D: ${error.message || error}`));
              },
              exportOptions
            );
          } catch (error) {
            reject(error);
          }
        },
        (progress) => {
          // Progreso simplificado
          if (progress.total > 0) {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            if (percentage % 25 === 0) { // Solo log cada 25%
              console.log(`Cargando imagen: ${percentage}%`);
            }
          }
        },
        (error) => {
          // Error simplificado pero específico
          let errorMessage = "URL inválida o imagen no accesible";
          
          if (imageUrl.startsWith('http') && !imageUrl.startsWith('https://')) {
            errorMessage = "URL HTTP no segura. Intenta con HTTPS.";
          } else if (error.message && error.message.includes('404')) {
            errorMessage = "Imagen no encontrada (404).";
          } else if (error.message && error.message.includes('network')) {
            errorMessage = "Error de red al cargar la imagen.";
          }
          
          reject(new Error(`Error al cargar imagen: ${errorMessage}`));
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Genera un mural GLB con una textura creada programáticamente (fallback)
 * @param {string} color - Color hexadecimal para la textura (ej: "#ff0000")
 * @param {string} text - Texto a mostrar en la textura
 * @returns {Promise<Blob>}
 */
export async function generateMuralGLBFallback(color = "#ffffff", text = "TEST") {
  return new Promise(async (resolve, reject) => {
    try {
      const THREE = await import('three');
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter');
      
      const scene = new THREE.Scene();
      const width = 2;
      const height = 1.5;

      // Crear una textura usando Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 384;
      const context = canvas.getContext('2d');
      
      // Fondo
      context.fillStyle = color;
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Texto
      context.fillStyle = color === "#ffffff" ? "#000000" : "#ffffff";
      context.font = "bold 48px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      // Borde
      context.strokeStyle = context.fillStyle;
      context.lineWidth = 4;
      context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      // Crear textura de Three.js desde el canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.flipY = false;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1.0
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      scene.add(mesh);

      const exporter = new GLTFExporter();
      
      const exportOptions = {
        binary: true,
        onlyVisible: true,
        truncateDrawRange: true,
        embedImages: true,
        maxTextureSize: 2048,
        includeCustomExtensions: false
      };

      exporter.parse(
        scene,
        (result) => {
          try {
            if (result instanceof ArrayBuffer) {
              const blob = new Blob([result], { type: "model/gltf-binary" });
              
              console.log("Mural fallback generado:", {
                size: Math.round(blob.size / 1024) + " KB"
              });
              
              resolve(blob);
            } else {
              reject(new Error("Error en la exportación: formato de resultado inválido"));
            }
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error(`Error al exportar mural 3D: ${error.message || error}`));
        },
        exportOptions
      );
    } catch (error) {
      reject(error);
    }
  });
}
