import GUI from "lil-gui";
import { AmbientLight, Color, DirectionalLight, Mesh, MeshPhongMaterial, SphereGeometry, Vector3 } from "three";
import { CameraManMain } from "../Camera/CameraManMain";
import { CurveEditor } from "../CurveEditor/CurveEditor";
import { Data } from "../Data";
import { Corona } from "../ParticleSystems/Corona";
import { ParticleSystemBase } from "../ParticleSystems/ParticleSystemBase";
import { Utility } from "../Utilitites/Utility";

export class CoronaScene {
    SVGNS = "http://www.w3.org/2000/svg";

    particleSystem!: ParticleSystemBase;

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

        // sphere
        const sphere = new Mesh(new SphereGeometry(2), new MeshPhongMaterial({ color: new Color(0x0000ff) }));
        data.scene.add(sphere);
        sphere.position.copy(data.camera.position.clone().multiplyScalar(0.33));

        // Ground
        // const ground = new Mesh(new BoxGeometry(10, 0, 10), new MeshPhongMaterial({ color: new Color(0xeeeeee) }));
        // data.scene.add(ground);

        this.particleSystem = new Corona({
            parent: data.scene, maxEmitterLife: undefined,
            frequency: 128 // every 8th tick
        }, data);
        (this.particleSystem as Corona).init();

        // Gui needs to be defined after the ps is instantiated
        // Because curve editors need to have access to the linear splines inside the ps object
        const gui = new GUI();
        gui.domElement.onpointermove = (event: PointerEvent) => {
            // Prevent pointer events on the gui from interfering with orbital camera
            event.stopPropagation();
        }
        const psCorona = this.particleSystem as Corona;
        const ceEmitRate = new CurveEditor(gui, psCorona.emitRateSpline!);
        ceEmitRate.makeCurveEditor("Emission rate");
        const ceAlpha = new CurveEditor(gui, psCorona.alphaSpline);
        ceAlpha.makeCurveEditor("Alpha");
        const ceSize = new CurveEditor(gui, psCorona.sizeSpline);
        ceSize.makeCurveEditor("Size");
        const ceVelocity = new CurveEditor(gui, psCorona.velocitySpline);
        ceVelocity.makeCurveEditor("Velocity");
        const ceColor = new CurveEditor(gui, psCorona.colorSpline);
        ceColor.makeCurveEditor("Color");
        gui.add(this.particleSystem, "maxParticleLife", 0, 2000);

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

        const timeElapsed = Date.now() - this.timeLast;
        this.particleSystem.tick(timeElapsed);
        this.timeLast = Date.now();

    }
}