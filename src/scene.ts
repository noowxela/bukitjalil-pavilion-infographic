// Three.js stage of the infographic: renderer, camera, flights, the 00 turntable and the theme bridge (CSS variables ->
// palette). The model itself (massing, ground layers, rail and trains, footways, routes, shade) is MapModel from map-assets.
// Planned towers (map-assets facts.json "planned", cited storeys) are drawn here as translucent ghost massing instead.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MapModel, clipPlanes, type Area, type Building, type ModePatch, type Palette, type SceneMode } from '@map-assets';

export { DEFAULT_MODE, type RailState, type SceneMode } from '@map-assets';
export interface View { target: [number, number, number]; azimuth: number; polar: number; distance: number }

const DESK_W = 1920, DESK_H = 1080; // desktop stage; mobile uses the real viewport size (setStageSize)
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const cssColor = (name: string) => new THREE.Color(cssVar(name) || '#ff00ff');
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The model palette from the current theme's CSS variables (styles.css). */
function paletteFromCss(zones: string[]): Palette {
  const dark = document.documentElement.dataset.theme === 'dark';
  return {
    ground: cssVar('--scene-ground'), road: cssVar('--scene-road'), roadMajor: cssVar('--scene-road-major'),
    water: cssVar('--c-water'), waterMuted: cssVar('--scene-water-muted'), green: cssVar('--c-green'),
    building: cssVar('--scene-building'), buildingContext: cssVar('--scene-building-context'),
    edge: cssVar('--scene-edge'),
    edgeOpacity: parseFloat(cssVar('--scene-edge-opacity')) || 0.5,
    edgeContextOpacity: parseFloat(cssVar('--scene-edge-context-opacity')) || 0.2,
    heightSource: { osm: cssVar('--src-osm'), levels: cssVar('--src-levels'), estimate: cssVar('--src-estimate'), cited: cssVar('--src-cited') },
    zone: Object.fromEntries(zones.map((z) => [z, cssVar(`--z-${z}`)])),
    // the area's 'lrt' line here is the Sri Petaling Line (map-assets rules.railLines): drawn in its Line 4 colour
    rail: { lrt: cssVar('--c-lrt'), ktm1: cssVar('--c-grey'), ktm2: cssVar('--c-grey'), erl: cssVar('--c-erl'), kliaTransit: cssVar('--c-erl'), skypark: cssVar('--c-erl'), py: cssVar('--c-erl'), mr: cssVar('--c-erl') },
    footway: cssVar('--grey-2'), footbridge: cssVar('--ink'),
    route: cssVar('--c-route'), covered: cssVar('--c-covered'), open: cssVar('--c-open'),
    sunlit: cssVar('--c-amber'), shaded: cssVar('--c-shade'),
    landmark: cssVar('--landmark'), podium: cssVar('--podium'),
    train: { body: cssVar('--train-body'), window: cssVar('--train-window'), accent: cssVar('--train-accent') },
    light: dark ? { hemi: 1.6, hemiGround: '#202020', sun: 1.1 } : { hemi: 2.4, hemiGround: '#bdbdb8', sun: 1.5 },
    underground: cssVar('--grey-2'),
    facility: { hotel: cssVar('--c-amber'), parking: cssVar('--grey-2'), bus: cssVar('--c-bus'), entrance: cssVar('--c-lrt') },
  };
}

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  readonly model: MapModel;
  readonly area: Area;
  /** planned towers (cited, under construction), drawn as ghost massing */
  readonly planned: Building[];
  private ghostGroup = new THREE.Group();
  private ghostMat = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.22, depthWrite: false });
  private ghostEdge = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.85 });
  private H: number;
  private parkMesh: THREE.Mesh | null = null;
  /** Outline strength from map-assets (screen density). Kept for anything that read it off the stage. */
  get outlineFade() { return this.model.outlineFade; }
  private orbitMax = 6000;
  private parkMat = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.9 });
  // event-day crowd (chapter 06, illustrative): dots streaming along a walking route
  private crowd: { mesh: THREE.InstancedMesh; pts: THREE.Vector3[]; cum: number[]; len: number; off: Float32Array; side: Float32Array } | null = null;
  private crowdMat = new THREE.MeshBasicMaterial();
  private crowdT = 0;
  onFrame: (() => void)[] = [];
  onUserInteract: (() => void) | null = null;
  keyNames = new Set<string>();

  /** Horizontal shift (stage px) of the projection centre, so the model sits in the area left free by the panels. */
  private viewShift = 104; private viewShiftTarget = 104;
  private viewShiftY = 0; private viewShiftYTarget = 0;
  private stageW = DESK_W; private stageH = DESK_H; private distScale = 1;
  private tween: { from: View; to: View; t0: number; dur: number } | null = null;
  private lastFrame = 0;
  // turntable (00 Overview): slow continuous orbit about the target at the preset pitch / distance. Paused while the
  // user drags / zooms (resumes TURN_RESUME_MS after they stop), during flights, while the tab is hidden, and never
  // runs under prefers-reduced-motion.
  static readonly TURN_PERIOD_S = 75; static readonly TURN_RESUME_MS = 1500;
  /** Seconds for one full turn. The dev camera GUI writes this. */
  turnPeriodS = World.TURN_PERIOD_S;
  /** +1 orbits the camera clockwise from above; -1 is anti-clockwise (chapter 00 default). */
  turnSign: 1 | -1 = -1;
  private turnOn = false; private turnHeld = false; private turnResumeAt = 0;

  constructor(container: HTMLElement, area: Area) {
    this.area = area; this.H = area.meta.halfSizeM;
    const plannedNames = new Set(((area.facts.planned as unknown as { osmName: string }[] | undefined) ?? []).map((p) => p.osmName));
    // Logarithmic depth keeps the ground layers from z-fighting out to tens of kilometres. The renderer owns this
    // flag (map-assets does not create it). clipPlanes() grows `far` with the study area.
    const clip = clipPlanes(this.H);
    this.orbitMax = Math.max(6000, this.H * 4);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true });
    this.renderer.setSize(this.stageW, this.stageH, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // The shadow map is not redrawn every frame. An orbit does not move the fitted shadow box (fitShadows), so the
    // 00 turntable stays at one shadow draw; panning, zooming or moving the sun asks for a redraw.
    this.renderer.shadowMap.autoUpdate = false; this.renderer.shadowMap.needsUpdate = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.localClippingEnabled = true; // trains are clipped at the study-area frame
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(28, this.stageW / this.stageH, clip.near, clip.far);
    this.applyViewOffset();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, minPolarAngle: 0.12, maxPolarAngle: 1.3, minDistance: 220, maxDistance: this.orbitMax, screenSpacePanning: false, panSpeed: 0.6, rotateSpeed: 0.6, zoomSpeed: 0.8 });
    this.controls.addEventListener('start', () => { this.tween = null; this.turnHeld = true; this.onUserInteract?.(); });
    this.controls.addEventListener('end', () => { this.turnHeld = false; this.turnResumeAt = performance.now() + World.TURN_RESUME_MS; });
    this.controls.addEventListener('change', () => {
      const H = this.H; const t = this.controls.target; t.x = THREE.MathUtils.clamp(t.x, -H - 50, H + 50); t.z = THREE.MathUtils.clamp(t.z, -H - 50, H + 50); t.y = THREE.MathUtils.clamp(t.y, 0, 160);
    });

    this.planned = area.buildings.filter((b) => b.name && plannedNames.has(b.name));
    // the model draws everything except the planned towers, which get ghost massing below
    this.model = new MapModel({ ...area, buildings: area.buildings.filter((b) => !b.name || !plannedNames.has(b.name)) }, { palette: paletteFromCss(area.zones) });
    this.scene.add(this.model.group);
    for (const b of this.planned) {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(b.ring.map(([x, n]) => new THREE.Vector2(x, n))), { depth: Math.max(1, b.height - b.minHeight), bevelEnabled: false });
      g.rotateX(-Math.PI / 2); g.translate(0, b.minHeight, 0);
      const m = new THREE.Mesh(g, this.ghostMat); m.renderOrder = 2;
      this.ghostGroup.add(m, new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), this.ghostEdge));
    }
    this.scene.add(this.ghostGroup);
    // the Recreational Park (4th overview zone): the OSM park polygon, tinted
    const park = area.areas.green.find((g) => g.name === 'Taman Rekreasi Bukit Jalil');
    if (park) {
      const g = new THREE.ShapeGeometry(new THREE.Shape(park.ring.map(([x, n]) => new THREE.Vector2(x, n))));
      g.rotateX(-Math.PI / 2); g.translate(0, 0.14, 0);
      this.parkMesh = new THREE.Mesh(g, this.parkMat); this.parkMesh.receiveShadow = true; this.parkMesh.visible = false; this.scene.add(this.parkMesh);
    }
    this.applyTheme();
    this.setMode({});
    this.renderer.setAnimationLoop((t) => this.frame(t));
  }

  // ---------- model (map-assets) ----------
  get mode(): SceneMode { return this.model.mode; }
  setMode(patch: ModePatch) { this.model.setMode(patch); this.renderer.shadowMap.needsUpdate = true; }
  /** Show / hide the planned-tower ghost massing. */
  setGhosts(on: boolean) { this.ghostGroup.visible = on; }
  get ghostsVisible() { return this.ghostGroup.visible; }
  /** Tint the Recreational Park polygon (overview zone colour). */
  setPark(on: boolean) { if (this.parkMesh) this.parkMesh.visible = on; }
  /** Event-day crowd along a route polyline (x, north) with `count` dots; null removes it. Illustrative only. */
  setCrowd(route: [number, number][] | null, count = 600) {
    if (this.crowd) { this.scene.remove(this.crowd.mesh); this.crowd.mesh.geometry.dispose(); this.crowd = null; }
    if (!route || route.length < 2) return;
    const pts = route.map(([x, n]) => new THREE.Vector3(x, 1.2, -n)); const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1.6, 6, 4), this.crowdMat, count);
    const off = new Float32Array(count), side = new Float32Array(count);
    for (let i = 0; i < count; i++) { off[i] = Math.random(); side[i] = (Math.random() - 0.5) * 7; }
    this.crowd = { mesh, pts, cum, len: cum[cum.length - 1], off, side }; this.scene.add(mesh); this.stepCrowd(0);
  }
  get crowdCount() { return this.crowd?.mesh.count ?? 0; }
  private stepCrowd(dt: number) {
    const c = this.crowd; if (!c) return;
    if (!prefersReducedMotion() && !document.hidden) this.crowdT += dt * 1.3; // m/s walking pace (schematic), seen from far
    const m = new THREE.Matrix4(); const p = new THREE.Vector3(); const dir = new THREE.Vector3();
    for (let i = 0; i < c.mesh.count; i++) {
      const d = ((c.off[i] * c.len + this.crowdT) % c.len); let k = 1; while (k < c.cum.length - 1 && c.cum[k] < d) k++;
      const a = c.pts[k - 1], b = c.pts[k]; const f = (d - c.cum[k - 1]) / Math.max(1e-6, c.cum[k] - c.cum[k - 1]);
      p.lerpVectors(a, b, f); dir.subVectors(b, a).normalize(); p.x += -dir.z * c.side[i]; p.z += dir.x * c.side[i];
      m.makeTranslation(p.x, p.y, p.z); c.mesh.setMatrixAt(i, m);
    }
    c.mesh.instanceMatrix.needsUpdate = true;
  }
  /** Show or hide the animated LRT and KTM trainsets (scene life; user toggle). */
  setTrains(on: boolean) { this.model.setTrains(on); }
  get trainsVisible() { return this.model.trainsVisible; }
  get trains() { return this.model.trains; }
  get lrtTracks() { return this.model.lrtTracks; }
  // shade sampling (chapter 07)
  setShadeSamples(pts: THREE.Vector3[]) { this.model.setShadeSamples(pts); }
  shadeTest(pts: THREE.Vector3[], altitude: number, azimuth: number) { return this.model.shadeTest(pts, altitude, azimuth); }
  setShadeResult(shaded: boolean[]) { this.model.setShadeResult(shaded); }
  /** Restart the draw-on animation of the visible walking route. */
  replayWalk() { this.model.replayWalk(); }

  /** Centre the projection on the free area between visible panels (stage px, + = right). */
  setViewShift(px: number, instant = prefersReducedMotion(), py = 0) {
    this.viewShiftTarget = px; this.viewShiftYTarget = py;
    if (instant) { this.viewShift = px; this.viewShiftY = py; this.applyViewOffset(); }
  }
  private applyViewOffset() { this.camera.setViewOffset(this.stageW, this.stageH, -this.viewShift, -this.viewShiftY, this.stageW, this.stageH); }
  /** Stage size in CSS px: 1920x1080 on desktop (the stage is scaled to fit), the real viewport on mobile. */
  setStageSize(w: number, h: number) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (w === this.stageW && h === this.stageH) return;
    this.stageW = w; this.stageH = h; this.camera.aspect = w / h; this.renderer.setSize(w, h, false); this.applyViewOffset();
  }
  get stageSize() { return { w: this.stageW, h: this.stageH }; }
  /** Mobile framing: every chapter preset (and any flyTo view) is pulled back by this factor so its subject fits a
   *  narrow / portrait screen. 1 on desktop. */
  setDistanceScale(k: number) {
    if (Math.abs(k - this.distScale) < 1e-3) return;
    const prev = this.distScale; this.distScale = k; this.controls.maxDistance = this.orbitMax * Math.max(1, k);
    if (!this.tween) { const v = this.currentView(); this.applyView({ ...v, distance: (v.distance * k) / prev }); }
    else this.tween.to = { ...this.tween.to, distance: (this.tween.to.distance * k) / prev };
  }
  private scaled(v: View): View { return this.distScale === 1 ? v : { ...v, distance: v.distance * this.distScale }; }

  // ---------- theme ----------
  applyTheme() {
    const bg = cssColor('--scene-bg');
    this.scene.background = bg;
    this.scene.fog = new THREE.Fog(bg, 3600, Math.max(8200, this.camera.far * 0.55));
    this.model.setPalette(paletteFromCss(this.area.zones));
    this.renderer.shadowMap.needsUpdate = true;
    this.ghostMat.color = cssColor('--ghost'); this.ghostEdge.color = cssColor('--ghost-edge');
    this.parkMat.color = cssColor('--z-park'); this.crowdMat.color = cssColor('--c-route');
  }

  // ---------- camera ----------
  currentView(): View {
    const off = this.camera.position.clone().sub(this.controls.target); const s = new THREE.Spherical().setFromVector3(off);
    const t = this.controls.target; return { target: [t.x, t.y, t.z], azimuth: s.theta, polar: s.phi, distance: s.radius };
  }
  /** Start / stop the 00 turntable orbit (it starts from wherever the camera is once any flight has landed). */
  setTurntable(on: boolean) { this.turnOn = on; this.turnHeld = false; this.turnResumeAt = 0; }
  get turntableOn() { return this.turnOn; }
  /** True while the turntable is actually advancing the bearing this frame. */
  turntableActive(now = performance.now()) { return this.turnOn && !this.tween && !this.turnHeld && now >= this.turnResumeAt && !document.hidden && !prefersReducedMotion(); }
  private stepTurntable(now: number, dt: number) {
    if (!this.turntableActive(now)) return;
    const off = this.camera.position.clone().sub(this.controls.target); const s = new THREE.Spherical().setFromVector3(off);
    s.theta += this.turnSign * (Math.PI * 2 / this.turnPeriodS) * Math.min(dt, 0.1); // clamped: no jump after a stall / hidden tab
    this.camera.position.copy(this.controls.target).add(off.setFromSpherical(s)); this.camera.lookAt(this.controls.target);
  }
  /** True while a camera flight (chapter preset / reset) is animating. */
  isFlying() { return this.tween != null; }
  /** Whether the camera is near a view: target within 8 m, bearing / tilt within ~2°, distance within 4 %. */
  isNear(v: View, ignoreBearing = false) {
    v = this.scaled(v); const c = this.currentView();
    const dAz = ignoreBearing ? 0 : Math.abs(Math.atan2(Math.sin(c.azimuth - v.azimuth), Math.cos(c.azimuth - v.azimuth)));
    return Math.hypot(c.target[0] - v.target[0], c.target[1] - v.target[1], c.target[2] - v.target[2]) < 8 && dAz < 0.035 && Math.abs(c.polar - v.polar) < 0.035 && Math.abs(Math.log(c.distance / v.distance)) < 0.04;
  }
  flyTo(view: View, instant = prefersReducedMotion()) {
    view = this.scaled(view);
    if (instant) { this.tween = null; this.applyView(view); return; }
    this.tween = { from: this.currentView(), to: view, t0: performance.now(), dur: 1900 };
  }
  private applyView(v: View) {
    const target = new THREE.Vector3(...v.target);
    const off = new THREE.Vector3().setFromSpherical(new THREE.Spherical(v.distance, v.polar, v.azimuth));
    this.controls.target.copy(target); this.camera.position.copy(target).add(off); this.camera.lookAt(target);
  }
  private stepTween(now: number) {
    if (!this.tween) return;
    const { from, to, t0, dur } = this.tween; const k = Math.min(1, (now - t0) / dur); const e = ease(k);
    let dAz = to.azimuth - from.azimuth; dAz = Math.atan2(Math.sin(dAz), Math.cos(dAz));
    // slight lift mid-flight reads as a deliberate camera move
    const lift = Math.sin(Math.PI * e) * 0.12;
    this.applyView({
      target: [0, 1, 2].map((i) => from.target[i] + (to.target[i] - from.target[i]) * e) as [number, number, number],
      azimuth: from.azimuth + dAz * e,
      polar: Math.max(0.12, from.polar + (to.polar - from.polar) * e - lift),
      distance: Math.exp(Math.log(from.distance) + (Math.log(to.distance) - Math.log(from.distance)) * e) * (1 + lift * 0.6),
    });
    if (k >= 1) this.tween = null;
  }

  // ---------- helpers for overlays ----------
  /** Project a world point to stage pixel coordinates. */
  project(p: THREE.Vector3) {
    const v = p.clone().project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.stageW, y: (-v.y * 0.5 + 0.5) * this.stageH, visible: v.z < 1 && v.z > -1 };
  }
  /** Stage pixels per metre at the orbit target, measured across the screen. */
  pxPerMetre() {
    const t = this.controls.target.clone(); const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0).setY(0).normalize();
    const a = this.project(t), b = this.project(t.clone().addScaledVector(right, 100));
    return Math.hypot(b.x - a.x, b.y - a.y) / 100;
  }
  /** Screen angle (radians, clockwise from up) of geographic north at the target. */
  northAngle() {
    const t = this.controls.target.clone(); const a = this.project(t), b = this.project(t.clone().add(new THREE.Vector3(0, 0, -100)));
    return Math.atan2(b.x - a.x, -(b.y - a.y));
  }
  setPixelRatio(stageScale: number) { this.renderer.setPixelRatio(Math.min(2, Math.max(1, window.devicePixelRatio * stageScale))); this.renderer.setSize(this.stageW, this.stageH, false); }

  private frame(now: number) {
    // trains and route draw-on (map-assets); the train clock only advances while the page is visible
    const dt = this.lastFrame ? (now - this.lastFrame) / 1000 : 0; this.lastFrame = now;
    this.model.update(now, dt, { reducedMotion: prefersReducedMotion(), paused: document.hidden });
    this.stepCrowd(Math.min(dt, 0.1));
    if (this.viewShift !== this.viewShiftTarget || this.viewShiftY !== this.viewShiftYTarget) {
      const near = Math.abs(this.viewShift - this.viewShiftTarget) <= 0.3 && Math.abs(this.viewShiftY - this.viewShiftYTarget) <= 0.3;
      if (near) { this.viewShift = this.viewShiftTarget; this.viewShiftY = this.viewShiftYTarget; }
      else { this.viewShift += (this.viewShiftTarget - this.viewShift) * 0.12; this.viewShiftY += (this.viewShiftYTarget - this.viewShiftY) * 0.12; }
      this.applyViewOffset();
    }
    this.stepTween(now);
    this.stepTurntable(now, dt);
    if (!this.tween) this.controls.update();
    // Outlines and the shadow box live in map-assets. Logarithmic depth (set on the renderer) replaces the old
    // near-plane nudge: the ground layers no longer need a closer near plane to stay apart.
    this.model.setScreenDensity(this.pxPerMetre());
    if (this.model.fitShadows(this.camera, this.controls.target)) this.renderer.shadowMap.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    for (const f of this.onFrame) f();
  }
}
