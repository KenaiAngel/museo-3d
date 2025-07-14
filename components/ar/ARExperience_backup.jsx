"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ARExperience({ modelUrl, onClose }) {
  const mountRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const sceneRef = useRef();
  const [loading, setLoading] = useState(!!modelUrl);
  const [error, setError] = useState(null);
  const [isARActive, setIsARActive] = useState(false);
  const [arSupport, setArSupport] = useState({ 
    checking: true, 
    supported: false, 
    reason: "", 
    details: {} 
  });

  // Función para verificar soporte AR detalladamente
  const checkARSupport = async () => {
    console.log("🔍 Verificando soporte AR...");
    
    const details = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isSecureContext: window.isSecureContext,
      hasXR: 'xr' in navigator,
      hasGetUserMedia: 'getUserMedia' in navigator.mediaDevices || 'webkitGetUserMedia' in navigator,
      protocol: window.location.protocol,
      isLocalhost: window.location.hostname === 'localhost',
      webgl: false,
      webglVersion: null
    };

    // Verificar WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        details.webgl = true;
        details.webglVersion = gl.getParameter(gl.VERSION);
      }
    } catch (e) {
      console.warn("Error verificando WebGL:", e);
    }

    console.log("📊 Detalles del navegador:", details);

    if (!details.isSecureContext) {
      setArSupport({
        checking: false,
        supported: false,
        reason: "Se requiere HTTPS para AR",
        details
      });
      return;
    }

    if (!details.hasXR) {
      setArSupport({
        checking: false,
        supported: false,
        reason: "WebXR no disponible en este navegador",
        details
      });
      return;
    }

    // Verificar soporte específico de AR
    try {
      const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
      console.log("✅ WebXR AR session support:", isSupported);
      
      setArSupport({
        checking: false,
        supported: isSupported,
        reason: isSupported ? "AR soportado" : "AR no soportado por el dispositivo",
        details
      });
    } catch (error) {
      console.error("❌ Error verificando soporte AR:", error);
      setArSupport({
        checking: false,
        supported: false,
        reason: `Error verificando AR: ${error.message}`,
        details
      });
    }
  };

  useEffect(() => {
    checkARSupport();
  }, []);

  // Función para cargar imagen equirectangular como fondo
  const loadEquirectangularBackground = (imageUrl, scene) => {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        imageUrl,
        (texture) => {
          console.log("✅ Imagen equirectangular cargada:", imageUrl);
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.background = texture;
          resolve(texture);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total * 100));
            console.log(`📥 Cargando imagen equirectangular: ${percent}%`);
          }
        },
        (error) => {
          console.error("❌ Error cargando imagen equirectangular:", error);
          reject(error);
        }
      );
    });
  };

  useEffect(() => {
    let renderer, scene, camera, reticle, modelMesh, controls;

    // 1. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Scene & Camera
    scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Cargar imagen equirectangular como fondo
    loadEquirectangularBackground("/images/image360.jpg", scene)
      .then(() => {
        console.log("✅ Fondo equirectangular aplicado");
      })
      .catch((error) => {
        console.error("❌ Error aplicando fondo equirectangular:", error);
        // Fallback: fondo negro simple
        scene.background = new THREE.Color(0x1a1a1a);
      });
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(0, 0, 5);

    // 3. Controles de órbita
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.maxDistance = 15;
    controls.minDistance = 0.1;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 4. Iluminación
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);
    
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.7);
    frontLight.position.set(0, 0, 10);
    scene.add(frontLight);

    // 5. Add AR Button
    if (modelUrl) {
      const arButton = ARButton.createButton(renderer);
      arButton.classList.add('ar-button');
      arButton.style.position = 'absolute';
      arButton.style.bottom = '24px';
      arButton.style.right = '24px';
      arButton.style.zIndex = '10001';
      arButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      arButton.style.border = '1px solid rgba(255,255,255,0.2)';
      arButton.style.borderRadius = '16px';
      arButton.style.padding = '16px 24px';
      arButton.style.color = '#fff';
      arButton.style.fontWeight = '600';
      arButton.style.fontSize = '14px';
      arButton.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      arButton.style.backdropFilter = 'blur(20px)';
      arButton.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
      arButton.style.cursor = 'pointer';
      arButton.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      arButton.innerHTML = '🚀 Activar AR';
      
      document.body.appendChild(arButton);
    }

    // 6. AR Session Events
    renderer.xr.addEventListener('sessionstart', () => {
      console.log("🚀 AR session started");
      setIsARActive(true);
      if (controls) controls.enabled = false;
      
      if (modelMesh) {
        camera.add(modelMesh);
        modelMesh.position.set(0, 0, -1.2);
        modelMesh.scale.setScalar(0.8);
        modelMesh.rotation.set(0, 0, 0);
      }
    });
    
    renderer.xr.addEventListener('sessionend', () => {
      console.log("🛑 AR session ended");
      setIsARActive(false);
      if (controls) controls.enabled = true;
      
      if (modelMesh) {
        camera.remove(modelMesh);
        scene.add(modelMesh);
        modelMesh.position.set(0, 0, 0);
        modelMesh.scale.setScalar(1.0);
        modelMesh.rotation.set(0, Math.PI * 0.15, 0);
      }
    });

    // 7. Cargar modelo GLB
    if (modelUrl) {
      console.log("Cargando modelo desde URL:", modelUrl);
      
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          console.log("✅ Modelo cargado exitosamente:", gltf);
          modelMesh = gltf.scene;
          
          // Centrar y escalar el modelo
          const box = new THREE.Box3().setFromObject(modelMesh);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          modelMesh.position.copy(center).multiplyScalar(-1);
          
          const maxSize = Math.max(size.x, size.y, size.z);
          const targetSize = 2.0;
          const scale = targetSize / maxSize;
          modelMesh.scale.setScalar(scale);
          
          modelMesh.position.set(0, 0, 0);
          modelMesh.rotation.set(0, Math.PI * 0.15, 0);
          
          scene.add(modelMesh);
          
          // Ajustar cámara
          const adjustedSize = size.multiplyScalar(scale);
          const distance = Math.max(adjustedSize.x, adjustedSize.y, adjustedSize.z) * 3.0;
          camera.position.set(0, 0, distance);
          controls.update();
          
          setLoading(false);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total * 100));
            console.log(`📥 Cargando modelo: ${percent}%`);
          }
        },
        (error) => {
          console.error("❌ Error cargando modelo:", error);
          setError("❌ No se pudo cargar el modelo 3D. El archivo puede estar dañado.");
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }

    // 8. Window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation loop
    renderer.setAnimationLoop(() => {
      if (controls && !isARActive) {
        controls.update();
      }
      renderer.render(scene, camera);
    });

    // Limpieza
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      if (controls) controls.dispose();
      if (mountRef.current && renderer.domElement)
        mountRef.current.removeChild(renderer.domElement);
      const btn = document.querySelector('.ar-button');
      if (btn) document.body.removeChild(btn);
      if (modelMesh) scene.remove(modelMesh);
    };
  }, [modelUrl]);

  return (
    <div ref={mountRef} style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      
      {/* Header */}
      {!isARActive && !loading && !error && (
        <div style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          height: "80px",
          background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)",
          backdropFilter: "blur(20px)",
          zIndex: 10003,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "12px", 
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px"
            }}>🎨</div>
            <div>
              <div style={{ color: "#fff", fontSize: "18px", fontWeight: "700", letterSpacing: "-0.5px" }}>
                Visor 3D Profesional
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
                Experiencia inmersiva de arte digital
              </div>
            </div>
          </div>
          {arSupport.supported && modelUrl && (
            <div style={{ 
              background: "linear-gradient(135deg, #00ff87 0%, #60efff 100%)",
              color: "#000",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span style={{ fontSize: "14px" }}>🚀</span>
              AR Disponible
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: "100vw", 
          height: "100vh", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 10001, 
          background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(20px)"
        }}>
          <div style={{ 
            width: "80px", 
            height: "80px", 
            border: "3px solid rgba(255,255,255,0.1)", 
            borderTop: "3px solid #667eea",
            borderRadius: "50%", 
            animation: "spin 1s linear infinite"
          }}></div>
          <div style={{ 
            color: "#fff", 
            fontSize: "20px", 
            fontWeight: "700", 
            marginTop: "24px"
          }}>
            Cargando Modelo 3D...
          </div>
          <style>{`
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
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)", 
          background: "rgba(220,53,69,0.95)", 
          color: "#fff", 
          padding: "32px", 
          borderRadius: "20px", 
          zIndex: 10002, 
          maxWidth: "400px", 
          textAlign: "center"
        }}>
          <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>
            Error de Carga
          </div>
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            {error}
          </div>
        </div>
      )}
      
      {/* Botón volver */}
      {onClose && (
        <button
          onClick={onClose}
          style={{ 
            position: "absolute", 
            top: 24, 
            right: 24, 
            zIndex: 10004, 
            background: "rgba(255,255,255,0.9)", 
            backdropFilter: "blur(20px)",
            borderRadius: "12px", 
            padding: "12px 20px", 
            border: "none", 
            fontWeight: "600", 
            cursor: "pointer",
            color: "#1a1a2e",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>←</span>
          Volver
        </button>
      )}
    </div>
  );
}
