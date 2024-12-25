import { Clock, HalfFloatType, WebGLRenderer } from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { CameraManMain } from "./Camera/CameraManMain";
import { Data } from "./Data";

export class GameEngine {
    static readonly DEFAULT_PIXEL_RATIO = 0.5;
    static readonly DEFAULT_ANTIALIAS = false;
    luminanceThreshold = 1.0;

    data: Data;
    canvas: HTMLCanvasElement;
    cameraManMain: CameraManMain;

    webGlRenderer?: WebGLRenderer;

    constructor(p_data: Data, p_canvas: HTMLCanvasElement, cameraManMain: CameraManMain) {
        if (p_data === null || p_canvas === null || !cameraManMain) {
            throw new Error(`Null dependency injected to`);
        }
        this.data = p_data;
        this.canvas = p_canvas;
        this.cameraManMain = cameraManMain;
    }

    init() {
        this.makeCameras();
        this.createRenderers();

        // Set up and start threejs render loop
        this.data.clock = new Clock();
        this.animate();
    }

    makeCameras() {
        // Start with a zoomed-out camera, not on any entity
        this.cameraManMain.makeCameraMAIN()

        if (!this.data.camera) {
            throw new Error(`Camera setup failed?`);
        }

    }


    createRenderers() {
        const webGlRenderer = this.createWebGLRenderer();
        this.webGlRenderer = webGlRenderer;
    }

    createWebGLRenderer(): WebGLRenderer {
        const renderer = this.getNewWebGLRenderer(this.canvas);
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        const pixelRatio = 1.0;
        renderer.setPixelRatio(pixelRatio);
        renderer.shadowMap.enabled = false;
        renderer.sortObjects = false;
        renderer.info.autoReset = false;
        renderer.autoClear = false;
        return renderer;
    }

    getNewWebGLRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
        const webGlRenderer = new WebGLRenderer({ canvas, antialias: false, stencil: false, depth: true, powerPreference: "high-performance" });
        console.log(`Starting the webGl renderer with these capabilities:`);
        console.log(JSON.stringify(webGlRenderer.capabilities));
        return webGlRenderer;
    }

    getNewCss2DRenderer(element: HTMLDivElement): CSS2DRenderer {
        return new CSS2DRenderer({ element });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.mainCamera();
    }

    mainCamera() {
        if (!this.data.camera || !this.webGlRenderer) {
            throw new Error(`expected cam and renderer`);;
        }

        this.webGlRenderer.clear();

        this.webGlRenderer.setScissorTest(false);
        this.webGlRenderer.setViewport(0, 0, window.innerWidth, window.innerHeight);

        this.webGlRenderer.render(this.data.scene, this.data.camera);

        this.webGlRenderer.clearDepth();

    }
}
