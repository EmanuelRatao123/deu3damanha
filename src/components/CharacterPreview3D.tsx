import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { detectSoftwareWebGL } from '../game/worldEngine';
import { buildProtagonistVoxel } from '../game/voxelModels';
import type { CustomizationConfig } from '../game/types';

interface Props {
  config: CustomizationConfig;
}

export function CharacterPreview3D({ config }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});
  const targetRotY = useRef(0.35);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth || 320, el.clientHeight || 380);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      (el.clientWidth || 320) / (el.clientHeight || 380),
      0.1,
      40,
    );
    camera.position.set(0, 1.25, 3.35);
    camera.lookAt(0, 1.0, 0);

    const hemi = new THREE.HemisphereLight(0xaed2ff, 0x3b2a1d, 0.85);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffe4b8, 1.6);
    key.position.set(2.5, 4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.7);
    rim.position.set(-2.5, 2.5, -3);
    scene.add(rim);

    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(0.92, 1.02, 0.14, 24);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x3c2718, roughness: 0.78 });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = -0.07;
    scene.add(ped);

    const charGroup = buildProtagonistVoxel(config);
    charGroup.rotation.y = targetRotY.current;
    scene.add(charGroup);
    groupRef.current = charGroup;

    let disposed = false;
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        if (groupRef.current) {
          groupRef.current.rotation.y = targetRotY.current;
        }
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };
    requestRenderRef.current = requestRender;
    requestRender();

    const onResize = () => {
      if (!el || disposed) return;
      const w = el.clientWidth || 320;
      const h = el.clientHeight || 380;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    let dragging = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      targetRotY.current += (e.clientX - lastX) * 0.014;
      lastX = e.clientX;
      requestRender();
    };
    const onUp = () => {
      dragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      renderer.dispose();
      if (dom.parentElement === el) el.removeChild(dom);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (groupRef.current) {
      scene.remove(groupRef.current);
    }
    const nextGroup = buildProtagonistVoxel(config);
    nextGroup.rotation.y = targetRotY.current;
    scene.add(nextGroup);
    groupRef.current = nextGroup;
    requestRenderRef.current();
  }, [config]);

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-xl bg-[#16141d] border border-[#3a2f28] overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-[#cbbca8]">
        Arraste para girar o personagem 3D
      </p>
    </div>
  );
}
