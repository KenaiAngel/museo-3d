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
    scene.background = new THREE.Color(0x222222);
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(0, 0, 2.5); // Posición inicial más cercana

    // 3. Controles de órbita para modo normal (no AR)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.maxDistance = 8;
    controls.minDistance = 0.8;
    controls.target.set(0, 0, 0);
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // 4. Iluminación mejorada
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);
    
    // Luz frontal para iluminar mejor el cuadro
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.5);
    frontLight.position.set(0, 0, 10);
    scene.add(frontLight);

    // 5. Add AR Button
    const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
    arButton.classList.add('ar-button');
    arButton.style.position = 'absolute';
    arButton.style.bottom = '20px';
    arButton.style.right = '20px';
    arButton.style.zIndex = '10001';
    document.body.appendChild(arButton);

    // 6. Detectar cuando AR se activa/desactiva
    renderer.xr.addEventListener('sessionstart', () => {
      console.log("🚀 AR session started");
      setIsARActive(true);
      if (controls) controls.enabled = false;
    });
    
    renderer.xr.addEventListener('sessionend', () => {
      console.log("🛑 AR session ended");
      setIsARActive(false);
      if (controls) controls.enabled = true;
    });

    // 7. Reticle (solo para AR)
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.15, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // 8. Cargar modelo GLB si hay modelUrl
    if (modelUrl) {
      console.log("Cargando modelo desde URL:", modelUrl);
      
      // Validar que la URL termine en .glb o contenga formato válido
      const isValidModelUrl = modelUrl.includes('.glb') || modelUrl.endsWith('.gltf');
      if (!isValidModelUrl) {
        console.warn("⚠️ URL del modelo no tiene extensión .glb/.gltf:", modelUrl);
        console.log("🔧 Intentando agregar extensión .glb...");
        modelUrl = modelUrl + '.glb';
      }
      
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          console.log("✅ Modelo cargado exitosamente:", gltf);
          modelMesh = gltf.scene;
          
          // Centrar y escalar el modelo correctamente
          const box = new THREE.Box3().setFromObject(modelMesh);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          // Mover el modelo para que esté centrado en el origen
          modelMesh.position.copy(center).multiplyScalar(-1);
          
          // Escalar el modelo para que tenga un tamaño apropiado
          const maxSize = Math.max(size.x, size.y, size.z);
          const targetSize = 1.5; // Tamaño objetivo
          const scale = targetSize / maxSize;
          modelMesh.scale.setScalar(scale);
          
          // Posicionar en el centro de la vista
          modelMesh.position.set(0, 0, 0);
          
          // Rotación inicial para mostrar el marco
          modelMesh.rotation.set(0, Math.PI * 0.15, 0);
          
          scene.add(modelMesh);
          
          // Ajustar la cámara para enfocar el modelo
          const adjustedSize = size.multiplyScalar(scale);
          const distance = Math.max(adjustedSize.x, adjustedSize.y, adjustedSize.z) * 2;
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
          const errorMsg = error?.message || error?.toString() || "Error desconocido";
          console.error("❌ Error detallado cargando modelo GLB:", {
            error,
            errorMessage: errorMsg,
            modelUrl,
            errorType: error?.constructor?.name
          });
          
          // Verificar si el error es de parsing JSON (indica archivo corrupto)
          if (errorMsg.includes("not valid JSON") || errorMsg.includes("JSON.parse")) {
            setError("🔧 El modelo 3D está corrupto y necesita regenerarse. Por favor, edita la obra para generar un nuevo modelo.");
          } else if (errorMsg.includes("404") || errorMsg.includes("Not Found")) {
            setError("❌ El archivo del modelo 3D no se encontró en el servidor.");
          } else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
            setError("🌐 Error de conexión al cargar el modelo 3D. Verifica tu conexión a internet.");
          } else {
            setError("❌ No se pudo cargar el modelo 3D. El archivo puede estar dañado.");
          }
          setLoading(false);
        }
      );
    } else {
      console.log("ℹ️ No hay modelUrl proporcionado");
      setLoading(false);
    }

    // 9. Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation loop
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
    <div ref={mountRef} style={{ width: "100vw", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 10000, background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" }}>
      
      {/* Instrucciones de uso */}
      {!isARActive && !loading && !error && (
        <div style={{ position: "absolute", bottom: 20, left: 20, background: "rgba(0,0,0,0.7)", color: "#fff", padding: 16, borderRadius: 8, zIndex: 10003, maxWidth: "250px", fontSize: "12px" }}>
          <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: "14px" }}>🎨 Controles</div>
          <div style={{ lineHeight: "1.4" }}>
            <div>🖱️ Arrastra: Rotar</div>
            <div>🔍 Rueda: Zoom</div>
            <div>📱 Pellizca: Zoom móvil</div>
          </div>
          {arSupport.supported && (
            <div style={{ fontSize: "11px", opacity: 0.8, borderTop: "1px solid #333", paddingTop: 6, marginTop: 6 }}>
              ✨ AR disponible - Botón azul abajo
            </div>
          )}
        </div>
      )}
      
      {/* Panel de información de soporte AR */}
      {arSupport.checking && (
        <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(0,0,0,0.8)", color: "#fff", padding: 16, borderRadius: 8, zIndex: 10003 }}>
          <div>🔍 Verificando soporte AR...</div>
        </div>
      )}
      
      {!arSupport.checking && !arSupport.supported && (
        <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(220,53,69,0.9)", color: "#fff", padding: 16, borderRadius: 8, zIndex: 10003, maxWidth: "300px" }}>
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>❌ AR no disponible</div>
          <div style={{ fontSize: "12px", marginBottom: 8 }}>{arSupport.reason}</div>
          <details style={{ fontSize: "11px" }}>
            <summary style={{ cursor: "pointer", marginBottom: 4 }}>Ver detalles técnicos</summary>
            <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: "10px" }}>
              <div>🌐 Navegador: {arSupport.details.userAgent?.slice(0, 30)}...</div>
              <div>🔒 HTTPS: {arSupport.details.isSecureContext ? "✅" : "❌"}</div>
              <div>📱 WebXR: {arSupport.details.hasXR ? "✅" : "❌"}</div>
              <div>🎮 WebGL: {arSupport.details.webgl ? "✅" : "❌"}</div>
            </div>
          </details>
        </div>
      )}

      {/* Indicador de modo AR activo */}
      {isARActive && (
        <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(25,135,84,0.9)", color: "#fff", padding: 16, borderRadius: 8, zIndex: 10003 }}>
          <div style={{ fontWeight: "bold" }}>🚀 Modo AR Activo</div>
          <div style={{ fontSize: "12px", marginTop: 4 }}>Mueve el dispositivo para encontrar superficies</div>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10001, background: "rgba(0,0,0,0.7)" }}>
          <div className="loader-ar" style={{ border: "6px solid #f3f3f3", borderTop: "6px solid #6366f1", borderRadius: "50%", width: 60, height: 60, animation: "spin 1s linear infinite", marginBottom: 16 }} />
          <div style={{ color: "#fff", fontSize: "16px", fontWeight: "bold" }}>Cargando modelo 3D...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(220,53,69,0.95)", color: "#fff", padding: 24, borderRadius: 12, zIndex: 10002, maxWidth: "80vw", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: 12 }}>⚠️ Error</div>
          <div style={{ fontSize: "14px", lineHeight: "1.5" }}>{error}</div>
        </div>
      )}
      
      {/* Botón de volver */}
      {onClose && (
        <button
          onClick={onClose}
          style={{ 
            position: "absolute", 
            top: 20, 
            right: arSupport.supported ? 20 : 340, 
            zIndex: 10004, 
            background: "rgba(255,255,255,0.9)", 
            borderRadius: 8, 
            padding: "12px 16px", 
            border: "none", 
            fontWeight: "bold", 
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
          }}
        >
          ← Volver
        </button>
      )}
    </div>
  );
}