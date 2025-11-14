import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import './VietnamMapViewer.css';
import provinceNames from './constants/provinceNames';
import { loadAndCacheSVG } from './utils/svgCache';


const VietnamMapViewer = ({ svgPath }) => {
  const containerRef = useRef();
  const tooltipRef = useRef();
  const [hoveredName, setHoveredName] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      width / -2, width / 2,
      height / 2, height / -2,
      1, 1000
    );
    camera.position.z = 10;

    const group = new THREE.Group();
    scene.add(group);

    // Highlight settings: VN32-PhuYen, VN33-Daklak in the current mapping
    const HIGHLIGHT_IDS = new Set(['VN32', 'VN33']);
    const HIGHLIGHT_COLOR = new THREE.Color('#FF0000');

    const loadSVG = async () => {
      try {
        // Load SVG content (from cache or URL)
        const svgContent = await loadAndCacheSVG(svgPath);
        
        // Parse SVG content using SVGLoader
        const loader = new SVGLoader();
        const data = loader.parse(svgContent);
        
        data.paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);
          shapes.forEach((shape) => {
            const geometry = new THREE.ShapeGeometry(shape);
            const material = new THREE.MeshBasicMaterial({
              color: 0x5c8968,
              side: THREE.DoubleSide,
              depthWrite: false,
            });
            const mesh = new THREE.Mesh(geometry, material);
            const id = path.userData?.node?.getAttribute?.('id');
            mesh.userData = {
              id,
              name: provinceNames[id] || 'Không rõ',
              originalColor: new THREE.Color(0x5c8968),
              isHighlighted: false,
            };

            group.add(mesh);
          });
        });

        // Apply highlight to configured provinces
        group.children.forEach((mesh) => {
          if (mesh.userData?.id && HIGHLIGHT_IDS.has(mesh.userData.id)) {
            mesh.material.color.copy(HIGHLIGHT_COLOR);
            mesh.userData.isHighlighted = true;
          }
        });

        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = Math.min(width / size.x, height / size.y) * 1.0;

        group.scale.set(scale, -scale, scale);
        group.position.set(-center.x * scale, center.y * scale, 0);
      } catch (error) {
        console.error('Error loading SVG:', error);
      }
    };

    // Load SVG content
    loadSVG();

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(group.children);

      group.children.forEach((mesh) => {
        if (mesh.userData.isHighlighted) {
          mesh.material.color.copy(HIGHLIGHT_COLOR);
        } else {
          mesh.material.color.copy(mesh.userData.originalColor);
        }
      });

      const tooltip = tooltipRef.current;

      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        mesh.material.color.set(0xe7f513);
        const isDakLak = mesh.userData?.id === 'VN32';
        const isPhuYen = mesh.userData?.id === 'VN33';
        if (isDakLak || isPhuYen) {
          setHoveredName(mesh.userData.name);
          tooltip.style.display = 'block';
          // Position tooltip relative to the renderer/canvas to keep it anchored to the mouse
          // Use a small offset so it appears closer to the cursor
          tooltip.style.left = `${e.clientX - rect.left + 4}px`;
          tooltip.style.top = `${e.clientY - rect.top + 4}px`;
        } else {
          setHoveredName(null);
          tooltip.style.display = 'none';
        }
      } else {
        setHoveredName(null);
        tooltip.style.display = 'none';
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(group.children);
      if (intersects.length > 0) {
        const mesh = intersects[0].object;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      container.removeChild(renderer.domElement);
    };
  }, [svgPath]);

  return (
    <div ref={containerRef} className="vn-map-container">
      <div ref={tooltipRef} className="vn-map-tooltip">
        {hoveredName}
      </div>
    </div>
  );
};

export default VietnamMapViewer;
