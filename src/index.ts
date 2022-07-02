
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


import { AmbientLight, Camera, CubeTextureLoader, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { PCFSoftShadowMap } from 'three';
import { ParticleSystemBase } from './ParticleSystemBase';
import { RocketExhaustParticleSystem } from './ParticleSystems/RocketExhaustParticleSystem';
import { SparksParticleSystem } from './ParticleSystems/SparksParticleSystem';

class ParticleSystemDemo {

  _threejs!: WebGLRenderer;
  _camera!: PerspectiveCamera;
  _scene: any;
  _particles!: ParticleSystemBase;
  _previousRAF!: number | null;

  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 0);

    this._scene = new Scene();

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
    this._scene.add(light);

    const ambientlight = new AmbientLight(0x101010);
    this._scene.add(ambientlight);

    const controls = new OrbitControls(
      this._camera, this._threejs.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // const loader = new CubeTextureLoader();
    // const texture = loader.load([
    //   './resources/posx.jpg',
    //   './resources/negx.jpg',
    //   './resources/posy.jpg',
    //   './resources/negy.jpg',
    //   './resources/posz.jpg',
    //   './resources/negz.jpg',
    // ]);
    // this._scene.background = texture;

    this._particles = new SparksParticleSystem({
      parent: this._scene,
      camera: this._camera,
    });

    this._LoadModel();

    this._previousRAF = null;
    this._RAF();
  }

  _LoadModel() {
    const loader = new GLTFLoader();
    loader.load('./resources/rocket/Rocket_Ship_01.gltf', (gltf) => {
      gltf.scene.traverse(c => {
        c.castShadow = true;
      });
      this._scene.add(gltf.scene);
    });
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed: number) {
    const timeElapsedS = timeElapsed * 0.001;

    this._particles.Step(timeElapsedS);
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new ParticleSystemDemo();
});
