import * as THREE from 'three';
import type { CustomizationConfig } from './types';

function addBox(
  parent: THREE.Group,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: string | number,
  roughness = 0.78,
  metalness = 0.04,
  emissive?: number,
  emissiveIntensity = 0,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive: emissive ?? 0x000000,
    emissiveIntensity,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createContactShadow(radius = 0.55): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 18);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x050508,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(geo, mat);
  disc.position.y = 0.015;
  return disc;
}

/**
 * Detailed anatomical multi-part voxel protagonist supporting expanded clothing,
 * hair styles, hats, glasses, backpacks, watches, and animated hands.
 */
export function buildProtagonistVoxel(config: CustomizationConfig): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.56));

  // Shoes (Tênis or Bota)
  const isBoot = config.shoeStyle === 'bota';
  const shoeH = isBoot ? 0.22 : 0.14;
  addBox(root, 0.24, shoeH, 0.34, -0.15, shoeH / 2 + 0.02, 0.03, config.shoeColor, 0.84, 0.06);
  addBox(root, 0.24, shoeH, 0.34, 0.15, shoeH / 2 + 0.02, 0.03, config.shoeColor, 0.84, 0.06);
  addBox(root, 0.25, 0.04, 0.36, -0.15, 0.02, 0.03, '#1f2937', 0.92, 0.02);
  addBox(root, 0.25, 0.04, 0.36, 0.15, 0.02, 0.03, '#1f2937', 0.92, 0.02);

  // Legs (Calça vs Bermuda)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.15, 0.72, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.15, 0.72, 0);

  if (config.bottomStyle === 'bermuda') {
    addBox(leftLeg, 0.23, 0.3, 0.25, 0, -0.15, 0, config.pantsColor, 0.88, 0.02);
    addBox(leftLeg, 0.19, 0.28, 0.2, 0, -0.42, 0, config.skinTone, 0.72, 0.0);
    addBox(rightLeg, 0.23, 0.3, 0.25, 0, -0.15, 0, config.pantsColor, 0.88, 0.02);
    addBox(rightLeg, 0.19, 0.28, 0.2, 0, -0.42, 0, config.skinTone, 0.72, 0.0);
  } else {
    addBox(leftLeg, 0.22, 0.56, 0.24, 0, -0.28, 0, config.pantsColor, 0.86, 0.02);
    addBox(rightLeg, 0.22, 0.56, 0.24, 0, -0.28, 0, config.pantsColor, 0.86, 0.02);
  }
  leftLeg.name = 'leftLeg';
  rightLeg.name = 'rightLeg';
  root.add(leftLeg, rightLeg);

  // Belt + buckle
  addBox(root, 0.54, 0.07, 0.3, 0, 0.75, 0, '#29201b', 0.6, 0.1);
  addBox(root, 0.1, 0.06, 0.04, 0, 0.75, 0.16, '#eab308', 0.28, 0.85);

  // Torso / Shirt Style (camiseta | xadrez | jaqueta | regata)
  addBox(root, 0.54, 0.54, 0.3, 0, 1.06, 0, config.shirtColor, 0.82, 0.02);
  if (config.shirtStyle === 'xadrez') {
    addBox(root, 0.55, 0.08, 0.31, 0, 1.12, 0, '#18181b', 0.86, 0.0);
    addBox(root, 0.55, 0.08, 0.31, 0, 0.94, 0, '#18181b', 0.86, 0.0);
    addBox(root, 0.1, 0.54, 0.31, -0.14, 1.06, 0, '#f5f5f4', 0.86, 0.0);
    addBox(root, 0.1, 0.54, 0.31, 0.14, 1.06, 0, '#f5f5f4', 0.86, 0.0);
  } else if (config.shirtStyle === 'jaqueta') {
    addBox(root, 0.2, 0.55, 0.32, -0.18, 1.06, 0, '#27272a', 0.72, 0.08);
    addBox(root, 0.2, 0.55, 0.32, 0.18, 1.06, 0, '#27272a', 0.72, 0.08);
    addBox(root, 0.56, 0.08, 0.33, 0, 1.32, 0, '#18181b', 0.72, 0.08);
  }
  addBox(root, 0.24, 0.06, 0.31, 0, 1.33, 0, '#f8fafc', 0.75, 0.0);

  // Neck
  addBox(root, 0.16, 0.12, 0.16, 0, 1.36, 0, config.skinTone, 0.72, 0.0);

  // Articulated Arms + Animated Hands + Watch
  const buildArm = (side: -1 | 1, name: string) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.37, 1.25, 0);
    const sleeveColor =
      config.shirtStyle === 'jaqueta'
        ? '#27272a'
        : config.shirtStyle === 'regata'
          ? config.skinTone
          : config.shirtColor;
    addBox(arm, 0.18, 0.26, 0.2, 0, -0.11, 0, sleeveColor, 0.82, 0.02);
    addBox(arm, 0.15, 0.24, 0.16, 0, -0.34, 0, config.skinTone, 0.74, 0.0);
    // Hand + fingers block
    const hand = new THREE.Group();
    hand.position.set(0, -0.49, 0.02);
    addBox(hand, 0.14, 0.12, 0.15, 0, 0, 0, config.skinTone, 0.72, 0.0);
    addBox(hand, 0.05, 0.08, 0.05, -side * 0.06, -0.02, 0.06, config.skinTone, 0.72, 0.0);
    arm.add(hand);

    if (side === -1 && config.watch !== 'nenhum') {
      const watchColor = config.watch === 'dourado' ? '#facc15' : '#0ea5e9';
      addBox(arm, 0.17, 0.05, 0.18, 0, -0.42, 0, '#18181b', 0.4, 0.6);
      addBox(arm, 0.08, 0.06, 0.04, 0, -0.42, 0.09, watchColor, 0.2, 0.8);
    }
    arm.name = name;
    return arm;
  };
  root.add(buildArm(-1, 'leftArm'), buildArm(1, 'rightArm'));

  // Expressive Head
  const head = new THREE.Group();
  head.position.set(0, 1.58, 0);
  addBox(head, 0.44, 0.44, 0.44, 0, 0, 0, config.skinTone, 0.72, 0.0);
  // Ears & nose
  addBox(head, 0.06, 0.12, 0.08, -0.24, 0, 0, config.skinTone, 0.72, 0.0);
  addBox(head, 0.06, 0.12, 0.08, 0.24, 0, 0, config.skinTone, 0.72, 0.0);
  addBox(head, 0.07, 0.08, 0.06, 0, -0.03, 0.23, config.skinTone, 0.72, 0.0);
  // Sclera + Iris + Eyebrows + Smile
  addBox(head, 0.1, 0.06, 0.03, -0.1, 0.03, 0.22, '#f8fafc', 0.3, 0.0);
  addBox(head, 0.1, 0.06, 0.03, 0.1, 0.03, 0.22, '#f8fafc', 0.3, 0.0);
  addBox(head, 0.05, 0.05, 0.04, -0.09, 0.03, 0.225, '#18181b', 0.2, 0.1);
  addBox(head, 0.05, 0.05, 0.04, 0.09, 0.03, 0.225, '#18181b', 0.2, 0.1);
  addBox(head, 0.11, 0.03, 0.04, -0.1, 0.09, 0.22, config.hairColor, 0.85, 0.0);
  addBox(head, 0.11, 0.03, 0.04, 0.1, 0.09, 0.22, config.hairColor, 0.85, 0.0);
  addBox(head, 0.12, 0.03, 0.04, 0, -0.12, 0.22, '#7c3f2c', 0.7, 0.0);

  // Detailed Hair
  if (config.hairStyle !== 'careca') {
    addBox(head, 0.46, 0.12, 0.46, 0, 0.21, -0.01, config.hairColor, 0.88, 0.0);
    addBox(head, 0.46, 0.22, 0.12, 0, 0.08, -0.18, config.hairColor, 0.88, 0.0);
    if (config.hairStyle === 'moicano') {
      addBox(head, 0.14, 0.18, 0.44, 0, 0.31, 0, config.hairColor, 0.86, 0.0);
    } else if (config.hairStyle === 'cacheado') {
      addBox(head, 0.52, 0.18, 0.5, 0, 0.18, -0.02, config.hairColor, 0.9, 0.0);
      addBox(head, 0.52, 0.16, 0.14, 0, 0.04, -0.2, config.hairColor, 0.9, 0.0);
    } else if (config.hairStyle === 'longo') {
      addBox(head, 0.5, 0.46, 0.16, 0, -0.06, -0.21, config.hairColor, 0.88, 0.0);
      addBox(head, 0.09, 0.34, 0.22, -0.24, -0.02, -0.08, config.hairColor, 0.88, 0.0);
      addBox(head, 0.09, 0.34, 0.22, 0.24, -0.02, -0.08, config.hairColor, 0.88, 0.0);
    }
  }

  // Cap / Hat
  if (config.capStyle === 'aba_reta') {
    addBox(head, 0.48, 0.14, 0.48, 0, 0.25, 0, config.capColor, 0.76, 0.05);
    addBox(head, 0.48, 0.04, 0.24, 0, 0.19, 0.3, config.capColor, 0.72, 0.05);
  } else if (config.capStyle === 'palha') {
    addBox(head, 0.46, 0.16, 0.46, 0, 0.26, 0, '#d6b36a', 0.9, 0.0);
    addBox(head, 0.8, 0.04, 0.8, 0, 0.19, 0, '#e3c37b', 0.92, 0.0);
    addBox(head, 0.48, 0.05, 0.48, 0, 0.21, 0, '#991b1b', 0.8, 0.0);
  } else if (config.capStyle === 'gorro') {
    addBox(head, 0.48, 0.2, 0.48, 0, 0.26, 0, config.capColor, 0.92, 0.0);
    addBox(head, 0.14, 0.12, 0.14, 0, 0.39, 0, '#f5f5f4', 0.95, 0.0);
  } else if (config.capStyle === 'vaqueiro') {
    addBox(head, 0.48, 0.22, 0.5, 0, 0.28, 0, '#5c3a21', 0.82, 0.05);
    addBox(head, 0.84, 0.05, 0.74, 0, 0.18, 0, '#6b4226', 0.82, 0.05);
    addBox(head, 0.49, 0.05, 0.51, 0, 0.2, 0, '#d97706', 0.6, 0.2);
  }

  // Glasses
  if (config.glasses === 'escuros') {
    addBox(head, 0.17, 0.09, 0.05, -0.1, 0.03, 0.24, '#09090b', 0.12, 0.75);
    addBox(head, 0.17, 0.09, 0.05, 0.1, 0.03, 0.24, '#09090b', 0.12, 0.75);
    addBox(head, 0.44, 0.03, 0.04, 0, 0.05, 0.24, '#27272a', 0.3, 0.8);
  } else if (config.glasses === 'grau') {
    addBox(head, 0.16, 0.09, 0.03, -0.1, 0.03, 0.24, '#cbd5e1', 0.2, 0.8);
    addBox(head, 0.16, 0.09, 0.03, 0.1, 0.03, 0.24, '#cbd5e1', 0.2, 0.8);
    addBox(head, 0.44, 0.02, 0.03, 0, 0.04, 0.24, '#94a3b8', 0.3, 0.8);
  }

  // Headphone accessory
  if (config.accessory === 'fone') {
    addBox(head, 0.54, 0.06, 0.1, 0, 0.26, 0, '#18181b', 0.35, 0.6);
    addBox(head, 0.08, 0.18, 0.16, -0.26, 0.02, 0, '#dc2626', 0.35, 0.4);
    addBox(head, 0.08, 0.18, 0.16, 0.26, 0.02, 0, '#dc2626', 0.35, 0.4);
  }

  root.add(head);
  head.name = 'head';

  // Backpacks
  if (config.backpack === 'viagem') {
    addBox(root, 0.44, 0.54, 0.24, 0, 1.06, -0.26, '#365314', 0.85, 0.05);
    addBox(root, 0.34, 0.24, 0.08, 0, 0.94, -0.39, '#4d7c0f', 0.85, 0.05);
    addBox(root, 0.36, 0.1, 0.12, 0, 1.36, -0.26, '#d97706', 0.8, 0.05);
  } else if (config.backpack === 'escolar') {
    addBox(root, 0.38, 0.42, 0.18, 0, 1.05, -0.23, '#1e3a8a', 0.82, 0.04);
    addBox(root, 0.28, 0.18, 0.06, 0, 0.95, -0.33, '#2563eb', 0.82, 0.04);
  }

  // Neck accessories
  if (config.accessory === 'cordao') {
    addBox(root, 0.28, 0.05, 0.32, 0, 1.29, 0.01, '#facc15', 0.2, 0.92);
    addBox(root, 0.09, 0.09, 0.04, 0, 1.19, 0.16, '#facc15', 0.2, 0.92);
  } else if (config.accessory === 'lenco') {
    addBox(root, 0.34, 0.1, 0.34, 0, 1.31, 0.01, '#dc2626', 0.88, 0.0);
    addBox(root, 0.14, 0.18, 0.05, 0, 1.18, 0.17, '#b91c1c', 0.88, 0.0);
  }

  return root;
}

