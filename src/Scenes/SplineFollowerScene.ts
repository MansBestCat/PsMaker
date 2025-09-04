import GUI from "lil-gui";
import { BufferGeometry, CatmullRomCurve3, Line, LineBasicMaterial, Vector3 } from "three";
import { CameraManMain } from "../Camera/CameraManMain";
import { Data } from "../Data";
import { SplineFollower } from "../ParticleSystems/SplineFollower";
import { Utility } from "../Utilitites/Utility";

export class SplineFollowerScene {
    particleSystem!: SplineFollower;
    spline!: CatmullRomCurve3;
    lineGeom!: Line;
    timeLast = Date.now();

    go(data: Data, cameraManMain: CameraManMain) {
        if (!data.camera) throw new Error(`${Utility.timestamp()} Expected camera`);

        data.camera.position.set(0, 5, -10);
        data.camera.lookAt(0, 0, 0);

        const points = [
            new Vector3(-2, 0, 0),
            new Vector3(-1, 1, 0),
            new Vector3(0, 2, 0),
            new Vector3(1, 1, 0),
            new Vector3(2, 0, 0)
        ];
        this.spline = new CatmullRomCurve3(points);

        const lineMaterial = new LineBasicMaterial({ color: 0x888888 });
        const lineGeometry = new BufferGeometry().setFromPoints(this.spline.getPoints(50));
        this.lineGeom = new Line(lineGeometry, lineMaterial);
        data.scene.add(this.lineGeom);

        this.particleSystem = new SplineFollower({ frequency: 64 }, this.spline);
        data.scene.add(this.particleSystem.points);

        const gui = new GUI();
        gui.domElement.onpointermove = (event: PointerEvent) => event.stopPropagation();
        gui.add(this.particleSystem, "maxParticleLife", 100, 3000).name("Max Particle Life");
        gui.add(this.particleSystem, "frequency", 16, 256).step(1).name("Emission Frequency");
        gui.add(this.particleSystem, "velocityScalar", 0.1, 5.0).name("Velocity Scalar");
        gui.add(this.particleSystem, "dampingFactor", 0.01, 0.5).name("Damping");

        this.spline.points.forEach((pt, i) => {
            const folder = gui.addFolder(`Control Point ${i}`);
            folder.add(pt, "x", -10, 10).onChange(() => this.updateSpline());
            folder.add(pt, "y", -10, 10).onChange(() => this.updateSpline());
            folder.add(pt, "z", -10, 10).onChange(() => this.updateSpline());
        });

        this.animate();
    }

    updateSpline() {
        const updatedPoints = this.spline.getPoints(50);
        this.lineGeom.geometry.setFromPoints(updatedPoints);
        this.lineGeom.geometry.attributes.position.needsUpdate = true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const timeNow = Date.now();
        const delta = timeNow - this.timeLast;
        this.timeLast = timeNow;

        this.updateSpline();
        this.particleSystem.tick(delta);
    }
}
