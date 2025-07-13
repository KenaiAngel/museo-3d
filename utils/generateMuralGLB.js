export async function generateMuralGLB(imageUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      // Importar Three.js de manera dinámica para evitar problemas de SSR
      const THREE = await import('three');
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter');
      
      const scene = new THREE.Scene();
      // Hacer el modelo más pequeño para AR
      const width = 0.8;
      const height = 0.6;

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

            // Crear geometría del cuadro principal
            const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
            const material = new THREE.MeshPhongMaterial({ 
              map: texture,
              side: THREE.DoubleSide,
              transparent: false,
              opacity: 1.0,
              shininess: 10
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 0, 0.04); // Más adelante para estar sobre el marco
            
            // Crear marco volumétrico más realista
            const frameGroup = new THREE.Group();
            
            // Parámetros del marco - mucho más prominente
            const frameDepth = 0.12;
            const frameWidth = 0.08;
            const outerWidth = width + frameWidth * 2;
            const outerHeight = height + frameWidth * 2;
            
            // Crear textura de madera procedural
            const createWoodTexture = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const ctx = canvas.getContext('2d');
              
              // Base de madera
              ctx.fillStyle = '#8B4513';
              ctx.fillRect(0, 0, 256, 256);
              
              // Vetas de madera
              for (let i = 0; i < 20; i++) {
                ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.4})`;
                ctx.lineWidth = 1 + Math.random() * 3;
                ctx.beginPath();
                ctx.moveTo(0, Math.random() * 256);
                ctx.quadraticCurveTo(128, Math.random() * 256, 256, Math.random() * 256);
                ctx.stroke();
              }
              
              return new THREE.CanvasTexture(canvas);
            };
            
            const woodTexture = createWoodTexture();
            woodTexture.wrapS = THREE.RepeatWrapping;
            woodTexture.wrapT = THREE.RepeatWrapping;
            woodTexture.repeat.set(2, 2);
            
            // Material del marco principal con textura
            const frameMaterial = new THREE.MeshPhongMaterial({ 
              map: woodTexture,
              color: 0x8B4513,
              shininess: 60,
              specular: 0x444444,
              side: THREE.DoubleSide
            });
            
            // Material para el repujado (más oscuro)
            const embossedMaterial = new THREE.MeshPhongMaterial({ 
              color: 0x654321,
              shininess: 80,
              specular: 0x666666,
              side: THREE.DoubleSide
            });
            
            // Marco principal - superior
            const topFrame = new THREE.BoxGeometry(outerWidth, frameWidth, frameDepth);
            const topMesh = new THREE.Mesh(topFrame, frameMaterial);
            topMesh.position.set(0, height/2 + frameWidth/2, 0);
            frameGroup.add(topMesh);
            
            // Marco principal - inferior
            const bottomFrame = new THREE.BoxGeometry(outerWidth, frameWidth, frameDepth);
            const bottomMesh = new THREE.Mesh(bottomFrame, frameMaterial);
            bottomMesh.position.set(0, -height/2 - frameWidth/2, 0);
            frameGroup.add(bottomMesh);
            
            // Marco principal - izquierdo
            const leftFrame = new THREE.BoxGeometry(frameWidth, height, frameDepth);
            const leftMesh = new THREE.Mesh(leftFrame, frameMaterial);
            leftMesh.position.set(-width/2 - frameWidth/2, 0, 0);
            frameGroup.add(leftMesh);
            
            // Marco principal - derecho
            const rightFrame = new THREE.BoxGeometry(frameWidth, height, frameDepth);
            const rightMesh = new THREE.Mesh(rightFrame, frameMaterial);
            rightMesh.position.set(width/2 + frameWidth/2, 0, 0);
            frameGroup.add(rightMesh);
            
            // Repujado exterior - crear relieve
            const embossWidth = 0.015;
            const embossHeight = 0.008;
            
            // Repujado superior exterior
            const topEmbossOut = new THREE.BoxGeometry(outerWidth + embossWidth, embossWidth, embossHeight);
            const topEmbossOutMesh = new THREE.Mesh(topEmbossOut, embossedMaterial);
            topEmbossOutMesh.position.set(0, height/2 + frameWidth + embossWidth/2, frameDepth/2 + embossHeight/2);
            frameGroup.add(topEmbossOutMesh);
            
            // Repujado inferior exterior
            const bottomEmbossOut = new THREE.BoxGeometry(outerWidth + embossWidth, embossWidth, embossHeight);
            const bottomEmbossOutMesh = new THREE.Mesh(bottomEmbossOut, embossedMaterial);
            bottomEmbossOutMesh.position.set(0, -height/2 - frameWidth - embossWidth/2, frameDepth/2 + embossHeight/2);
            frameGroup.add(bottomEmbossOutMesh);
            
            // Repujado izquierdo exterior
            const leftEmbossOut = new THREE.BoxGeometry(embossWidth, height + frameWidth * 2, embossHeight);
            const leftEmbossOutMesh = new THREE.Mesh(leftEmbossOut, embossedMaterial);
            leftEmbossOutMesh.position.set(-width/2 - frameWidth - embossWidth/2, 0, frameDepth/2 + embossHeight/2);
            frameGroup.add(leftEmbossOutMesh);
            
            // Repujado derecho exterior
            const rightEmbossOut = new THREE.BoxGeometry(embossWidth, height + frameWidth * 2, embossHeight);
            const rightEmbossOutMesh = new THREE.Mesh(rightEmbossOut, embossedMaterial);
            rightEmbossOutMesh.position.set(width/2 + frameWidth + embossWidth/2, 0, frameDepth/2 + embossHeight/2);
            frameGroup.add(rightEmbossOutMesh);
            
            // Repujado interior - crear canal
            const innerEmbossWidth = 0.01;
            const innerEmbossDepth = 0.006;
            
            // Canal superior interior
            const topEmbossIn = new THREE.BoxGeometry(width + innerEmbossWidth, innerEmbossWidth, innerEmbossDepth);
            const topEmbossInMesh = new THREE.Mesh(topEmbossIn, embossedMaterial);
            topEmbossInMesh.position.set(0, height/2 + innerEmbossWidth/2, frameDepth/2 - innerEmbossDepth/2);
            frameGroup.add(topEmbossInMesh);
            
            // Canal inferior interior
            const bottomEmbossIn = new THREE.BoxGeometry(width + innerEmbossWidth, innerEmbossWidth, innerEmbossDepth);
            const bottomEmbossInMesh = new THREE.Mesh(bottomEmbossIn, embossedMaterial);
            bottomEmbossInMesh.position.set(0, -height/2 - innerEmbossWidth/2, frameDepth/2 - innerEmbossDepth/2);
            frameGroup.add(bottomEmbossInMesh);
            
            // Canal izquierdo interior
            const leftEmbossIn = new THREE.BoxGeometry(innerEmbossWidth, height, innerEmbossDepth);
            const leftEmbossInMesh = new THREE.Mesh(leftEmbossIn, embossedMaterial);
            leftEmbossInMesh.position.set(-width/2 - innerEmbossWidth/2, 0, frameDepth/2 - innerEmbossDepth/2);
            frameGroup.add(leftEmbossInMesh);
            
            // Canal derecho interior
            const rightEmbossIn = new THREE.BoxGeometry(innerEmbossWidth, height, innerEmbossDepth);
            const rightEmbossInMesh = new THREE.Mesh(rightEmbossIn, embossedMaterial);
            rightEmbossInMesh.position.set(width/2 + innerEmbossWidth/2, 0, frameDepth/2 - innerEmbossDepth/2);
            frameGroup.add(rightEmbossInMesh);
            
            // Fondo del marco
            const backGeometry = new THREE.BoxGeometry(outerWidth, outerHeight, 0.03);
            const backMaterial = new THREE.MeshPhongMaterial({ 
              color: 0x4A4A4A,
              shininess: 5,
              side: THREE.DoubleSide
            });
            const backMesh = new THREE.Mesh(backGeometry, backMaterial);
            backMesh.position.set(0, 0, -frameDepth/2);
            frameGroup.add(backMesh);
            
            // Asegurar transformaciones válidas
            mesh.rotation.set(0, 0, 0);
            mesh.scale.set(1, 1, 1);
            
            frameGroup.position.set(0, 0, 0);
            frameGroup.rotation.set(0, 0, 0);
            frameGroup.scale.set(1, 1, 1);
            
            scene.add(mesh);
            scene.add(frameGroup);

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
      // Hacer el modelo más pequeño para AR
      const width = 0.8;
      const height = 0.6;

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

      // Crear geometría del cuadro principal
      const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1.0
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0.02); // Ligeramente hacia adelante
      
      // Crear marco volumétrico
      const frameGroup = new THREE.Group();
      
      // Parámetros del marco - más prominente
      const frameDepth = 0.08;
      const frameWidth = 0.04;
      const outerWidth = width + frameWidth * 2;
      const outerHeight = height + frameWidth * 2;
      
      // Material del marco con mejor textura
      const frameMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513,
        shininess: 30,
        specular: 0x111111,
        side: THREE.DoubleSide
      });
      
      // Marco superior
      const topFrame = new THREE.BoxGeometry(outerWidth, frameWidth, frameDepth);
      const topMesh = new THREE.Mesh(topFrame, frameMaterial);
      topMesh.position.set(0, height/2 + frameWidth/2, 0);
      frameGroup.add(topMesh);
      
      // Marco inferior
      const bottomFrame = new THREE.BoxGeometry(outerWidth, frameWidth, frameDepth);
      const bottomMesh = new THREE.Mesh(bottomFrame, frameMaterial);
      bottomMesh.position.set(0, -height/2 - frameWidth/2, 0);
      frameGroup.add(bottomMesh);
      
      // Marco izquierdo
      const leftFrame = new THREE.BoxGeometry(frameWidth, height, frameDepth);
      const leftMesh = new THREE.Mesh(leftFrame, frameMaterial);
      leftMesh.position.set(-width/2 - frameWidth/2, 0, 0);
      frameGroup.add(leftMesh);
      
      // Marco derecho
      const rightFrame = new THREE.BoxGeometry(frameWidth, height, frameDepth);
      const rightMesh = new THREE.Mesh(rightFrame, frameMaterial);
      rightMesh.position.set(width/2 + frameWidth/2, 0, 0);
      frameGroup.add(rightMesh);
      
      // Añadir profundidad al fondo - más grosor
      const backGeometry = new THREE.BoxGeometry(outerWidth, outerHeight, 0.02);
      const backMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x654321,
        shininess: 10,
        side: THREE.DoubleSide
      });
      const backMesh = new THREE.Mesh(backGeometry, backMaterial);
      backMesh.position.set(0, 0, -frameDepth/2);
      frameGroup.add(backMesh);
      
      // Añadir bisel interior del marco
      const bevelMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xA0522D,
        shininess: 50,
        side: THREE.DoubleSide
      });
      
      // Bisel superior
      const topBevel = new THREE.BoxGeometry(width, 0.005, 0.01);
      const topBevelMesh = new THREE.Mesh(topBevel, bevelMaterial);
      topBevelMesh.position.set(0, height/2 - 0.005, 0.015);
      frameGroup.add(topBevelMesh);
      
      // Bisel inferior
      const bottomBevel = new THREE.BoxGeometry(width, 0.005, 0.01);
      const bottomBevelMesh = new THREE.Mesh(bottomBevel, bevelMaterial);
      bottomBevelMesh.position.set(0, -height/2 + 0.005, 0.015);
      frameGroup.add(bottomBevelMesh);
      
      // Bisel izquierdo
      const leftBevel = new THREE.BoxGeometry(0.005, height, 0.01);
      const leftBevelMesh = new THREE.Mesh(leftBevel, bevelMaterial);
      leftBevelMesh.position.set(-width/2 + 0.005, 0, 0.015);
      frameGroup.add(leftBevelMesh);
      
      // Bisel derecho
      const rightBevel = new THREE.BoxGeometry(0.005, height, 0.01);
      const rightBevelMesh = new THREE.Mesh(rightBevel, bevelMaterial);
      rightBevelMesh.position.set(width/2 - 0.005, 0, 0.015);
      frameGroup.add(rightBevelMesh);
      
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      
      frameGroup.position.set(0, 0, 0);
      frameGroup.rotation.set(0, 0, 0);
      frameGroup.scale.set(1, 1, 1);
      
      scene.add(mesh);
      scene.add(frameGroup);

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
