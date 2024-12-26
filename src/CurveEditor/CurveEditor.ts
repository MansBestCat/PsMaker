import GUI from "lil-gui";
import { Utility } from "../Utilitites/Utility";

export class CurveEditor {

    SVGNS = "http://www.w3.org/2000/svg";

    currentPoint?: HTMLElement;

    makeCurveEditor(gui: GUI, points: any) {

        // Build up the CurveController ui elements and events
        const div = document.createElement("div");

        const svg = document.createElementNS(this.SVGNS, "svg") as HTMLElement;
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");

        svg.onpointermove = (event: PointerEvent) => {
            event.stopPropagation();
            if (!this.currentPoint) {
                return;
            }
            const element = event.target as HTMLElement;
            element.setAttribute("cx", event.offsetX.toString());
            element.setAttribute("cy", event.offsetY.toString());
        }

        svg.onpointerup = (event: PointerEvent) => {
            event.stopPropagation();
            this.currentPoint = undefined;
        }

        const arrow = document.createElementNS(this.SVGNS, "path");
        arrow.setAttribute("d", "M 30 0 L 140 0 L 140 7 L 85 20 L 30 7 Z");
        arrow.setAttribute("fill", "#FFFFFF");
        svg.appendChild(arrow);

        const topLeft = document.createElementNS(this.SVGNS, "circle") as HTMLElement;
        topLeft.setAttribute("cx", "10");
        topLeft.setAttribute("cy", "10");
        topLeft.setAttribute("r", "10");
        topLeft.onpointerdown = (event: PointerEvent) => {
            event.stopPropagation();
            const element = event.target as HTMLElement;
            // element.dataset.startX = event.clientX.toString();
            // element.dataset.startY = event.clientY.toString();
            // element.dataset.initX = element.parentElement!.style.left || "0";
            // element.dataset.initY = element.parentElement!.style.top || "0";
            this.currentPoint = element;
        }
        svg.appendChild(topLeft);

        div.append(svg);

        const curveEditor = gui.add(points, "stub");
        curveEditor.domElement.append(div);
        curveEditor.onChange(() => {
            console.log(`${Utility.timestamp()} onChange`);
        });
        curveEditor.onFinishChange(() => {
            console.log(`${Utility.timestamp()} onFinChange`);
        });

    }
}