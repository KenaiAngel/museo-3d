import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

export default function ARExperience({ onClose }) {
  const mountRef = useRef();
  const rendererRef = useRef();

  useEffect(() => {
    let renderer, scene, camera, reticle;

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

    // 6. Animation loop
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
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: "100vw", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 10000, background: "#000" }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 20, right: 20, zIndex: 10001, background: "#fff", borderRadius: 8, padding: 8, border: "none", fontWeight: "bold" }}
        >
          Cerrar AR
        </button>
      )}
    </div>
  );
} 