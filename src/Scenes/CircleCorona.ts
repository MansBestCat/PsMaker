import { AmbientLight, BoxGeometry, DirectionalLight, Mesh, Vector3 } from "three";
import { CameraManMain } from "../Camera/CameraManMain";
import { Data } from "../Data";
import { ParticleSystemBase } from "../ParticleSystems/ParticleSystemBase";
import { SmokePuff } from "../ParticleSystems/SmokePuff";
import { Utility } from "../Utilitites/Utility";
import GUI from "lil-gui";

export class CircleCorona {

    particleSystem!: ParticleSystemBase;

    timeLast = Date.now();

    constructor(public data: Data) {
        this.init();
    }

    init() {

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
        this.data.scene.add(light);

        const ambientlight = new AmbientLight(0x101010);
        this.data.scene.add(ambientlight);

        document.addEventListener('mousemove', () => {
            this.particleSystem.addParticle()
        });

        this.particleSystem = new SmokePuff({
            parent: this.data.scene, maxEmitterLife: 300, frequency: this.data.tickSize
        }, this.data);
        (this.particleSystem as SmokePuff).init();

        this.animate();
    }

    go(data: Data, cameraManMain: CameraManMain) {

        if (!data.camera) {
            throw new Error(`${Utility.timestamp()} Expected camera`);
        }

        const gui = new GUI();

        // // cylinder outer
        // const height = 3.0;
        // const mesh = new Mesh(new CylinderGeometry(1, 1, height), undefined);
        // mesh.position.y = 3;
        // data.scene.add(mesh);

        // // small box inner
        // const mesh2 = new Mesh(new BoxGeometry(3, 1, 1), new MeshBasicMaterial({ color: new Color(0x00ff00) }));
        // mesh2.position.y = 3;
        // data.scene.add(mesh2);

        data.camera.position.set(0, 7, -12);
        data.camera?.lookAt(0, 2, 0);

        // const shaderMat = new CylinderRingsMaterial().clone();
        // gui.add(shaderMat.uniforms.uUvYOffset, "value", 0, 3, 0.1).name("uUvYOffset");
        // gui.add(shaderMat.uniforms.uXTFactor, "value", 0, 10, 0.1).name("uXTFactor");
        // gui.add(shaderMat.uniforms.uXTOffset, "value", 0, 10, 0.1).name("uXTOffset");

        // const plainMat = new MeshBasicMaterial({ color: new Color(0x0000ff) });
        // const mats = [shaderMat, plainMat, plainMat];
        // mesh.material = mats;

        //gui.add(shaderMat.clock, "start").name("reset clock");

        cameraManMain.makeCameraOrbital(new Vector3(0, 0, 0));
    }

    animate() {
        requestAnimationFrame((t) => {
            this.animate()
        });

        const timeElapsed = Date.now() - this.timeLast;
        this.particleSystem.tick(timeElapsed);
        this.timeLast = Date.now();

    }
}