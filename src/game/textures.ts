import * as THREE from 'three';

export interface MaterialPalette {
  grass: THREE.MeshStandardMaterial;
  dirt: THREE.MeshStandardMaterial;
  cobble: THREE.MeshStandardMaterial;
  stuccoWhite: THREE.MeshStandardMaterial;
  stuccoBlue: THREE.MeshStandardMaterial;
  stuccoYellow: THREE.MeshStandardMaterial;
  stuccoAged: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  woodWarm: THREE.MeshStandardMaterial;
  terracotta: THREE.MeshStandardMaterial;
  redBarn: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  clay: THREE.MeshStandardMaterial;
  corrugatedMetal: THREE.MeshStandardMaterial;
  mineRock: THREE.MeshStandardMaterial;
  hospitalTile: THREE.MeshStandardMaterial;
  fabric: THREE.MeshStandardMaterial;
  foliageDark: THREE.MeshStandardMaterial;
  foliageIpe: THREE.MeshStandardMaterial;
  cornLeaf: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  water: THREE.MeshPhysicalMaterial;
  puddle: THREE.MeshStandardMaterial;
  lampGlow: THREE.MeshStandardMaterial;
  windUniform: { value: number };
}

function makePixelCanvas(
  size: number,
  painter: (ctx: CanvasRenderingContext2D, size: number) => void,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  painter(ctx, size);
  return canvas;
}

function toTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  anisotropy: number,
  isColor: boolean,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = anisotropy;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
}

function makeVoxelNoiseCanvas(
  baseHex: string,
  variance: number,
  grid = 16,
  extraLines = false,
): HTMLCanvasElement {
  return makePixelCanvas(64, (ctx, size) => {
    const base = new THREE.Color(baseHex);
    const cell = size / grid;
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        const delta = (Math.abs(n) - 0.5) * variance;
        const c = base.clone().offsetHSL(0, 0, delta);
        ctx.fillStyle = `#${c.getHexString()}`;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    if (extraLines) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = 0; y < size; y += 8) {
        ctx.fillRect(0, y, size, 1);
      }
    }
  });
}

function makeBumpCanvas(grid = 16, plankLines = false): HTMLCanvasElement {
  return makePixelCanvas(64, (ctx, size) => {
    const cell = size / grid;
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const n = Math.abs((Math.sin(x * 41.3 + y * 19.7) * 9134.2) % 1);
        const v = Math.floor(100 + n * 110);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    if (plankLines) {
      ctx.fillStyle = 'rgb(30,30,30)';
      for (let y = 0; y < size; y += 16) {
        ctx.fillRect(0, y, size, 2);
      }
    }
  });
}

export function createSignTexture(
  title: string,
  subtitle: string,
  bgHex = '#5a3a21',
): THREE.CanvasTexture {
  const canvas = makePixelCanvas(256, (ctx) => {
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#d4a359';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 116);

    ctx.fillStyle = '#fff5e1';
    ctx.font = 'bold 22px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 22), 128, 52);

    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subtitle.slice(0, 32), 128, 92);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function applyWindSway(
  mat: THREE.MeshStandardMaterial,
  windUniform: { value: number },
  strength: number,
): void {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windUniform;
    shader.vertexShader = `uniform float uWindTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float swayPhase = position.y * 0.9 + position.x * 0.5;
       transformed.x += sin(uWindTime * 2.1 + swayPhase) * ${strength.toFixed(3)} * max(0.0, position.y);
      `,
    );
  };
}

