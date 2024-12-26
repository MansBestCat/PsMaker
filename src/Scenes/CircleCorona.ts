import { AmbientLight, BoxGeometry, Color, DirectionalLight, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { CameraManMain } from "../Camera/CameraManMain";
import { Data } from "../Data";
import { ParticleSystemBase } from "../ParticleSystems/ParticleSystemBase";
import { Utility } from "../Utilitites/Utility";
import GUI from "lil-gui";
import { Corona } from "../ParticleSystems/Corona";

export class CircleCorona {

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

        const gui = new GUI();

        // Mock the points from the LinearSpline structure
        const points = {
            stub: () => {
                // For our custom Controller, we need to choose a type lil-gui recognizes.
                // The choice of "function" / button type is totally arbitrary.
                // The widget will be hidden in favor of the ui we build for curve editing.
                console.log(`${Utility.timestamp()} The button stub function fired.`);
            }
        };
        const curveEditor = gui.add(points, "stub");
        const button = document.createElement("button");
        button.innerHTML = "click me";
        button.onclick = () => { console.log(`${Utility.timestamp()} buttn clicked`); }
        curveEditor.domElement.append(button);
        curveEditor.onChange(() => {
            console.log(`${Utility.timestamp()} onChange`);
        });
        curveEditor.onFinishChange(() => {
            console.log(`${Utility.timestamp()} onFinChange`);
        });

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