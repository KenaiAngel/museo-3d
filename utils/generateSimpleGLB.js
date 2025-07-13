export async function generateSimpleGLB(asBinary = true) {
  return new Promise(async (resolve, reject) => {
    try {
      // Importar Three.js de manera dinámica para evitar problemas de SSR
      const THREE = await import('three');
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter');
      
      const scene = new THREE.Scene();
      const width = 2;
      const height = 1.5;

      // Crear un plano con geometría más robusta
      const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
      
      // Material con propiedades mejoradas para mejor compatibilidad
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide, // Visible desde ambos lados
        transparent: false,
        opacity: 1.0
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Asegurar que el mesh tenga transformaciones válidas
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      
      scene.add(mesh);

      // Configuración mejorada del exporter
      const exporter = new GLTFExporter();
      
      const exportOptions = {
        binary: asBinary,
        onlyVisible: true,
        truncateDrawRange: true,
        embedImages: true,
        maxTextureSize: 1024,
        includeCustomExtensions: false
      };

      exporter.parse(
        scene,
        (result) => {
          try {
            let blob;
            
            if (asBinary) {
              // Para GLB binario, result es un ArrayBuffer
              if (result instanceof ArrayBuffer) {
                blob = new Blob([result], { type: "model/gltf-binary" });
              } else {
                reject(new Error("El exportador no devolvió un ArrayBuffer para formato GLB"));
                return;
              }
            } else {
              // Para GLTF JSON, result es un objeto
              if (typeof result === 'object' && result !== null) {
                const jsonString = JSON.stringify(result, null, 2);
                blob = new Blob([jsonString], { type: "model/gltf+json" });
              } else {
                reject(new Error("El exportador no devolvió un objeto válido para formato GLTF"));
                return;
              }
            }

            // Log básico para confirmación
            console.log(`Modelo ${asBinary ? 'GLB' : 'GLTF'} generado:`, {
              size: blob.size
            });

            resolve(blob);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error(`Error al exportar modelo 3D: ${error.message || error}`));
        },
        exportOptions
      );
    } catch (error) {
      reject(new Error(`Error al crear escena 3D: ${error.message || error}`));
    }
  });
}
