
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { AmbientLight, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { PCFSoftShadowMap } from 'three';
import { ParticleSystemBase } from './ParticleSystems/ParticleSystemBase';
import { SmokePuff } from './ParticleSystems/SmokePuff';
import { Data } from './Data';

class ParticleSystemDemo {

  renderer!: WebGLRenderer;
  camera!: PerspectiveCamera;
  scene: any;
  particleSystem!: ParticleSystemBase;
  previousRAF!: number | null;
  timeLast = Date.now();

  constructor(public data: Data) {
    this.init();
  }

  init() {
    this.renderer = new WebGLRenderer({
      antialias: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.windowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera = new PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(25, 10, 0);

    this.scene = new Scene();

    let light = new DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this.scene.add(light);

    const ambientlight = new AmbientLight(0x101010);
    this.scene.add(ambientlight);

    const controls = new OrbitControls(
      this.camera, this.renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    document.addEventListener('mousemove', () => this.addParticles(), false);

    this.particleSystem = new SmokePuff({
      parent: this.scene, maxEmitterLife: 300, frequency: this.data.tickSize
    }, this.data);
    (this.particleSystem as SmokePuff).init();

    this.previousRAF = null;
    this.animate();
  }

  addParticles() {
    this.particleSystem.addParticle();
  }

  windowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame((t) => {
      if (this.previousRAF === null) {
        this.previousRAF = t;
      }

      this.animate();

      this.renderer.render(this.scene, this.camera);
      this.tick();
      this.previousRAF = t;
    });
  }

  tick() {
    const timeElapsed = Date.now() - this.timeLast;
    this.particleSystem.tick(timeElapsed);
    this.timeLast = Date.now();
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  const data = new Data()
  _APP = new ParticleSystemDemo(data);
});