export function buildGrandmaVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.6));

  addBox(root, 0.2, 0.1, 0.28, -0.13, 0.05, 0.03, '#3b261d', 0.8, 0.05);
  addBox(root, 0.2, 0.1, 0.28, 0.13, 0.05, 0.03, '#3b261d', 0.8, 0.05);
  addBox(root, 0.62, 0.72, 0.44, 0, 0.46, 0, '#5b21b6', 0.88, 0.0);
  addBox(root, 0.42, 0.64, 0.06, 0, 0.48, 0.22, '#faf5ff', 0.82, 0.0);
  addBox(root, 0.56, 0.42, 0.36, 0, 1.02, 0, '#7c3aed', 0.86, 0.0);
  addBox(root, 0.32, 0.1, 0.38, 0, 1.22, 0, '#f5f3ff', 0.85, 0.0);

  // Left arm + hand
  addBox(root, 0.16, 0.44, 0.16, -0.36, 0.98, 0.04, '#c69372', 0.75, 0.0);
  // Right arm + wooden spoon
  const rightArm = new THREE.Group();
  rightArm.position.set(0.36, 1.12, 0);
  addBox(rightArm, 0.16, 0.44, 0.16, 0, -0.18, 0.08, '#c69372', 0.75, 0.0);
  addBox(rightArm, 0.06, 0.06, 0.44, 0, -0.34, 0.24, '#92400e', 0.7, 0.05);
  addBox(rightArm, 0.14, 0.05, 0.16, 0, -0.34, 0.48, '#b45309', 0.7, 0.05);
  rightArm.name = 'rightArm';
  root.add(rightArm);

  const head = new THREE.Group();
  head.position.set(0, 1.44, 0);
  addBox(head, 0.42, 0.42, 0.42, 0, 0, 0, '#c69372', 0.74, 0.0);
  addBox(head, 0.45, 0.14, 0.45, 0, 0.18, -0.01, '#d4d4d8', 0.9, 0.0);
  addBox(head, 0.22, 0.22, 0.22, 0, 0.18, -0.26, '#e4e4e7', 0.9, 0.0);
  addBox(head, 0.14, 0.08, 0.04, -0.1, 0.02, 0.22, '#e2e8f0', 0.2, 0.8);
  addBox(head, 0.14, 0.08, 0.04, 0.1, 0.02, 0.22, '#e2e8f0', 0.2, 0.8);
  addBox(head, 0.06, 0.05, 0.05, -0.1, 0.02, 0.2, '#18181b', 0.3, 0.1);
  addBox(head, 0.06, 0.05, 0.05, 0.1, 0.02, 0.2, '#18181b', 0.3, 0.1);
  addBox(head, 0.1, 0.03, 0.04, 0, -0.1, 0.22, '#9a5b46', 0.7, 0.0);
  head.name = 'head';
  root.add(head);

  return root;
}

