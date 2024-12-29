import { AmbientLight, BoxGeometry, Color, DirectionalLight, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { CameraManMain } from "../Camera/CameraManMain";
import { Data } from "../Data";
import { ParticleSystemBase } from "../ParticleSystems/ParticleSystemBase";
import { Utility } from "../Utilitites/Utility";
import GUI from "lil-gui";
import { Corona } from "../ParticleSystems/Corona";
import { CurveEditor } from "../CurveEditor/CurveEditor";

export class CircleCorona {
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

        const ground = new Mesh(new BoxGeometry(10, 1, 10), new MeshPhongMaterial({ color: new Color(0x333333) }));
        ground.position.y = -2;
        data.scene.add(ground);


        // TODO: Place here any meshes that are needed

        data.camera.position.set(0, 7, -12);
        data.camera?.lookAt(0, 2, 0);


        this.particleSystem = new Corona({
            parent: data.scene, maxEmitterLife: undefined, frequency: data.tickSize
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
        const ceEmitRate = new CurveEditor();
        ceEmitRate.makeCurveEditor(gui, psCorona.emitRateSpline!, "Emission rate");
        const ceAlpha = new CurveEditor();
        ceAlpha.makeCurveEditor(gui, psCorona.alphaSpline, "Alpha");
        const ceSize = new CurveEditor();
        ceSize.makeCurveEditor(gui, psCorona.sizeSpline, "Size");
        const ceVelocity = new CurveEditor();
        ceVelocity.makeCurveEditor(gui, psCorona.velocitySpline, "Velocity");
        const ceColor = new CurveEditor();
        ceColor.makeCurveEditor(gui, psCorona.colorSpline, "Color");

        // const shaderMat = new CylinderRingsMaterial().clone();
        // gui.add(shaderMat.uniforms.uUvYOffset, "value", 0, 3, 0.1).name("uUvYOffset");
        // gui.add(shaderMat.uniforms.uXTFactor, "value", 0, 10, 0.1).name("uXTFactor");
        // gui.add(shaderMat.uniforms.uXTOffset, "value", 0, 10, 0.1).name("uXTOffset");

        // const plainMat = new MeshBasicMaterial({ color: new Color(0x0000ff) });
        // const mats = [shaderMat, plainMat, plainMat];
        // mesh.material = mats;

        //gui.add(shaderMat.clock, "start").name("reset clock");

        cameraManMain.makeCameraOrbital(new Vector3(0, 0, 0));

        document.addEventListener('mousemove', () => {
            this.particleSystem.addParticle()
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