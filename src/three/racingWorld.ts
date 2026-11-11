import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CarConfig, Question } from '../types';
import { CAR_MODELS } from '../data/questions';
import { createRaceCar, CarModelInstance } from './carModel';
import { soundManager } from '../audio/soundManager';

export interface RacingWorldCallbacks {
  onGiftHit: (question: Question, giftIndex: number) => void;
  onSpeedUpdate: (speedKmH: number) => void;
  onLapProgress: (progressRatio: number) => void;
  onLapTimeUpdate?: (lapTimeMs: number) => void;
}

export interface RivalRacer {
  instance: CarModelInstance;
  config: CarConfig;
  t: number;
  lateral: number;
  targetLateral: number;
  speed: number;
  baseSpeed: number;
  steer: number;
  laneTimer: number;
  name: string;
}

export interface TrackPoint {
  x: number;
  z: number;
  tangentX: number;
  tangentZ: number;
  angle: number;
}

export class RacingWorld {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private lastTime: number = 0;
  private elapsedTime: number = 0;
  private activeLapTime: number = 0;
  private frameId: number = 0;
  private isDestroyed: boolean = false;
  private isPaused: boolean = false;

  private carInstance: CarModelInstance | null = null;
  private currentCarConfig: CarConfig;
  private round: 1 | 2 = 1;
  private questions: Question[] = [];
  private callbacks: RacingWorldCallbacks;

  // Track path spline
  private trackCurve!: THREE.CatmullRomCurve3;
  private trackMesh!: THREE.Mesh;
  private curbsMesh!: THREE.InstancedMesh;
  private guardrailsGroup: THREE.Group = new THREE.Group();
  private sceneryGroup: THREE.Group = new THREE.Group();

  // Gift collectibles
  private giftBoxes: {
    group: THREE.Group;
    boxMesh: THREE.Mesh;
    ringMesh: THREE.Mesh;
    collected: boolean;
    trackT: number;
    question: Question;
    giftIndex: number;
  }[] = [];

  // Rival AI Racers
  private rivals: RivalRacer[] = [];