export function buildNeighborVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.58));
  addBox(root, 0.22, 0.16, 0.3, -0.14, 0.08, 0.03, '#451a03', 0.85, 0.05);
  addBox(root, 0.22, 0.16, 0.3, 0.14, 0.08, 0.03, '#451a03', 0.85, 0.05);
  addBox(root, 0.22, 0.56, 0.24, -0.14, 0.44, 0, '#1e40af', 0.85, 0.0);
  addBox(root, 0.22, 0.56, 0.24, 0.14, 0.44, 0, '#1e40af', 0.85, 0.0);
  addBox(root, 0.54, 0.56, 0.32, 0, 1.02, 0, '#b91c1c', 0.82, 0.0);
  addBox(root, 0.1, 0.56, 0.34, -0.14, 1.02, 0, '#1e3a8a', 0.84, 0.0);
  addBox(root, 0.1, 0.56, 0.34, 0.14, 1.02, 0, '#1e3a8a', 0.84, 0.0);
  addBox(root, 0.16, 0.52, 0.16, -0.36, 0.98, 0, '#c28b68', 0.76, 0.0);
  addBox(root, 0.16, 0.52, 0.16, 0.36, 0.98, 0, '#c28b68', 0.76, 0.0);

  const head = new THREE.Group();
  head.position.set(0, 1.52, 0);
  addBox(head, 0.44, 0.44, 0.44, 0, 0, 0, '#c28b68', 0.76, 0.0);
  addBox(head, 0.08, 0.07, 0.04, -0.1, 0.04, 0.22, '#09090b', 0.2, 0.1);
  addBox(head, 0.08, 0.07, 0.04, 0.1, 0.04, 0.22, '#09090b', 0.2, 0.1);
  addBox(head, 0.26, 0.08, 0.06, 0, -0.08, 0.23, '#3f2e26', 0.9, 0.0);
  addBox(head, 0.82, 0.05, 0.82, 0, 0.2, 0, '#e5c174', 0.92, 0.0);
  addBox(head, 0.48, 0.18, 0.48, 0, 0.3, 0, '#d4af63', 0.9, 0.0);
  head.name = 'head';
  root.add(head);
  return root;
}

