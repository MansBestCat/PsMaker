import { AmbientLight, BoxGeometry, Color, DirectionalLight, Mesh, MeshBasicMaterial, Vector2, Vector3 } from "three";
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
        data.camera.position.set(0, 1.5, -3);
        data.camera?.lookAt(0, 0.5, 0);

        // Ground
        const ground = new Mesh(new BoxGeometry(10, 0, 10), new MeshBasicMaterial({ color: new Color(0xff0000) }));
        data.scene.add(ground);

        // The particle system
        this.particleSystem = new TwinkleStars({
            maxEmitterLife: undefined,
            frequency: 128 // every 8th tick
        }, data);
        this.particleSystem.init();

        const bounds = [new Vector2(-0.5, -0.5), new Vector2(0.0, 0.5), new Vector2(0.5, -0.5)];
        const test = new Vector2();
        let x: number, y: number;
        this.particleSystem.particles.forEach(p => {

            // Determine a point on the front face
            do {
                x = Math.random() - 0.5;
                y = Math.random() - 0.5;
                test.set(x, y);
            } while (!Utility.isPointInPolygon(test, bounds));

            // Rotate the point to lie on another face
            const point = new Vector3(x, y, -0.5);
            point
                .applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
                .applyAxisAngle(new Vector3(0, 0, 1), -Math.PI / 4);

            // Assign the position
            p.position.copy(point);
        });

        // mount the ps to a box
        const material = new MeshBasicMaterial({ name: "transparent", color: new Color(0x00ff00), transparent: true, opacity: 0.5 });
        const box = new Mesh(new BoxGeometry(1, 1, 1), material);
        box.position.set(0, 0.5, 0);
        box.add(this.particleSystem.points);
        data.scene.add(box);

        // attach orbit controls
        const orbitControls = cameraManMain.makeCameraOrbital(new Vector3(0, 0, 0));

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