"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function ARExperience({ modelUrl, onClose }) {
  const mountRef = useRef();
  const rendererRef = useRef();
  const [loading, setLoading] = useState(!!modelUrl);
  const [error, setError] = useState(null);
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
    let renderer, scene, camera, reticle, modelMesh;

    // 1. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();

    // 3. Light
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // 4. Add AR Button
    const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
    arButton.classList.add('ar-button');
    document.body.appendChild(arButton);

    // 5. Reticle
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.15, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // 6. Cargar modelo GLB si hay modelUrl
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
          modelMesh.position.set(0, 0, -0.5);
          scene.add(modelMesh);
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

    // 7. Animation loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // Limpieza
    return () => {
      renderer.setAnimationLoop(null);
      if (mountRef.current && renderer.domElement)
        mountRef.current.removeChild(renderer.domElement);
      const btn = document.querySelector('.ar-button');
      if (btn) document.body.removeChild(btn);
      if (modelMesh) scene.remove(modelMesh);
    };
  }, [modelUrl]);

  return (
    <div ref={mountRef} style={{ width: "100vw", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 10000, background: "#000" }}>
      {/* Panel de información de soporte AR */}
      {arSupport.checking && (
        <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(0,0,0,0.8)", color: "#fff", padding: 16, borderRadius: 8, zIndex: 10003 }}>
          <div>🔍 Verificando soporte AR...</div>
        </div>
      )}
      
      {!arSupport.checking && !arSupport.supported && (
        <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(220,53,69,0.9)", color: "#fff", padding: 16, borderRadius: 8, zIndex: 10003, maxWidth: "80vw" }}>
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>❌ AR no disponible</div>
          <div style={{ fontSize: "14px", marginBottom: 8 }}>{arSupport.reason}</div>
          <details style={{ fontSize: "12px" }}>
            <summary style={{ cursor: "pointer", marginBottom: 4 }}>Ver detalles técnicos</summary>
            <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: "11px" }}>
              <div>🌐 Navegador: {arSupport.details.userAgent?.slice(0, 50)}...</div>
              <div>🔒 HTTPS: {arSupport.details.isSecureContext ? "✅" : "❌"}</div>
              <div>📱 WebXR: {arSupport.details.hasXR ? "✅" : "❌"}</div>
              <div>🎮 WebGL: {arSupport.details.webgl ? "✅" : "❌"}</div>
              <div>📍 Host: {typeof window !== 'undefined' ? window.location.host : 'N/A'}</div>
            </div>
          </details>
          <div style={{ marginTop: 12, fontSize: "14px" }}>
            💡 <strong>Para usar AR necesitas:</strong><br/>
            • Un dispositivo móvil Android con Chrome/Edge<br/>
            • O un iPhone con Safari 15+<br/>
            • Conexión HTTPS
          </div>
        </div>
      )}

      {!arSupport.checking && arSupport.supported && (
        <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(25,135,84,0.9)", color: "#fff", padding: 16, borderRadius: 8, zIndex: 10003 }}>
          <div>✅ AR disponible - Usa el botón para iniciar</div>
        </div>
      )}

      {loading && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001, background: "rgba(0,0,0,0.5)" }}>
          <div className="loader-ar" style={{ border: "6px solid #f3f3f3", borderTop: "6px solid #6366f1", borderRadius: "50%", width: 60, height: 60, animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
        </div>
      )}
      
      {error && (
        <div style={{ position: "absolute", bottom: 80, left: 0, width: "100vw", textAlign: "center", color: "#fff", zIndex: 10002, fontSize: 18, fontWeight: "bold", background: "rgba(220,53,69,0.9)", padding: 16 }}>
          {error}
        </div>
      )}
      
      {onClose && (
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 20, right: 20, zIndex: 10001, background: "#fff", borderRadius: 8, padding: 12, border: "none", fontWeight: "bold", cursor: "pointer" }}
        >
          ← Volver
        </button>
      )}
    </div>
  );
} 