export function buildTiaoVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.56));
  addBox(root, 0.22, 0.14, 0.3, -0.14, 0.07, 0.03, '#1e293b', 0.8, 0.05);
  addBox(root, 0.22, 0.14, 0.3, 0.14, 0.07, 0.03, '#1e293b', 0.8, 0.05);
  addBox(root, 0.22, 0.56, 0.24, -0.14, 0.42, 0, '#334155', 0.85, 0.0);
  addBox(root, 0.22, 0.56, 0.24, 0.14, 0.42, 0, '#334155', 0.85, 0.0);
  addBox(root, 0.56, 0.56, 0.32, 0, 1.0, 0, '#15803d', 0.82, 0.0);
  addBox(root, 0.42, 0.52, 0.06, 0, 0.92, 0.18, '#fef3c7', 0.85, 0.0); // avental
  addBox(root, 0.16, 0.5, 0.16, -0.36, 0.98, 0, '#b97b56', 0.74, 0.0);
  addBox(root, 0.16, 0.5, 0.16, 0.36, 0.98, 0, '#b97b56', 0.74, 0.0);
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  addBox(head, 0.44, 0.44, 0.44, 0, 0, 0, '#b97b56', 0.74, 0.0);
  addBox(head, 0.46, 0.14, 0.46, 0, 0.22, 0, '#1d4ed8', 0.75, 0.05); // boné mercadinho
  addBox(head, 0.44, 0.04, 0.22, 0, 0.16, 0.28, '#1d4ed8', 0.75, 0.05);
  addBox(head, 0.07, 0.06, 0.04, -0.1, 0.03, 0.22, '#09090b', 0.2, 0.1);
  addBox(head, 0.07, 0.06, 0.04, 0.1, 0.03, 0.22, '#09090b', 0.2, 0.1);
  root.add(head);
  return root;
}

