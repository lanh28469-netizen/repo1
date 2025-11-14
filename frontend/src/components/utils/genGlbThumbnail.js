import { WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, Box3, Vector3, Color } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const cache = new Map();

function disposeNode(node) {
  if (node.geometry) {
    try { node.geometry.dispose(); } catch (e) {}
  }
  if (node.material) {
    const mat = node.material;
    if (Array.isArray(mat)) {
      mat.forEach(m => {
        if (m.map) { try { m.map.dispose(); } catch (e) {} }
        try { m.dispose(); } catch (e) {}
      });
    } else {
      if (mat.map) { try { mat.map.dispose(); } catch (e) {} }
      try { mat.dispose(); } catch (e) {}
    }
  }
}

export default async function genGLBThumbnail(url, { width = 400, height = 300, background = '#ffffff' } = {}) {
  if (!url) throw new Error('Missing url');
  if (cache.has(url)) return cache.get(url);

  // try sessionStorage cache first
  try {
    const key = `glbthumb::${url}`;
    const fromSession = sessionStorage.getItem(key);
    if (fromSession) {
      cache.set(url, fromSession);
      return fromSession;
    }
  } catch (e) {
    // ignore sessionStorage errors
  }

  // create offscreen canvas (attached to DOM via renderer) and renderer
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.setClearColor(new Color(background));

  const scene = new Scene();

  const camera = new PerspectiveCamera(45, width / height, 0.1, 1000);

  const ambient = new AmbientLight(0xffffff, 0.8);
  scene.add(ambient);
  const dir = new DirectionalLight(0xffffff, 0.6);
  dir.position.set(10, 10, 10);
  scene.add(dir);

  const loader = new GLTFLoader();

  let gltf;
  try {
    gltf = await loader.loadAsync(url);
  } catch (err) {
    // propagate error (likely CORS or network)
    renderer.forceContextLoss && renderer.forceContextLoss();
    try { renderer.dispose(); } catch (e) {}
    throw err;
  }

  const root = gltf.scene || gltf.scenes?.[0];
  scene.add(root);

  // compute bounding box and center
  const box = new Box3().setFromObject(root);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());

  // position camera to fit the model
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 1.5; // pull back a little

  camera.position.set(center.x, center.y, center.z + cameraZ);
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  // some models are huge or rotated; try a modest auto-rotate for nicer framing
  root.rotation.y = 0; // no-op placeholder (user can adjust)

  renderer.render(scene, camera);

  const dataUrl = canvas.toDataURL('image/png');

  // cleanup
  try {
    root.traverse((node) => disposeNode(node));
    scene.remove(root);
  } catch (e) {}

  renderer.forceContextLoss && renderer.forceContextLoss();
  try { renderer.dispose(); } catch (e) {}

  cache.set(url, dataUrl);
  try { sessionStorage.setItem(`glbthumb::${url}`, dataUrl); } catch (e) {}

  return dataUrl;
}