export function createMaterialPalette(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean,
): MaterialPalette {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const windUniform = { value: 0 };

  const grassMap = toTexture(makeVoxelNoiseCanvas('#3e6b34', 0.1, 16), 44, 44, aniso, true);
  const dirtMap = toTexture(makeVoxelNoiseCanvas('#7a4b2b', 0.09, 16), 28, 28, aniso, true);
  const cobbleMap = toTexture(makeVoxelNoiseCanvas('#686b72', 0.14, 8, true), 14, 14, aniso, true);
  const woodMap = toTexture(makeVoxelNoiseCanvas('#6b4226', 0.1, 16, true), 3, 3, aniso, true);
  const roofMap = toTexture(makeVoxelNoiseCanvas('#a8462a', 0.11, 12, true), 4, 4, aniso, true);
  const clayMap = toTexture(makeVoxelNoiseCanvas('#9c5638', 0.12, 16), 4, 4, aniso, true);
  const mineMap = toTexture(makeVoxelNoiseCanvas('#3d3a42', 0.15, 12, true), 6, 6, aniso, true);
  const tileMap = toTexture(makeVoxelNoiseCanvas('#d6dce0', 0.06, 8, true), 4, 4, aniso, true);
  const stuccoBump = toTexture(makeBumpCanvas(16, false), 2, 2, aniso, false);
  const woodBump = toTexture(makeBumpCanvas(16, true), 3, 3, aniso, false);

  const foliageDark = new THREE.MeshStandardMaterial({
    color: 0x2f5d2b,
    roughness: 0.88,
    metalness: 0.0,
  });
  const foliageIpe = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.82,
    metalness: 0.0,
  });
  const cornLeaf = new THREE.MeshStandardMaterial({
    color: 0x5c8a32,
    roughness: 0.85,
    metalness: 0.0,
  });

  if (!isSoftwareGl) {
    applyWindSway(foliageDark, windUniform, 0.028);
    applyWindSway(foliageIpe, windUniform, 0.028);
    applyWindSway(cornLeaf, windUniform, 0.045);
  }

  return {
    grass: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: grassMap,
      roughness: 0.92,
      metalness: 0.0,
    }),
    dirt: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: dirtMap,
      roughness: 0.95,
      metalness: 0.0,
    }),
    cobble: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: cobbleMap,
      bumpMap: stuccoBump,
      bumpScale: 0.04,
      roughness: 0.82,
      metalness: 0.05,
    }),
    stuccoWhite: new THREE.MeshStandardMaterial({
      color: 0xf1eadc,
      bumpMap: stuccoBump,
      bumpScale: 0.03,
      roughness: 0.88,
      metalness: 0.0,
    }),
    stuccoBlue: new THREE.MeshStandardMaterial({
      color: 0x3b6fa0,
      bumpMap: stuccoBump,
      bumpScale: 0.025,
      roughness: 0.82,
      metalness: 0.02,
    }),
    stuccoYellow: new THREE.MeshStandardMaterial({
      color: 0xd99b38,
      bumpMap: stuccoBump,
      bumpScale: 0.03,
      roughness: 0.84,
      metalness: 0.0,
    }),
    stuccoAged: new THREE.MeshStandardMaterial({
      color: 0x8d8375,
      bumpMap: stuccoBump,
      bumpScale: 0.05,
      roughness: 0.94,
      metalness: 0.0,
    }),
    woodDark: new THREE.MeshStandardMaterial({
      color: 0x4b2e1b,
      map: woodMap,
      bumpMap: woodBump,
      bumpScale: 0.04,
      roughness: 0.78,
      metalness: 0.02,
    }),
    woodWarm: new THREE.MeshStandardMaterial({
      color: 0xc28a52,
      map: woodMap,
      bumpMap: woodBump,
      bumpScale: 0.03,
      roughness: 0.72,
      metalness: 0.0,
    }),
    terracotta: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: roofMap,
      bumpMap: woodBump,
      bumpScale: 0.05,
      roughness: 0.76,
      metalness: 0.04,
    }),
    redBarn: new THREE.MeshStandardMaterial({
      color: 0x8f2924,
      bumpMap: woodBump,
      bumpScale: 0.04,
      roughness: 0.8,
      metalness: 0.05,
    }),
    stone: new THREE.MeshStandardMaterial({
      color: 0x767a80,
      bumpMap: stuccoBump,
      bumpScale: 0.06,
      roughness: 0.88,
      metalness: 0.05,
    }),
    iron: new THREE.MeshStandardMaterial({
      color: 0x2a2d34,
      roughness: 0.36,
      metalness: 0.82,
    }),
    clay: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: clayMap,
      bumpMap: stuccoBump,
      bumpScale: 0.045,
      roughness: 0.9,
      metalness: 0.0,
    }),
    corrugatedMetal: new THREE.MeshStandardMaterial({
      color: 0x6b7280,
      bumpMap: woodBump,
      bumpScale: 0.06,
      roughness: 0.42,
      metalness: 0.72,
    }),
    mineRock: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: mineMap,
      bumpMap: stuccoBump,
      bumpScale: 0.07,
      roughness: 0.94,
      metalness: 0.08,
    }),
    hospitalTile: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tileMap,
      roughness: 0.35,
      metalness: 0.05,
    }),
    fabric: new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      bumpMap: stuccoBump,
      bumpScale: 0.02,
      roughness: 0.94,
      metalness: 0.0,
    }),
    foliageDark,
    foliageIpe,
    cornLeaf,
    glass: new THREE.MeshStandardMaterial({
      color: 0x9ec5e0,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: 0x1b4d5c,
      roughness: 0.1,
      metalness: 0.18,
      transmission: isSoftwareGl ? 0 : 0.45,
      transparent: true,
      opacity: isSoftwareGl ? 0.82 : 0.92,
      ior: 1.33,
    }),
    puddle: new THREE.MeshStandardMaterial({
      color: 0x223846,
      roughness: 0.06,
      metalness: 0.75,
      transparent: true,
      opacity: 0.72,
    }),
    lampGlow: new THREE.MeshStandardMaterial({
      color: 0xfff0c2,
      emissive: 0xffaa33,
      emissiveIntensity: 1.8,
      roughness: 0.3,
    }),
    windUniform,
  };
}