export function buildPadreBentoVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.58));
  addBox(root, 0.58, 1.24, 0.4, 0, 0.64, 0, '#18181b', 0.88, 0.02); // batina
  addBox(root, 0.22, 0.08, 0.42, 0, 1.25, 0, '#f8fafc', 0.8, 0.0); // colarinho branco
  addBox(root, 0.16, 0.46, 0.16, -0.36, 0.95, 0, '#18181b', 0.88, 0.0);
  addBox(root, 0.16, 0.46, 0.16, 0.36, 0.95, 0, '#18181b', 0.88, 0.0);
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  addBox(head, 0.42, 0.42, 0.42, 0, 0, 0, '#d6a37a', 0.74, 0.0);
  addBox(head, 0.44, 0.12, 0.44, 0, 0.18, -0.02, '#e4e4e7', 0.9, 0.0);
  addBox(head, 0.07, 0.05, 0.04, -0.09, 0.02, 0.21, '#18181b', 0.2, 0.1);
  addBox(head, 0.07, 0.05, 0.04, 0.09, 0.02, 0.21, '#18181b', 0.2, 0.1);
  root.add(head);
  return root;
}

export function buildZePescadorVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.56));
  addBox(root, 0.22, 0.54, 0.24, -0.14, 0.27, 0, '#78350f', 0.85, 0.0);
  addBox(root, 0.22, 0.54, 0.24, 0.14, 0.27, 0, '#78350f', 0.85, 0.0);
  addBox(root, 0.54, 0.56, 0.32, 0, 0.86, 0, '#0369a1', 0.82, 0.0);
  addBox(root, 0.56, 0.4, 0.34, 0, 0.9, 0, '#a16207', 0.86, 0.0); // colete pesca
  addBox(root, 0.15, 0.48, 0.15, -0.36, 0.84, 0, '#a46e48', 0.76, 0.0);
  addBox(root, 0.15, 0.48, 0.15, 0.36, 0.84, 0.14, '#a46e48', 0.76, 0.0);
  addBox(root, 0.04, 1.35, 0.04, 0.38, 1.15, 0.32, '#92400e', 0.7, 0.05); // vara pesca
  const head = new THREE.Group();
  head.position.set(0, 1.38, 0);
  addBox(head, 0.42, 0.42, 0.42, 0, 0, 0, '#a46e48', 0.76, 0.0);
  addBox(head, 0.68, 0.05, 0.68, 0, 0.18, 0, '#4d7c0f', 0.9, 0.0); // chapéu pescador
  addBox(head, 0.44, 0.16, 0.44, 0, 0.27, 0, '#4d7c0f', 0.9, 0.0);
  addBox(head, 0.07, 0.06, 0.04, -0.09, 0.02, 0.21, '#09090b', 0.2, 0.1);
  addBox(head, 0.07, 0.06, 0.04, 0.09, 0.02, 0.21, '#09090b', 0.2, 0.1);
  root.add(head);
  return root;
}

export function buildDonaClaraVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.56));
  addBox(root, 0.58, 0.7, 0.42, 0, 0.42, 0, '#9f1239', 0.86, 0.0);
  addBox(root, 0.4, 0.6, 0.06, 0, 0.44, 0.22, '#fef08a', 0.84, 0.0);
  addBox(root, 0.54, 0.44, 0.34, 0, 0.98, 0, '#f43f5e', 0.84, 0.0);
  addBox(root, 0.15, 0.44, 0.15, -0.35, 0.95, 0, '#d6a37a', 0.74, 0.0);
  addBox(root, 0.15, 0.44, 0.15, 0.35, 0.95, 0, '#d6a37a', 0.74, 0.0);
  const head = new THREE.Group();
  head.position.set(0, 1.42, 0);
  addBox(head, 0.42, 0.42, 0.42, 0, 0, 0, '#d6a37a', 0.74, 0.0);
  addBox(head, 0.46, 0.18, 0.46, 0, 0.16, -0.02, '#451a03', 0.88, 0.0);
  addBox(head, 0.48, 0.08, 0.48, 0, 0.14, 0, '#eab308', 0.82, 0.0); // lenço amarelo
  addBox(head, 0.07, 0.05, 0.04, -0.09, 0.02, 0.21, '#18181b', 0.2, 0.1);
  addBox(head, 0.07, 0.05, 0.04, 0.09, 0.02, 0.21, '#18181b', 0.2, 0.1);
  root.add(head);
  return root;
}

export function buildSaciVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.45));
  addBox(root, 0.18, 0.52, 0.18, 0, 0.26, 0, '#4a2c1d', 0.72, 0.0);
  addBox(root, 0.44, 0.22, 0.28, 0, 0.58, 0, '#dc2626', 0.82, 0.0);
  addBox(root, 0.44, 0.44, 0.26, 0, 0.9, 0, '#4a2c1d', 0.72, 0.0);
  addBox(root, 0.14, 0.42, 0.14, -0.3, 0.92, 0, '#4a2c1d', 0.72, 0.0);
  addBox(root, 0.14, 0.42, 0.14, 0.3, 0.92, 0.08, '#4a2c1d', 0.72, 0.0);

  const head = new THREE.Group();
  head.position.set(0, 1.32, 0);
  addBox(head, 0.38, 0.38, 0.38, 0, 0, 0, '#4a2c1d', 0.72, 0.0);
  addBox(head, 0.07, 0.06, 0.04, -0.09, 0.02, 0.19, '#fde047', 0.3, 0.1, 0xfacc15, 0.8);
  addBox(head, 0.07, 0.06, 0.04, 0.09, 0.02, 0.19, '#fde047', 0.3, 0.1, 0xfacc15, 0.8);
  addBox(head, 0.05, 0.05, 0.22, 0.08, -0.1, 0.28, '#78350f', 0.8, 0.0);
  addBox(head, 0.08, 0.09, 0.08, 0.08, -0.06, 0.38, '#ef4444', 0.5, 0.0, 0xf97316, 1.2);
  addBox(head, 0.42, 0.2, 0.42, 0, 0.24, 0, '#dc2626', 0.8, 0.0);
  addBox(head, 0.28, 0.24, 0.28, 0, 0.4, -0.06, '#b91c1c', 0.82, 0.0);
  addBox(head, 0.16, 0.16, 0.22, 0, 0.52, -0.14, '#991b1b', 0.82, 0.0);
  root.add(head);
  return root;
}

