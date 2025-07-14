"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ARExperience({ modelUrl, onClose }) {
  const mountRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentEnvironment, setCurrentEnvironment] = useState(0);
  
  // Imágenes 360° disponibles
  const environments = [
    '/images/image360.jpg',
    '/images/image3602.jpg'
  ];

  useEffect(() => {
    if (!mountRef.current) {
      console.log("❌ mountRef.current no está disponible");
      return;
    }

    console.log("🚀 Iniciando ARExperience con modelo:", modelUrl);
    console.log("🌐 Ambiente actual:", environments[currentEnvironment]);
    console.log("📍 mountRef.current:", mountRef.current);

    // Limpiar cualquier canvas existente antes de crear uno nuevo
    if (mountRef.current.children.length > 0) {
      console.log("🧹 Limpiando canvas existente");
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    }

    // Variables de Three.js
    let scene, camera, renderer, controls, model;

    // 1. Configurar renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.xr.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // 2. Crear escena
    scene = new THREE.Scene();

    // 3. Configurar fondo 360° equirectangular
    const textureLoader = new THREE.TextureLoader();
    console.log("📥 Cargando textura:", environments[currentEnvironment]);
    textureLoader.load(
      environments[currentEnvironment],
      (texture) => {
        console.log("✅ Textura 360° cargada exitosamente");
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture; // Para reflejos en el modelo
      },
      (progress) => {
        console.log("📥 Progreso textura 360°:", (progress.loaded / progress.total * 100).toFixed(0) + '%');
      },
      (error) => {
        console.error("❌ Error cargando textura 360°:", error);
        // Fallback a color sólido
        scene.background = new THREE.Color(0x222222);
      }
    );

    // 4. Configurar cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3); // Posición típica de usuario

    // 5. Configurar controles
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);

    // 6. Iluminación básica
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // 7. Cargar modelo 3D si existe
    if (modelUrl) {
      console.log("📦 Cargando modelo:", modelUrl);
      const loader = new GLTFLoader();
      
      loader.load(
        modelUrl,
        (gltf) => {
          console.log("✅ Modelo cargado:", gltf);
          model = gltf.scene;

          // Centrar y escalar modelo
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          // Centrar en origen
          model.position.sub(center);

          // Escalar para que sea visible
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim; // Escala para que tenga 2 unidades
          model.scale.setScalar(scale);

          // Posicionar frente al usuario
          model.position.set(0, 0, 0);

          scene.add(model);
          setLoading(false);
          console.log("✅ Modelo añadido a la escena");
        },
        (progress) => {
          console.log("📥 Progreso modelo:", (progress.loaded / progress.total * 100).toFixed(0) + '%');
        },
        (error) => {
          console.error("❌ Error cargando modelo:", error);
          setError("No se pudo cargar el modelo 3D");
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }

    // 8. Botón AR
    if (modelUrl) {
      const arButton = ARButton.createButton(renderer);
      arButton.style.position = 'absolute';
      arButton.style.bottom = '20px';
      arButton.style.right = '20px';
      arButton.style.padding = '12px 20px';
      arButton.style.backgroundColor = '#1976d2';
      arButton.style.color = 'white';
      arButton.style.border = 'none';
      arButton.style.borderRadius = '8px';
      arButton.style.fontSize = '16px';
      arButton.textContent = 'Entrar a AR';
      document.body.appendChild(arButton);

      // Eventos AR
      renderer.xr.addEventListener('sessionstart', () => {
        console.log("🚀 Sesión AR iniciada");
        controls.enabled = false;
      });

      renderer.xr.addEventListener('sessionend', () => {
        console.log("🛑 Sesión AR terminada");
        controls.enabled = true;
      });
    }

    // 9. Manejar redimensionado
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 10. Loop de animación
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      console.log("🧹 Limpiando ARExperience");
      window.removeEventListener('resize', handleResize);
      
      if (controls) {
        controls.dispose();
      }
      
      if (renderer) {
        renderer.dispose();
        if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      
      // Remover botón AR
      const arButtons = document.querySelectorAll('[data-ar-button], button[style*="position: absolute"]');
      arButtons.forEach(button => {
        if (button.parentNode) {
          button.parentNode.removeChild(button);
        }
      });
      
      console.log("✅ Cleanup completado");
    };
  }, [modelUrl, currentEnvironment]); // Añadido currentEnvironment como dependencia

  // Función para cambiar ambiente
  const changeEnvironment = (index) => {
    console.log("🔄 Cambiando ambiente a:", environments[index]);
    setCurrentEnvironment(index);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000' }}>
      {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,255,0,0.8)',
        color: 'black',
        padding: '5px',
        fontSize: '12px',
        zIndex: 2000
      }}>
        ARExperience Cargado ✅ | Ambiente: {currentEnvironment + 1}
      </div>

      {/* Contenedor Three.js */}
      <div 
        ref={mountRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative'
        }} 
      />
      
      {/* Loading */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          fontSize: '18px',
          zIndex: 1000
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #333',
            borderTop: '3px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          Cargando experiencia 3D...
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255,0,0,0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Error</h3>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Botón volver */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '10px 15px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            zIndex: 1001
          }}
        >
          ← Volver
        </button>
      )}

      {/* Instrucciones */}
      {!loading && !error && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '300px',
          zIndex: 1001
        }}>
          <strong>Controles:</strong>
          <br />• Arrastra para rotar la vista
          <br />• Rueda del ratón para zoom
          <br />• Clic derecho + arrastrar para mover
          {modelUrl && (
            <>
              <br />• Usa el botón "Entrar a AR" para modo AR
            </>
          )}
        </div>
      )}

      {/* Controles de cambio de ambiente */}
      {!loading && !error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '15px',
          borderRadius: '12px',
          fontSize: '14px',
          zIndex: 1001,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
            🌐 Cambiar Ambiente
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {environments.map((env, index) => (
              <button
                key={index}
                onClick={() => changeEnvironment(index)}
                style={{
                  background: currentEnvironment === index 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (currentEnvironment !== index) {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentEnvironment !== index) {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                  }
                }}
              >
                Ambiente {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
