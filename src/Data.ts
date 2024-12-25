import { Camera, Clock, Scene } from "three";

export class Data {

    tickSize = 16.666;
    scene: Scene;
    canvas: HTMLCanvasElement;
    clock?: Clock;
    camera?: Camera;
    commonMaterials: any;

    constructor(p_canvas: HTMLCanvasElement) {
        if (p_canvas === null) {
            throw new Error(`Null dependency injected to Data`);
        }
        this.canvas = p_canvas;
        this.scene = new Scene();

    }
}