export function buildHomemDoSacoVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.75));
  addBox(root, 0.24, 0.95, 0.26, -0.18, 0.48, 0, '#111827', 0.88, 0.05);
  addBox(root, 0.24, 0.95, 0.26, 0.18, 0.48, 0, '#111827', 0.88, 0.05);
  addBox(root, 0.72, 1.15, 0.44, 0, 1.38, 0, '#1c1917', 0.9, 0.05);
  addBox(root, 0.78, 0.36, 0.48, 0, 1.72, 0, '#292524', 0.85, 0.08);

  const sack = new THREE.Group();
  sack.position.set(0.38, 1.65, -0.28);
  sack.rotation.z = -0.25;
  addBox(sack, 0.58, 0.92, 0.56, 0, 0, 0, '#85623b', 0.95, 0.0);
  addBox(sack, 0.36, 0.22, 0.36, 0, 0.5, 0, '#6e4e2d', 0.95, 0.0);
  addBox(sack, 0.24, 0.08, 0.24, 0, 0.42, 0, '#292524', 0.9, 0.0);
  root.add(sack);

  const leftArm = addBox(root, 0.18, 0.88, 0.18, -0.46, 1.44, 0.1, '#1c1917', 0.88, 0.05);
  const rightArm = addBox(root, 0.18, 0.82, 0.18, 0.44, 1.48, 0.16, '#1c1917', 0.88, 0.05);
  leftArm.name = 'leftArm';
  rightArm.name = 'rightArm';

  const head = new THREE.Group();
  head.position.set(0, 2.15, 0.06);
  addBox(head, 0.44, 0.48, 0.44, 0, 0, 0, '#09090b', 0.95, 0.0);
  addBox(head, 0.09, 0.07, 0.05, -0.1, 0.04, 0.22, '#fef08a', 0.1, 0.0, 0xfef08a, 2.5);
  addBox(head, 0.09, 0.07, 0.05, 0.1, 0.04, 0.22, '#fef08a', 0.1, 0.0, 0xfef08a, 2.5);
  addBox(head, 0.88, 0.05, 0.88, 0, 0.22, 0, '#18181b', 0.88, 0.05);
  addBox(head, 0.5, 0.24, 0.5, 0, 0.34, 0, '#18181b', 0.88, 0.05);
  root.add(head);
  return root;
}

export function buildChickenVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.32));
  const legL = addBox(root, 0.05, 0.22, 0.05, -0.09, 0.11, 0, '#f59e0b', 0.7, 0.0);
  const legR = addBox(root, 0.05, 0.22, 0.05, 0.09, 0.11, 0, '#f59e0b', 0.7, 0.0);
  legL.name = 'leftLeg';
  legR.name = 'rightLeg';
  addBox(root, 0.09, 0.03, 0.14, -0.09, 0.015, 0.04, '#f59e0b', 0.7, 0.0);
  addBox(root, 0.09, 0.03, 0.14, 0.09, 0.015, 0.04, '#f59e0b', 0.7, 0.0);
  addBox(root, 0.34, 0.3, 0.44, 0, 0.34, 0, '#fafaf9', 0.84, 0.0);
  addBox(root, 0.24, 0.22, 0.14, 0, 0.48, -0.22, '#e7e5e4', 0.85, 0.0);
  const wingL = addBox(root, 0.07, 0.2, 0.3, -0.2, 0.36, 0, '#f5f5f4', 0.82, 0.0);
  const wingR = addBox(root, 0.07, 0.2, 0.3, 0.2, 0.36, 0, '#f5f5f4', 0.82, 0.0);
  wingL.name = 'wingL';
  wingR.name = 'wingR';

  const head = new THREE.Group();
  head.position.set(0, 0.56, 0.18);
  addBox(head, 0.22, 0.24, 0.22, 0, 0, 0, '#fafaf9', 0.84, 0.0);
  addBox(head, 0.06, 0.1, 0.16, 0, 0.16, 0, '#dc2626', 0.7, 0.0);
  addBox(head, 0.08, 0.07, 0.06, 0, -0.08, 0.12, '#dc2626', 0.7, 0.0);
  addBox(head, 0.1, 0.07, 0.12, 0, -0.02, 0.15, '#f59e0b', 0.6, 0.0);
  addBox(head, 0.04, 0.04, 0.03, -0.07, 0.04, 0.11, '#ef4444', 0.2, 0.0, 0xff0000, 1.4);
  addBox(head, 0.04, 0.04, 0.03, 0.07, 0.04, 0.11, '#ef4444', 0.2, 0.0, 0xff0000, 1.4);
  root.add(head);
  return root;
}

export function buildCriaturaFlorestaVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.72));
  // Tall moss-covered gaunt woodland stalker with antlers!
  addBox(root, 0.2, 0.9, 0.22, -0.18, 0.45, 0, '#27272a', 0.92, 0.0);
  addBox(root, 0.2, 0.9, 0.22, 0.18, 0.45, 0, '#27272a', 0.92, 0.0);
  addBox(root, 0.62, 0.82, 0.4, 0, 1.24, 0, '#1f291c', 0.94, 0.0);
  addBox(root, 0.72, 0.36, 0.46, 0, 1.54, 0.06, '#365314', 0.94, 0.0); // moss shoulders
  addBox(root, 0.16, 0.85, 0.16, -0.44, 1.2, 0.14, '#27272a', 0.9, 0.0);
  addBox(root, 0.16, 0.85, 0.16, 0.44, 1.2, 0.14, '#27272a', 0.9, 0.0);

  const head = new THREE.Group();
  head.position.set(0, 1.9, 0.14);
  addBox(head, 0.4, 0.44, 0.44, 0, 0, 0, '#d6d3d1', 0.85, 0.0); // pale skull-mask
  addBox(head, 0.08, 0.06, 0.04, -0.1, 0.04, 0.22, '#22c55e', 0.2, 0.0, 0x22c55e, 2.2);
  addBox(head, 0.08, 0.06, 0.04, 0.1, 0.04, 0.22, '#22c55e', 0.2, 0.0, 0x22c55e, 2.2);
  // Antlers
  addBox(head, 0.08, 0.48, 0.08, -0.2, 0.4, -0.05, '#451a03', 0.9, 0.0);
  addBox(head, 0.08, 0.48, 0.08, 0.2, 0.4, -0.05, '#451a03', 0.9, 0.0);
  addBox(head, 0.22, 0.07, 0.07, -0.28, 0.52, -0.05, '#451a03', 0.9, 0.0);
  addBox(head, 0.22, 0.07, 0.07, 0.28, 0.52, -0.05, '#451a03', 0.9, 0.0);
  root.add(head);
  return root;
}

export function buildMulaSemCabecaVoxel(): THREE.Group {
  const root = new THREE.Group();
  root.add(createContactShadow(0.76));
  // 4 galloping legs
  addBox(root, 0.16, 0.68, 0.16, -0.22, 0.34, 0.42, '#292524', 0.88, 0.0);
  addBox(root, 0.16, 0.68, 0.16, 0.22, 0.34, 0.42, '#292524', 0.88, 0.0);
  addBox(root, 0.16, 0.68, 0.16, -0.22, 0.34, -0.42, '#292524', 0.88, 0.0);
  addBox(root, 0.16, 0.68, 0.16, 0.22, 0.34, -0.42, '#292524', 0.88, 0.0);
  // Equine body + saddle
  addBox(root, 0.56, 0.54, 1.18, 0, 0.86, 0, '#3b2418', 0.86, 0.02);
  addBox(root, 0.58, 0.14, 0.42, 0, 1.14, -0.06, '#7f1d1d', 0.78, 0.05);
  // Neck ending in roaring spectral fire instead of a head!
  addBox(root, 0.28, 0.46, 0.3, 0, 1.24, 0.48, '#3b2418', 0.86, 0.02);
  addBox(root, 0.32, 0.36, 0.32, 0, 1.56, 0.52, '#f97316', 0.3, 0.0, 0xf97316, 2.4);
  addBox(root, 0.2, 0.28, 0.2, 0, 1.78, 0.52, '#fde047', 0.2, 0.0, 0xfacc15, 2.8);
  return root;
}

export function buildWardrobeVoxel(): THREE.Group {
  const root = new THREE.Group();
  addBox(root, 1.3, 2.2, 0.85, 0, 1.1, 0, '#5c3a21', 0.78, 0.05);
  addBox(root, 1.38, 0.12, 0.92, 0, 2.22, 0, '#452815', 0.72, 0.05);
  addBox(root, 0.56, 1.9, 0.06, -0.31, 1.08, 0.44, '#6e472b', 0.72, 0.04);
  addBox(root, 0.56, 1.9, 0.06, 0.31, 1.08, 0.44, '#6e472b', 0.72, 0.04);
  addBox(root, 0.05, 0.16, 0.06, -0.08, 1.08, 0.49, '#eab308', 0.25, 0.85);
  addBox(root, 0.05, 0.16, 0.06, 0.08, 1.08, 0.49, '#eab308', 0.25, 0.85);
  return root;
}

export function buildTvVoxel(): THREE.Group {
  const root = new THREE.Group();
  addBox(root, 0.92, 0.72, 0.56, 0, 0.36, 0, '#452815', 0.76, 0.05);
  const screen = addBox(root, 0.66, 0.5, 0.04, -0.06, 0.38, 0.29, '#1e293b', 0.2, 0.3, 0x38bdf8, 0.4);
  screen.name = 'tvScreen';
  addBox(root, 0.04, 0.4, 0.04, -0.14, 0.88, 0, '#94a3b8', 0.3, 0.8);
  addBox(root, 0.04, 0.4, 0.04, 0.14, 0.88, 0, '#94a3b8', 0.3, 0.8);
  return root;
}