  // Car Kinematics
  public carT: number = 0.02; // Progress along track 0..1
  public carLateral: number = 0; // Lateral offset from track center (-10 to +10)
  public carSpeed: number = 0; // Speed in track units/sec
  public carSteer: number = 0; // Current steering wheel angle
  public keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  private particlesGroup: THREE.Group = new THREE.Group();
  private burstParticles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];

  // Software WebGL guard
  private isSoftwareGl: boolean;

  constructor(
    container: HTMLElement,
    carConfig: CarConfig,
    round: 1 | 2,
    questions: Question[],
    callbacks: RacingWorldCallbacks
  ) {
    this.container = container;
    this.currentCarConfig = carConfig;
    this.round = round;
    this.questions = questions;
    this.callbacks = callbacks;
    this.lastTime = performance.now();

    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const rendererStr = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(String(rendererStr));
      } catch {
        return false;
      }
    })();

    // 2. Initialize Three.js scene & camera
    this.scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.5, 900);
    this.camera.position.set(0, 7, -14);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.round === 1 ? 1.15 : 1.35;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Studio Room Environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Build Environment, Track, Lighting & Scenery
    this.setupLightingAndAtmosphere();
    this.buildTrack();
    this.spawnScenery();
    this.spawnGiftBoxes();
    this.spawnCar();
    this.spawnRivals();

    this.scene.add(this.particlesGroup);

    // 5. Setup Window Resize handler
    window.addEventListener('resize', this.onWindowResize);

    // 6. Start Render Loop
    this.tick();
  }

  private setupLightingAndAtmosphere() {
    if (this.round === 1) {
      // Round 1: Cerah & Bertenaga (Siang / Senja Tropika)
      this.scene.background = new THREE.Color(0x38bdf8); // Sky blue
      this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0035);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.85);
      this.scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
      dirLight.position.set(60, 90, 40);
      if (!this.isSoftwareGl) {
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 10;
        dirLight.shadow.camera.far = 300;
        const d = 60;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.bias = -0.0005;
      }
      this.scene.add(dirLight);
    } else {
      // Round 2 (Bonus): Litar Siber Gemilang (Futuristic Neon Night)
      this.scene.background = new THREE.Color(0x050814); // Deep night space
      this.scene.fog = new THREE.FogExp2(0x090d21, 0.0045);

      const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.7);
      this.scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xc084fc, 1.4);
      dirLight.position.set(-40, 80, -30);
      this.scene.add(dirLight);

      const neonAccent = new THREE.PointLight(0x06b6d4, 3, 120);
      neonAccent.position.set(0, 15, 0);
      this.scene.add(neonAccent);
    }
  }

  private buildTrack() {
    // Generate an exciting, flowing race circuit with sweeping curves and straights
    const controlPoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(80, 0, 120),
      new THREE.Vector3(180, 0, 200),
      new THREE.Vector3(280, 0, 160),
      new THREE.Vector3(340, 0, 40),
      new THREE.Vector3(360, 0, -100),
      new THREE.Vector3(260, 0, -220),
      new THREE.Vector3(120, 0, -280),
      new THREE.Vector3(-40, 0, -240),
      new THREE.Vector3(-140, 0, -160),
      new THREE.Vector3(-180, 0, -20),
      new THREE.Vector3(-120, 0, 80),
      new THREE.Vector3(-40, 0, 40),
    ];

    this.trackCurve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.25);

    // Build the asphalt ribbon
    const segments = 360;
    const trackWidth = 18;
    const trackGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const points = this.trackCurve.getSpacedPoints(segments);

    for (let i = 0; i <= segments; i++) {
      const p = points[i % segments];
      const nextP = points[(i + 1) % segments];
      const forward = new THREE.Vector3().subVectors(nextP, p).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();

      const leftPt = new THREE.Vector3().copy(p).addScaledVector(right, -trackWidth / 2);
      const rightPt = new THREE.Vector3().copy(p).addScaledVector(right, trackWidth / 2);

      vertices.push(leftPt.x, leftPt.y + 0.05, leftPt.z);
      normals.push(0, 1, 0);
      uvs.push(0, i * 0.4);

      vertices.push(rightPt.x, rightPt.y + 0.05, rightPt.z);
      normals.push(0, 1, 0);
      uvs.push(1, i * 0.4);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    trackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    trackGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    trackGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    trackGeometry.setIndex(indices);

    const trackColor = this.round === 1 ? 0x27272a : 0x111827;
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: trackColor,
      roughness: 0.85,
      metalness: 0.1,
    });

    this.trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    this.trackMesh.receiveShadow = true;
    this.scene.add(this.trackMesh);

    // Build Curbs (Red-White or Neon-Cyan alternating rumble strips)
    this.buildRumbleCurbs(segments, trackWidth);

    // Center Dashed White Lines
    this.buildCenterStripes(segments);

    // Outer Terrain Ground
    const groundGeo = new THREE.PlaneGeometry(1600, 1600, 16, 16);
    const groundColor = this.round === 1 ? 0x15803d : 0x090d16;
    const groundMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.95,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Start / Finish Arch Portal
    this.buildStartFinishArch();
  }

  private buildRumbleCurbs(segments: number, trackWidth: number) {
    const curbGeo = new THREE.BoxGeometry(0.9, 0.22, 1.4);
    const curbCount = segments * 2;
    this.curbsMesh = new THREE.InstancedMesh(
      curbGeo,
      new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 }),
      curbCount
    );

    const dummy = new THREE.Object3D();
    const colorRed = new THREE.Color(this.round === 1 ? 0xdc2626 : 0xec4899);
    const colorWhite = new THREE.Color(this.round === 1 ? 0xf8fafc : 0x06b6d4);

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const pt = this.trackCurve.getPointAt(t);
      const tangent = this.trackCurve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      // Left curb
      const leftPos = new THREE.Vector3().copy(pt).addScaledVector(right, -trackWidth / 2 - 0.45);
      dummy.position.copy(leftPos);
      dummy.position.y = 0.1;
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      dummy.updateMatrix();
      this.curbsMesh.setMatrixAt(i * 2, dummy.matrix);
      this.curbsMesh.setColorAt(i * 2, i % 2 === 0 ? colorRed : colorWhite);

      // Right curb
      const rightPos = new THREE.Vector3().copy(pt).addScaledVector(right, trackWidth / 2 + 0.45);
      dummy.position.copy(rightPos);
      dummy.position.y = 0.1;
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      dummy.updateMatrix();
      this.curbsMesh.setMatrixAt(i * 2 + 1, dummy.matrix);
      this.curbsMesh.setColorAt(i * 2 + 1, i % 2 === 0 ? colorWhite : colorRed);
    }
    this.curbsMesh.instanceMatrix.needsUpdate = true;
    if (this.curbsMesh.instanceColor) this.curbsMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.curbsMesh);
  }

  private buildCenterStripes(segments: number) {
    const stripeGeo = new THREE.PlaneGeometry(0.35, 1.8);
    const stripeCount = Math.floor(segments / 2);
    const stripesMesh = new THREE.InstancedMesh(
      stripeGeo,
      new THREE.MeshBasicMaterial({
        color: this.round === 1 ? 0xfef08a : 0x38bdf8,
        depthWrite: false,
      }),
      stripeCount
    );

    const dummy = new THREE.Object3D();
    for (let i = 0; i < stripeCount; i++) {
      const t = (i * 2) / segments;
      const pt = this.trackCurve.getPointAt(t);
      const tangent = this.trackCurve.getTangentAt(t).normalize();

      dummy.position.copy(pt);
      dummy.position.y = 0.08;
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0));
      dummy.rotation.x = -Math.PI / 2;
      dummy.rotation.z = Math.atan2(tangent.x, tangent.z);
      dummy.updateMatrix();
      stripesMesh.setMatrixAt(i, dummy.matrix);
    }
    stripesMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(stripesMesh);
  }

  private buildStartFinishArch() {
    const archGroup = new THREE.Group();
    const p0 = this.trackCurve.getPointAt(0.01);
    const tangent = this.trackCurve.getTangentAt(0.01).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });

    const crossMat = new THREE.MeshStandardMaterial({
      color: this.round === 1 ? 0x2563eb : 0x7c3aed,
      emissive: this.round === 1 ? 0x1d4ed8 : 0x6d28d9,
      emissiveIntensity: 0.5,
    });

    // Pillars
    const pillarGeo = new THREE.BoxGeometry(1.2, 10, 1.2);
    const pLeft = new THREE.Mesh(pillarGeo, pillarMat);
    pLeft.position.copy(p0).addScaledVector(right, -11);
    pLeft.position.y = 5;

    const pRight = new THREE.Mesh(pillarGeo, pillarMat);
    pRight.position.copy(p0).addScaledVector(right, 11);
    pRight.position.y = 5;

    // Crossbar Banner
    const crossGeo = new THREE.BoxGeometry(24, 2.5, 1.5);
    const crossBar = new THREE.Mesh(crossGeo, crossMat);
    crossBar.position.copy(p0);
    crossBar.position.y = 9;

    archGroup.add(pLeft, pRight, crossBar);
    this.scene.add(archGroup);
  }

  private spawnScenery() {
    // Roadside trees, light towers, and distance markers
    const totalProps = 60;
    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 6);
    const treeLeavesGeo = new THREE.ConeGeometry(2.4, 6.0, 7);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({
      color: this.round === 1 ? 0x166534 : 0x1e1b4b,
      roughness: 0.8,
    });

    for (let i = 0; i < totalProps; i++) {
      const t = i / totalProps;
      const pt = this.trackCurve.getPointAt(t);
      const tangent = this.trackCurve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      const offsetDist = 18 + Math.random() * 22;
      const side = i % 2 === 0 ? 1 : -1;
      const treePos = new THREE.Vector3().copy(pt).addScaledVector(right, side * offsetDist);

      const treeGroup = new THREE.Group();
      treeGroup.position.set(treePos.x, 0, treePos.z);

      const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
      trunk.position.y = 1.75;
      trunk.castShadow = !this.isSoftwareGl;

      const leaves = new THREE.Mesh(treeLeavesGeo, leavesMat);
      leaves.position.y = 5.5;
      leaves.castShadow = !this.isSoftwareGl;

      treeGroup.add(trunk, leaves);
      const scale = 0.8 + Math.random() * 0.5;
      treeGroup.scale.set(scale, scale, scale);
      this.sceneryGroup.add(treeGroup);
    }

    this.scene.add(this.sceneryGroup);
  }

  private spawnGiftBoxes() {
    // 10 gifts for round 1, 5 gifts for round 2
    const totalGifts = this.questions.length;
    // Distribute along the track starting at t=0.045
    const step = 0.90 / totalGifts;

    for (let i = 0; i < totalGifts; i++) {
      const trackT = 0.045 + i * step;
      const pt = this.trackCurve.getPointAt(trackT);
      const tangent = this.trackCurve.getTangentAt(trackT).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      // First gift is dead center, subsequent gifts alternate lanes
      const laneOffset = i === 0 ? 0 : ((i % 3) - 1) * 2.8;
      const giftPos = new THREE.Vector3().copy(pt).addScaledVector(right, laneOffset);
      giftPos.y = 1.5;

      const giftGroup = new THREE.Group();
      giftGroup.position.copy(giftPos);

      // Mystery Box Body (Golden Cube with bevel)
      const boxGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
      const boxMat = new THREE.MeshStandardMaterial({
        color: this.round === 1 ? 0xf59e0b : 0xa855f7,
        metalness: 0.85,
        roughness: 0.18,
        emissive: this.round === 1 ? 0xd97706 : 0x7e22ce,
        emissiveIntensity: 0.5,
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.castShadow = !this.isSoftwareGl;

      // Decorative Ribbon
      const ribbonMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.3,
        roughness: 0.2,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
      });
      const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.65, 0.35), ribbonMat);
      const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.65, 1.65), ribbonMat);
      boxMesh.add(ribbon1, ribbon2);

      // Question Mark or Glowing Star on Box Sides
      const starGeo = new THREE.OctahedronGeometry(0.35);
      const starMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
      const starMesh = new THREE.Mesh(starGeo, starMat);
      starMesh.position.y = 1.25;
      boxMesh.add(starMesh);

      // Rotating Aura Ring around Gift Box
      const ringGeo = new THREE.TorusGeometry(1.4, 0.06, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.round === 1 ? 0xfef08a : 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;

      giftGroup.add(boxMesh, ringMesh);
      this.scene.add(giftGroup);

      this.giftBoxes.push({
        group: giftGroup,
        boxMesh,
        ringMesh,
        collected: false,
        trackT,
        question: this.questions[i],
        giftIndex: i,
      });
    }
  }

  private spawnCar() {
    this.carInstance = createRaceCar(this.currentCarConfig);
    this.scene.add(this.carInstance.group);
    this.updateCarTransform(0);
  }

  private spawnRivals() {
    // Clear any existing rivals
    this.rivals.forEach((r) => {
      this.scene.remove(r.instance.group);
      r.instance.dispose();
    });
    this.rivals = [];

    // Filter rival configs (all CAR_MODELS except current player car)
    const rivalConfigs = CAR_MODELS.filter((c) => c.id !== this.currentCarConfig.id);

    // Initial offsets along track and lanes
    const startingOffsets = [
      { tOffset: 0.02, lane: 3.2, speed: 70 },
      { tOffset: 0.045, lane: -3.2, speed: 76 },
      { tOffset: -0.018, lane: 1.8, speed: 80 },
    ];

    rivalConfigs.forEach((cfg, idx) => {
      const offset = startingOffsets[idx % startingOffsets.length];
      const instance = createRaceCar(cfg);
      this.scene.add(instance.group);

      const rivalT = (this.carT + offset.tOffset) % 1;
      const rival: RivalRacer = {
        instance,
        config: cfg,
        t: rivalT,
        lateral: offset.lane,
        targetLateral: offset.lane,
        speed: offset.speed,
        baseSpeed: offset.speed,
        steer: 0,
        laneTimer: Math.random() * 3 + 2,
        name: cfg.name,
      };

      this.rivals.push(rival);
      this.updateRivalTransform(rival, 0);
    });
  }

  private updateRivalTransform(rival: RivalRacer, delta: number) {
    const clampedT = (rival.t % 1 + 1) % 1;
    const pt = this.trackCurve.getPointAt(clampedT);
    const tangent = this.trackCurve.getTangentAt(clampedT).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const finalPos = new THREE.Vector3().copy(pt).addScaledVector(right, rival.lateral);
    finalPos.y = 0.05;

    rival.instance.group.position.copy(finalPos);

    const baseAngle = Math.atan2(tangent.x, tangent.z);
    rival.instance.group.rotation.y = baseAngle + rival.steer * 0.18;
    rival.instance.group.rotation.z = -rival.steer * 0.06;

    rival.instance.update(rival.speed, rival.steer);
  }

  public setCarConfig(newConfig: CarConfig) {
    if (this.carInstance) {
      this.scene.remove(this.carInstance.group);
      this.carInstance.dispose();
    }
    this.currentCarConfig = newConfig;
    this.spawnCar();
    this.spawnRivals();
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  public getLapTimeMs(): number {
    return Math.floor(this.activeLapTime * 1000);
  }

  public resetLapTime(): void {
    this.activeLapTime = 0;
  }

  public triggerGiftCollected(index: number) {
    if (this.giftBoxes[index]) {
      this.giftBoxes[index].collected = true;
      this.createCollectParticles(this.giftBoxes[index].group.position);
      this.scene.remove(this.giftBoxes[index].group);
    }
  }

  private createCollectParticles(position: THREE.Vector3) {
    const pGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const pColors = [0xf59e0b, 0xfef08a, 0x38bdf8, 0xec4899, 0xffffff];

    for (let i = 0; i < 20; i++) {
      const color = pColors[Math.floor(Math.random() * pColors.length)];
      const pMat = new THREE.MeshBasicMaterial({ color });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        Math.random() * 14 + 4,
        (Math.random() - 0.5) * 16
      );

      this.particlesGroup.add(pMesh);
      this.burstParticles.push({
        mesh: pMesh,
        velocity: vel,
        life: 1.0,
      });
    }
  }

  private updateCarTransform(delta: number) {
    if (!this.carInstance) return;

    // Track position based on carT
    const clampedT = (this.carT % 1 + 1) % 1;
    const pt = this.trackCurve.getPointAt(clampedT);
    const tangent = this.trackCurve.getTangentAt(clampedT).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Position = track point + lateral offset
    const finalPos = new THREE.Vector3()
      .copy(pt)
      .addScaledVector(right, this.carLateral);
    finalPos.y = 0.05;

    this.carInstance.group.position.copy(finalPos);

    // Compute heading rotation
    const baseAngle = Math.atan2(tangent.x, tangent.z);
    // Add steering yaw tilt
    this.carInstance.group.rotation.y = baseAngle + this.carSteer * 0.18;
    this.carInstance.group.rotation.z = -this.carSteer * 0.08; // subtle roll banking

    this.carInstance.update(this.carSpeed, this.carSteer);

    // Chase Camera update
    const camOffset = new THREE.Vector3(0, 4.8, -9.2);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), baseAngle);

    const targetCamPos = new THREE.Vector3().copy(finalPos).add(camOffset);
    // Smooth camera damping
    this.camera.position.lerp(targetCamPos, Math.min(1, delta * 8));

    const lookTarget = new THREE.Vector3()
      .copy(finalPos)
      .add(new THREE.Vector3(0, 1.4, 0))
      .addScaledVector(tangent, 12);
    this.camera.lookAt(lookTarget);
  }

  private checkGiftCollisions() {
    if (!this.carInstance || this.isPaused) return;
    const carPos = this.carInstance.group.position;

    for (let i = 0; i < this.giftBoxes.length; i++) {
      const gift = this.giftBoxes[i];
      if (gift.collected) continue;

      const dist = carPos.distanceTo(gift.group.position);
      // Forgiving collision radius threshold
      if (dist < 4.8) {
        // Collect!
        this.triggerGiftCollected(i);
        this.isPaused = true;
        this.callbacks.onGiftHit(gift.question, gift.giftIndex);
        break;
      }
    }
  }

  private tick = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const delta = Math.min(rawDelta, 0.05);
    this.elapsedTime += delta;

    if (!this.isPaused) {
      // 1. Process Key Inputs & Accelerate/Brake
      const maxSpeed = this.currentCarConfig.topSpeed;
      const accel = this.currentCarConfig.acceleration * 1.8;
      const friction = 22.0;

      if (this.keys.forward) {
        this.carSpeed = Math.min(maxSpeed, this.carSpeed + accel * delta);
      } else if (this.keys.backward) {
        this.carSpeed = Math.max(-25, this.carSpeed - accel * 1.5 * delta);
      } else {
        // Coasting friction
        if (this.carSpeed > 0) {
          this.carSpeed = Math.max(0, this.carSpeed - friction * delta);
        } else if (this.carSpeed < 0) {
          this.carSpeed = Math.min(0, this.carSpeed + friction * delta);
        }
      }

      // 2. Steering input
      const steerSpeed = 3.8;
      if (this.keys.left) {
        this.carSteer = Math.max(-0.6, this.carSteer - steerSpeed * delta);
        this.carLateral = Math.max(-7.8, this.carLateral - (18.0 + this.carSpeed * 0.08) * delta);
      } else if (this.keys.right) {
        this.carSteer = Math.min(0.6, this.carSteer + steerSpeed * delta);
        this.carLateral = Math.min(7.8, this.carLateral + (18.0 + this.carSpeed * 0.08) * delta);
      } else {
        // Return steering to center smoothly
        this.carSteer *= Math.max(0, 1 - delta * 9);
      }

      // Advance car along track
      const trackLengthApprox = 2400;
      const speedDistance = this.carSpeed * delta * 4.5;
      this.carT += speedDistance / trackLengthApprox;

      // Update Car and Camera in 3D
      this.updateCarTransform(delta);

      // Advance and update Rival AI Racers
      for (let i = 0; i < this.rivals.length; i++) {
        const rival = this.rivals[i];
        const rDist = rival.speed * delta * 4.0;
        rival.t = (rival.t + rDist / trackLengthApprox) % 1;

        // Dynamic lane changing & speed modulation
        rival.laneTimer -= delta;
        if (rival.laneTimer <= 0) {
          rival.laneTimer = 3.0 + Math.random() * 4.0;
          rival.targetLateral = (Math.random() - 0.5) * 10.0;
          rival.speed = rival.baseSpeed + (Math.random() - 0.5) * 16.0;
        }

        const latDiff = rival.targetLateral - rival.lateral;
        const steerDir = Math.sign(latDiff);
        rival.lateral += THREE.MathUtils.clamp(latDiff, -7.5 * delta, 7.5 * delta);
        rival.steer = THREE.MathUtils.lerp(rival.steer, steerDir * 0.35, Math.min(1, delta * 6));

        this.updateRivalTransform(rival, delta);

        // Check gentle bump collision between Player and Rival
        if (this.carInstance) {
          const pPos = this.carInstance.group.position;
          const rPos = rival.instance.group.position;
          const distToRival = pPos.distanceTo(rPos);

          if (distToRival < 2.8) {
            soundManager.playBumpSound();
            const midPoint = new THREE.Vector3().addVectors(pPos, rPos).multiplyScalar(0.5);
            midPoint.y = 0.5;
            this.createCollectParticles(midPoint);

            // Subtle lateral bounce
            const bounce = this.carLateral < rival.lateral ? -1.5 : 1.5;
            this.carLateral = THREE.MathUtils.clamp(this.carLateral + bounce, -7.8, 7.8);
            rival.lateral = THREE.MathUtils.clamp(rival.lateral - bounce, -7.8, 7.8);
          }
        }
      }

      // Check Gift Collisions
      this.checkGiftCollisions();

      // Accumulate Active Track Racing Lap Time (only while not paused/answering)
      this.activeLapTime += delta;

      // Notify HUD
      this.callbacks.onSpeedUpdate(Math.round(Math.abs(this.carSpeed)));
      this.callbacks.onLapProgress(this.carT % 1);
      this.callbacks.onLapTimeUpdate?.(Math.floor(this.activeLapTime * 1000));
    }

    // Animate active gift boxes (bobbing and rotating)
    const elapsed = this.elapsedTime;
    for (let i = 0; i < this.giftBoxes.length; i++) {
      const g = this.giftBoxes[i];
      if (!g.collected) {
        g.boxMesh.rotation.y = elapsed * 1.6 + i;
        g.ringMesh.rotation.z = -elapsed * 2.2;
        g.group.position.y = 1.4 + Math.sin(elapsed * 3.5 + i) * 0.35;
      }
    }

    // Update burst particles
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.life -= delta * 1.8;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 25 * delta; // Gravity
      if (p.life <= 0) {
        this.particlesGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.burstParticles.splice(i, 1);
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    this.frameId = requestAnimationFrame(this.tick);
  };

  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onWindowResize);
    cancelAnimationFrame(this.frameId);

    if (this.carInstance) {
      this.carInstance.dispose();
    }
    this.rivals.forEach((r) => {
      this.scene.remove(r.instance.group);
      r.instance.dispose();
    });
    this.rivals = [];
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
