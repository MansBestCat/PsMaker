import { Camera, PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "../Controls/OrbitControls";
import { Data } from "../Data";

export enum CameraView {
    PERSPECTIVE,
    ORTHO
}

export enum CameraOrient {
    NORTH_UP,
    PLAYER_HEADING,
    ISOMETRIC
}


/**
 * Valid camera configurations:
 * 
 * player	perspective	player heading
 * 
 * player	ortho		north up
 * player   ortho		isometric
 * player   ortho       player heading
 * 
 * room		ortho		north up
 * room     ortho		isometric
 * 
 * dev		perspective	any/orbitControls
 */

export class CameraManMain {
    DEFAULT_FOV = 55;
    DEFAULT_FAR = 75;

    data: Data;
    orbitControls?: OrbitControls;

    constructor(p_data: Data) {
        if (p_data === null) {
            throw new Error(`Null dependency injected`);
        }
        this.data = p_data;
    }

    makeCameraMAIN() {
        const camera = this.makeCameraPerspective();
        this.data.scene.add(camera);
        this.data.camera = camera;

    }

    makeCameraPerspective(): Camera {
        const fov = this.DEFAULT_FOV;
        const far = this.DEFAULT_FAR;
        const camera = new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, far);
        camera.layers.enableAll();
        return camera;
    }

    /** Sets or removes the orbital controls */
    makeCameraOrbital(target: Vector3): void {

        this.orbitControls = new OrbitControls(this.data.camera, this.data.canvas.parentElement);
        if (!this.orbitControls) {
            throw new Error(`OrbitalControls is undefined after instantiation`);
        }
        this.orbitControls.target = target;
        this.orbitControls.update();

    }


}