export function buildMirrorVoxel(): THREE.Group {
  const root = new THREE.Group();
  addBox(root, 0.9, 1.2, 0.08, 0, 0, 0, '#452815', 0.72, 0.05);
  addBox(root, 0.74, 1.02, 0.04, 0, 0, 0.03, '#bae6fd', 0.05, 0.92);
  return root;
}

export function buildBikeVoxel(): THREE.Group {
  const root = new THREE.Group();
  addBox(root, 0.1, 0.54, 0.54, 0, 0.28, -0.54, '#18181b', 0.85, 0.1);
  addBox(root, 0.1, 0.54, 0.54, 0, 0.28, 0.54, '#18181b', 0.85, 0.1);
  addBox(root, 0.08, 0.08, 1.05, 0, 0.62, 0, '#dc2626', 0.35, 0.7);
  addBox(root, 0.08, 0.55, 0.08, 0, 0.56, 0.42, '#dc2626', 0.35, 0.7);
  addBox(root, 0.58, 0.06, 0.08, 0, 0.86, 0.44, '#e2e8f0', 0.25, 0.85);
  addBox(root, 0.22, 0.08, 0.28, 0, 0.76, -0.24, '#292524', 0.85, 0.0);
  return root;
}

export function buildPushCrateVoxel(color = '#7c4d2b'): THREE.Group {
  const root = new THREE.Group();
  addBox(root, 0.9, 0.9, 0.9, 0, 0, 0, color, 0.84, 0.04);
  addBox(root, 0.94, 0.1, 0.94, 0, 0.38, 0, '#452815', 0.8, 0.05);
  addBox(root, 0.94, 0.1, 0.94, 0, -0.38, 0, '#452815', 0.8, 0.05);
  return root;
}

export function buildCandleVoxel(): THREE.Group {
  const root = new THREE.Group();
  addBox(root, 0.22, 0.06, 0.22, 0, 0.03, 0, '#eab308', 0.3, 0.8);
  addBox(root, 0.09, 0.24, 0.09, 0, 0.18, 0, '#fef3c7', 0.85, 0.0);
  const flame = addBox(root, 0.06, 0.09, 0.06, 0, 0.35, 0, '#fb923c', 0.2, 0.0, 0xf97316, 2.2);
  flame.name = 'flame';
  return root;
}

export function buildPickupProp(itemId: string): THREE.Group {
  const root = new THREE.Group();
  if (itemId === 'lanterna') {
    addBox(root, 0.14, 0.14, 0.36, 0, 0.16, 0, '#334155', 0.4, 0.7);
    addBox(root, 0.18, 0.18, 0.08, 0, 0.16, 0.2, '#facc15', 0.2, 0.5, 0xfef08a, 1.4);
  } else if (itemId === 'pao_de_queijo' || itemId === 'broa_fuba') {
    addBox(root, 0.28, 0.16, 0.28, 0, 0.12, 0, '#e5a93c', 0.75, 0.0);
    addBox(root, 0.18, 0.14, 0.18, 0.08, 0.22, -0.04, '#f59e0b', 0.75, 0.0);
  } else if (itemId === 'milho_bento') {
    addBox(root, 0.14, 0.38, 0.14, 0, 0.24, 0, '#facc15', 0.65, 0.0, 0xfef08a, 0.5);
    addBox(root, 0.18, 0.24, 0.18, 0, 0.14, 0, '#4d7c0f', 0.85, 0.0);
  } else if (itemId === 'cruz_madeira') {
    addBox(root, 0.1, 0.55, 0.1, 0, 0.3, 0, '#92400e', 0.65, 0.1, 0xfbbf24, 0.4);
    addBox(root, 0.36, 0.1, 0.1, 0, 0.42, 0, '#92400e', 0.65, 0.1, 0xfbbf24, 0.4);
  } else if (itemId.includes('chave') || itemId === 'cartao_complexo') {
    addBox(root, 0.18, 0.06, 0.18, 0, 0.16, -0.08, '#f59e0b', 0.25, 0.9, 0xfbbf24, 0.5);
    addBox(root, 0.06, 0.06, 0.26, 0, 0.16, 0.1, '#f59e0b', 0.25, 0.9, 0xfbbf24, 0.5);
  } else if (itemId.includes('lore') || itemId === 'diario_vizinho') {
    addBox(root, 0.34, 0.05, 0.42, 0, 0.14, 0, '#fef3c7', 0.82, 0.0, 0xfde68a, 0.35);
    addBox(root, 0.24, 0.06, 0.06, 0, 0.16, 0, '#b91c1c', 0.7, 0.0);
  } else {
    addBox(root, 0.26, 0.22, 0.22, 0, 0.16, 0, '#d97706', 0.6, 0.15, 0xf59e0b, 0.35);
    addBox(root, 0.28, 0.06, 0.24, 0, 0.28, 0, '#fef3c7', 0.8, 0.0);
  }
  return root;
}
