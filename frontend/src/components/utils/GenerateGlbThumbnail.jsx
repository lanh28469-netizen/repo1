import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const cacheKeyFor = (url) => `glb-thumb:${url}`;
const gltfLoader = new GLTFLoader();
const memoryCache = new Map();

export default function GenerateGlbThumbnail({ url, size = 250, placeholder = '/image-placeholder.png' }) {
  const [src, setSrc] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url) return;
    let mounted = true;
    let obs;

    const key = cacheKeyFor(url);

    // Memory cache first
    if (memoryCache.has(key)) {
      setSrc(memoryCache.get(key));
      return;
    }

    // sessionStorage next
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        memoryCache.set(key, cached);
        setSrc(cached);
        return;
      }
    } catch {}

    const el = containerRef.current;
    if (!el) return;

    const renderThumb = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        // 🚀 Disable antialias (faster) and shadow buffer
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, preserveDrawingBuffer: true });
        renderer.setSize(size, size, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        const scene = new THREE.Scene();

        // very minimal lighting — still gives depth, but faster
        scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.1));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

        const gltf = await new Promise((resolve, reject) => {
          gltfLoader.load(url, resolve, undefined, reject);
        });

        const root = gltf.scene || gltf.scenes?.[0];
        scene.add(root);

        // Fast centering
        const box = new THREE.Box3().setFromObject(root);
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.sub(center);

        // Simple camera fit
        const sizeVec = new THREE.Vector3();
        box.getSize(sizeVec);
        const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z, 0.001);
        const fov = camera.fov * (Math.PI / 180);
        const camDist = (maxDim / 2) / Math.tan(fov / 2) * 1.4;

        camera.position.set(0, maxDim * 0.2, camDist);
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);

        const dataUrl = renderer.domElement.toDataURL('image/jpeg', 0.7); // JPEG → smaller, faster
        memoryCache.set(key, dataUrl);
        try { sessionStorage.setItem(key, dataUrl); } catch {}

        if (mounted) setSrc(dataUrl);

        // Clean up quickly
        root.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose();
            const mat = obj.material;
            if (mat) {
              if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
              else mat.dispose();
            }
          }
        });

        renderer.dispose();
      } catch (err) {
        console.error('GLB thumb render error:', err);
        if (mounted) setSrc(placeholder);
      }
    };

    // Lazy render when visible
    if ('IntersectionObserver' in window && el) {
      obs = new IntersectionObserver((entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            obs.disconnect();
            renderThumb();
          }
        });
      }, { rootMargin: '150px' });
      obs.observe(el);
    } else {
      renderThumb();
    }

    return () => {
      mounted = false;
      if (obs) obs.disconnect();
    };
  }, [url, size, placeholder]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: size,
        overflow: 'hidden',
        borderRadius: 8,
        background: '#111',
      }}
    >
      <img
        src={src || placeholder}
        alt="3D thumbnail"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
