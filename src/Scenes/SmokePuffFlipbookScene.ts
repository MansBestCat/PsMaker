import GUI from "lil-gui";
import { AmbientLight, BoxGeometry, Color, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { CameraManMain } from "../Camera/CameraManMain";
import { CurveEditor } from "../CurveEditor/CurveEditor";
import { Data } from "../Data";
import { ParticleSystemBase } from "../ParticleSystems/ParticleSystemBase";
import { SmokePuff } from "../ParticleSystems/SmokePuff";
import { SmokePuffFlipbook } from "../ParticleSystems/SmokePuffFlipbook";
import { Utility } from "../Utilitites/Utility";

export class SmokePuffFlipbookScene {
    SVGNS = "http://www.w3.org/2000/svg";

    particleSystem!: ParticleSystemBase;

    timeLast = Date.now();


    go(data: Data, cameraManMain: CameraManMain) {

        if (!data.camera) {
            throw new Error(`${Utility.timestamp()} Expected camera`);
        }

        const ambientlight = new AmbientLight(0xffffff);
        //ambientlight.intensity=2.0;
        data.scene.add(ambientlight);

        // camera
        data.camera.position.set(0, 7, -12);
        data.camera?.lookAt(0, 2, 0);

        // Ground
        const ground = new Mesh(new BoxGeometry(10, 0, 10), new MeshPhongMaterial({ color: new Color(0xfffffff) }));
        data.scene.add(ground);

        this.particleSystem = new SmokePuffFlipbook({
            maxEmitterLife: undefined,
            frequency: 128 // every 8th tick
        }, data);
        (this.particleSystem as SmokePuffFlipbook).init();
        data.scene.add(this.particleSystem.points);

        // Gui needs to be defined after the ps is instantiated
        // Because curve editors need to have access to the linear splines inside the ps object
        const gui = new GUI();
        gui.domElement.onpointermove = (event: PointerEvent) => {
            // Prevent pointer events on the gui from interfering with orbital camera
            event.stopPropagation();
        }
        const ps = this.particleSystem as SmokePuff;
        const ceEmitRate = new CurveEditor(gui, ps.emitRateSpline!);
        ceEmitRate.makeCurveEditor("Emission rate");
        const ceAlpha = new CurveEditor(gui, ps.alphaSpline);
        ceAlpha.makeCurveEditor("Alpha");
        const ceSize = new CurveEditor(gui, ps.sizeSpline);
        ceSize.makeCurveEditor("Size");
        const ceVelocity = new CurveEditor(gui, ps.velocitySpline);
        ceVelocity.makeCurveEditor("Velocity");
        const ceColor = new CurveEditor(gui, ps.colorSpline);
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

        const timeNow = Date.now();
        this.particleSystem.tick(timeNow - this.timeLast);
        this.timeLast = timeNow;

    }
}