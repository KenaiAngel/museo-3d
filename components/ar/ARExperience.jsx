"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

export default function ARExperience({
  modelUrl,
  onClose,
  showCloseButton,
  restoreMaterials,
}) {
  const mountRef = useRef();
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const modelRef = useRef();
  const textureRef = useRef();
  const [currentEnvironment, setCurrentEnvironment] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const environments = ["/images/image360.jpg", "/images/image3602.jpg"];

  // Inicializa Three.js solo una vez
  useEffect(() => {
    if (!mountRef.current) return;
    // Elimina cualquier canvas previo
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.xr.enabled = false;
    renderer.setClearColor(0x00ff00); // fondo verde para depuración
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    camera.position.set(0, 1.6, 3);
    cameraRef.current = camera;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Render loop
    let stop = false;
    function animate() {
      if (stop) return;
      // Solo renderiza si el canvas sigue en el DOM
      if (!mountRef.current || !renderer.domElement.parentNode) return;
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Espera un poco antes de poner sceneReady en true
    const readyTimeout = setTimeout(() => {
      setSceneReady(true);
    }, 50);

    // Cleanup
    return () => {
      stop = true;
      window.removeEventListener("resize", handleResize);
      if (controls) controls.dispose();
      if (renderer) {
        renderer.dispose();
        if (
          mountRef.current &&
          renderer.domElement &&
          mountRef.current.contains(renderer.domElement)
        ) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      modelRef.current = null;
      setSceneReady(false);
      clearTimeout(readyTimeout);
    };
  }, []); // Solo al montar/desmontar

  // Cambia el modelo dinámicamente SOLO cuando la escena está lista y los refs existen
  useEffect(() => {
    if (!sceneReady || !sceneRef.current || !rendererRef.current) return;
    // Elimina modelo anterior
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }
    setModelLoaded(false);
    if (!modelUrl) return;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.setScalar(scale);
        model.position.set(0, 0, 0);
        // Restaurar materiales originales si se solicita
        if (!restoreMaterials) {
          model.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xff00ff,
              });
            }
          });
        }
        sceneRef.current.add(model);
        modelRef.current = model;
        // Ajuste automático de cámara
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 5; // mucho más lejos
        camera.position.set(center.x, center.y, cameraZ + center.z + 2);
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
        setModelLoaded(true);
        console.log("✅ Modelo 3D cargado correctamente", modelUrl);
        console.log(
          "Objetos en la escena tras añadir modelo:",
          sceneRef.current.children
        );
        console.log("Cámara:", camera.position, "Centro modelo:", center);
      },
      undefined,
      (error) => {
        setModelLoaded(false);
        console.error("❌ Error cargando modelo 3D:", modelUrl, error);
      }
    );
  }, [modelUrl, sceneReady, restoreMaterials]);

  // Botón AR personalizado
  useEffect(() => {
    let arButton = null;
    if (modelLoaded && rendererRef.current) {
      arButton = ARButton.createButton(rendererRef.current);
      // Personaliza el botón
      arButton.style.position = "fixed";
      arButton.style.bottom = "32px";
      arButton.style.right = "32px";
      arButton.style.padding = "14px 28px";
      arButton.style.background =
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      arButton.style.color = "#fff";
      arButton.style.border = "none";
      arButton.style.borderRadius = "12px";
      arButton.style.fontSize = "18px";
      arButton.style.fontWeight = "bold";
      arButton.style.boxShadow = "0 4px 24px rgba(0,0,0,0.18)";
      arButton.style.zIndex = "3200";
      arButton.onmouseenter = function () {
        arButton.style.opacity = "1.0";
      };
      arButton.onmouseleave = function () {
        arButton.style.opacity = "0.85";
      };
      // Forzar texto en español
      arButton.textContent = "Entrar a AR";
      // Mutar el texto cuando cambia el estado
      const observer = new MutationObserver(() => {
        if (arButton.textContent === "START AR")
          arButton.textContent = "Entrar a AR";
        if (arButton.textContent === "STOP AR")
          arButton.textContent = "Salir de AR";
        if (arButton.textContent === "AR NOT SUPPORTED")
          arButton.textContent = "AR no soportado";
      });
      observer.observe(arButton, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      document.body.appendChild(arButton);
      // Limpieza
      return () => {
        observer.disconnect();
        if (arButton && arButton.parentNode) {
          arButton.parentNode.removeChild(arButton);
        }
      };
    }
  }, [modelLoaded]);

  // Cambia la textura de ambiente dinámicamente SOLO cuando la escena está lista y los refs existen
  useEffect(() => {
    if (!sceneReady || !sceneRef.current || !rendererRef.current) return;
    // Limpia la textura anterior
    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      environments[currentEnvironment],
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        sceneRef.current.background = texture;
        sceneRef.current.environment = texture;
        textureRef.current = texture;
        console.log(
          "✅ Textura de ambiente cargada:",
          environments[currentEnvironment]
        );
      },
      undefined,
      (error) => {
        sceneRef.current.background = new THREE.Color(0x222222);
        console.error(
          "❌ Error cargando textura de ambiente:",
          environments[currentEnvironment],
          error
        );
      }
    );
  }, [currentEnvironment, sceneReady]);

  // Cambia ambiente
  const changeEnvironment = (index) => {
    setCurrentEnvironment(index);
  };

  // Desactiva scroll del body mientras está activa la experiencia AR
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Depuración: log de ambientes y ambiente actual
  console.log(
    "Ambientes:",
    environments,
    "Ambiente actual:",
    currentEnvironment
  );
  return (
    <div
      style={{
        position: "fixed",
        width: "100vw",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
        top: 0,
        left: 0,
        zIndex: 3000,
      }}
    >
      {/* Instrucciones flotantes arriba */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: "10px",
          fontSize: "15px",
          zIndex: 9999,
          maxWidth: "90vw",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <strong>Controles:</strong> Arrastra para rotar, rueda para zoom, clic
        derecho para mover. <br />
        Usa los botones para cambiar ambiente. <br />
        {onClose && "Pulsa ← Volver para salir."}
      </div>
      <div
        ref={mountRef}
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 3001,
        }}
      />
      {/* Sección de ambientes flotante */}
      <section
        style={{
          position: "absolute",
          top: 140,
          right: 20,
          zIndex: 9999,
          background: "rgba(0,0,0,0.7)",
          border: "2px solid #fff",
          borderRadius: 16,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          minWidth: 180,
        }}
        aria-label="Selector de ambiente"
      >
        {environments.length < 2 ? (
          <span style={{ color: "#fff", fontWeight: 600 }}>
            Solo hay un ambiente disponible
          </span>
        ) : (
          environments.map((env, idx) => (
            <label
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                gap: 6,
                fontWeight: 600,
                color: "#fff",
                userSelect: "none",
                fontSize: 15,
              }}
            >
              <input
                type="radio"
                name="ambiente"
                checked={currentEnvironment === idx}
                onChange={() => changeEnvironment(idx)}
                style={{
                  accentColor: currentEnvironment === idx ? "#667eea" : "#fff",
                  width: 16,
                  height: 16,
                  marginRight: 4,
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  background:
                    currentEnvironment === idx ? "#667eea" : "transparent",
                  outline: "none",
                  boxShadow:
                    currentEnvironment === idx
                      ? "0 0 0 2px #764ba2"
                      : undefined,
                  cursor: "pointer",
                }}
                aria-checked={currentEnvironment === idx}
                aria-label={`Ambiente ${idx + 1}`}
              />
              <span style={{ color: "inherit", fontWeight: 600 }}>
                Ambiente {idx + 1}
              </span>
            </label>
          ))
        )}
      </section>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 140,
            left: 20,
            padding: "10px 15px",
            backgroundColor: "rgba(255,255,255,0.9)",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            zIndex: 9999,
            color: "#222",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          ← Volver
        </button>
      )}
    </div>
  );
}
