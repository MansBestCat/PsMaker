import { AmbientLight, BoxGeometry, Color, DirectionalLight, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { CameraManMain } from "../Camera/CameraManMain";
import { Data } from "../Data";
import { TwinkleStars } from "../ParticleSystems/TwinkleStars";
import { Utility } from "../Utilitites/Utility";

export class TwinkleStarsScene {
    SVGNS = "http://www.w3.org/2000/svg";

    particleSystem!: TwinkleStars;

    timeLast = Date.now();


    go(data: Data, cameraManMain: CameraManMain) {

        if (!data.camera) {
            throw new Error(`${Utility.timestamp()} Expected camera`);
        }

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
        data.scene.add(light);

        const ambientlight = new AmbientLight(0x101010);
        data.scene.add(ambientlight);

        // camera
        data.camera.position.set(0, 7, -12);
        data.camera?.lookAt(0, 2, 0);

        // Ground
        const ground = new Mesh(new BoxGeometry(10, 0, 10), new MeshBasicMaterial({ color: new Color(0xff0000) }));
        data.scene.add(ground);

        this.particleSystem = new TwinkleStars({
            maxEmitterLife: undefined,
            frequency: 128 // every 8th tick
        }, data);
        this.particleSystem.init();

        this.particleSystem.particles.forEach(p => {
            p.position.random();
        })
        data.scene.add(this.particleSystem.points);

        const orbitControls = cameraManMain.makeCameraOrbital(new Vector3(0, 0, 0));
        orbitControls.addEventListener('change', () => {
            this.particleSystem.points.lookAt(data.camera!.position);
            this.particleSystem.points.rotateX(-Math.PI / 2);
        });

        this.animate();
    }

    animate() {
        requestAnimationFrame((t) => {
            this.animate()
        });

        const timeNow = Date.now();
        this.particleSystem.tick(timeNow - this.timeLast);
        this.timeLast = timeNow;

    }
}