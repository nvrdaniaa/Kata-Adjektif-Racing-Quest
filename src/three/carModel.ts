import * as THREE from 'three';
import { CarConfig } from '../types';

export interface CarModelInstance {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  frontWheelGroups: THREE.Group[];
  update: (speed: number, steerAngle: number) => void;
  dispose: () => void;
}

/**
 * Creates a high-fidelity 3D arcade race car (THREE.Group composed of 10+ distinct parts)
 * with proper PBR roughness/metalness contrast and bottom-center pivot.
 */
export function createRaceCar(config: CarConfig): CarModelInstance {
  const rootGroup = new THREE.Group();

  const primaryMaterial = new THREE.MeshStandardMaterial({
    color: config.hexColor,
    metalness: 0.85,
    roughness: 0.22,
  });

  const secondaryMaterial = new THREE.MeshStandardMaterial({
    color: config.secondaryHex,
    metalness: 0.5,
    roughness: 0.55,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a192f,
    metalness: 0.1,
    roughness: 0.1,
    transparent: true,
    opacity: 0.88,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f2421,
    roughness: 0.9,
    metalness: 0.1,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.95,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x93c5fd,
    emissiveIntensity: 1.4,
    roughness: 0.1,
  });

  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.15,
  });

  // Track all disposables
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [
    primaryMaterial,
    secondaryMaterial,
    glassMaterial,
    tireMaterial,
    rimMaterial,
    headlightMaterial,
    taillightMaterial,
    chromeMaterial,
  ];

  // 1. Lower Chassis & Aerodynamic Floor (Splitter / Diffuser)
  const chassisGeo = new THREE.BoxGeometry(2.1, 0.35, 4.4);
  geometries.push(chassisGeo);
  const chassisMesh = new THREE.Mesh(chassisGeo, secondaryMaterial);
  chassisMesh.position.set(0, 0.38, 0);
  chassisMesh.castShadow = true;
  rootGroup.add(chassisMesh);

  // 2. Main Body (Sleek sports car curve)
  const bodyGeo = new THREE.BoxGeometry(1.95, 0.45, 3.8);
  geometries.push(bodyGeo);
  const bodyMesh = new THREE.Mesh(bodyGeo, primaryMaterial);
  bodyMesh.position.set(0, 0.65, -0.1);
  bodyMesh.castShadow = true;
  rootGroup.add(bodyMesh);

  // 2b. Front Hood Taper (wedge)
  const hoodGeo = new THREE.CylinderGeometry(0.75, 0.95, 1.4, 4);
  geometries.push(hoodGeo);
  hoodGeo.rotateY(Math.PI / 4);
  hoodGeo.rotateX(Math.PI / 2);
  const hoodMesh = new THREE.Mesh(hoodGeo, primaryMaterial);
  hoodMesh.position.set(0, 0.62, 1.6);
  hoodMesh.scale.set(1.0, 0.3, 1.0);
  hoodMesh.castShadow = true;
  rootGroup.add(hoodMesh);

  // 3. Cabin & Cockpit Canopy
  const cabinGeo = new THREE.BoxGeometry(1.4, 0.52, 1.9);
  geometries.push(cabinGeo);
  const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
  cabinMesh.position.set(0, 1.05, -0.3);
  cabinMesh.castShadow = true;
  rootGroup.add(cabinMesh);

  // Roof cap
  const roofGeo = new THREE.BoxGeometry(1.35, 0.08, 1.3);
  geometries.push(roofGeo);
  const roofMesh = new THREE.Mesh(roofGeo, secondaryMaterial);
  roofMesh.position.set(0, 1.33, -0.35);
  roofMesh.castShadow = true;
  rootGroup.add(roofMesh);

  // 4. Racing Spoiler Wing
  const wingStandGeo = new THREE.BoxGeometry(0.08, 0.45, 0.2);
  geometries.push(wingStandGeo);
  const wingLeft = new THREE.Mesh(wingStandGeo, secondaryMaterial);
  wingLeft.position.set(-0.65, 1.05, -1.8);
  wingLeft.castShadow = true;
  rootGroup.add(wingLeft);

  const wingRight = new THREE.Mesh(wingStandGeo, secondaryMaterial);
  wingRight.position.set(0.65, 1.05, -1.8);
  wingRight.castShadow = true;
  rootGroup.add(wingRight);

  const wingBladeGeo = new THREE.BoxGeometry(1.85, 0.08, 0.45);
  geometries.push(wingBladeGeo);
  const wingBlade = new THREE.Mesh(wingBladeGeo, primaryMaterial);
  wingBlade.position.set(0, 1.28, -1.8);
  wingBlade.rotation.x = 0.08;
  wingBlade.castShadow = true;
  rootGroup.add(wingBlade);

  // 5. Headlights
  const lightGeo = new THREE.BoxGeometry(0.35, 0.12, 0.15);
  geometries.push(lightGeo);

  const hlLeft = new THREE.Mesh(lightGeo, headlightMaterial);
  hlLeft.position.set(-0.68, 0.62, 2.05);
  rootGroup.add(hlLeft);

  const hlRight = new THREE.Mesh(lightGeo, headlightMaterial);
  hlRight.position.set(0.68, 0.62, 2.05);
  rootGroup.add(hlRight);

  // 6. Taillights
  const tailGeo = new THREE.BoxGeometry(0.4, 0.12, 0.1);
  geometries.push(tailGeo);

  const tlLeft = new THREE.Mesh(tailGeo, taillightMaterial);
  tlLeft.position.set(-0.65, 0.7, -2.02);
  rootGroup.add(tlLeft);

  const tlRight = new THREE.Mesh(tailGeo, taillightMaterial);
  tlRight.position.set(0.65, 0.7, -2.02);
  rootGroup.add(tlRight);

  // 7. Exhaust Pipes
  const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
  geometries.push(exhaustGeo);
  exhaustGeo.rotateX(Math.PI / 2);

  const exLeft = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exLeft.position.set(-0.35, 0.35, -2.18);
  rootGroup.add(exLeft);

  const exRight = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exRight.position.set(0.35, 0.35, -2.18);
  rootGroup.add(exRight);

  // 8. Wheels & Rims (4 wheels)
  const wheelRadius = 0.38;
  const wheelWidth = 0.28;
  const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
  geometries.push(tireGeo);
  tireGeo.rotateZ(Math.PI / 2);

  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 12);
  geometries.push(rimGeo);
  rimGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    { x: -1.08, y: wheelRadius, z: 1.35, isFront: true },  // Front Left
    { x: 1.08, y: wheelRadius, z: 1.35, isFront: true },   // Front Right
    { x: -1.08, y: wheelRadius, z: -1.35, isFront: false }, // Rear Left
    { x: 1.08, y: wheelRadius, z: -1.35, isFront: false },  // Rear Right
  ];

  const wheelMeshes: THREE.Mesh[] = [];
  const frontWheelGroups: THREE.Group[] = [];

  wheelPositions.forEach((pos) => {
    const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
    tireMesh.castShadow = true;

    const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
    tireMesh.add(rimMesh);

    if (pos.isFront) {
      const steerPivot = new THREE.Group();
      steerPivot.position.set(pos.x, pos.y, pos.z);
      steerPivot.add(tireMesh);
      rootGroup.add(steerPivot);
      frontWheelGroups.push(steerPivot);
    } else {
      tireMesh.position.set(pos.x, pos.y, pos.z);
      rootGroup.add(tireMesh);
    }
    wheelMeshes.push(tireMesh);
  });

  // Soft Contact Ground Shadow under car
  const shadowGeo = new THREE.PlaneGeometry(2.6, 5.0);
  geometries.push(shadowGeo);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  materials.push(shadowMat);
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  rootGroup.add(shadowMesh);

  return {
    group: rootGroup,
    wheels: wheelMeshes,
    frontWheelGroups,
    update: (speed: number, steerAngle: number) => {
      // Rotate wheels based on vehicle speed
      const rotDelta = speed * 0.12;
      for (let i = 0; i < wheelMeshes.length; i++) {
        wheelMeshes[i].rotation.x += rotDelta;
      }
      // Steer front wheels
      for (let i = 0; i < frontWheelGroups.length; i++) {
        frontWheelGroups[i].rotation.y = steerAngle;
      }
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
