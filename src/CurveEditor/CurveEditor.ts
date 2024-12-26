import GUI from "lil-gui";
import { Utility } from "../Utilitites/Utility";

export class CurveEditor {

    SVGNS = "http://www.w3.org/2000/svg";

    makeCurveEditor(gui: GUI, points: any) {

        // Build up the CurveController ui elements and events
        const div = document.createElement("div");

        const svg = document.createElementNS(this.SVGNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");

        const arrow = document.createElementNS(this.SVGNS, "path");
        arrow.setAttribute("d", "M 30 0 L 140 0 L 140 7 L 85 20 L 30 7 Z");
        arrow.setAttribute("fill", "#FFFFFF");
        svg.appendChild(arrow);

        const topLeft = document.createElementNS(this.SVGNS, "circle");
        topLeft.setAttribute("cx", "10");
        topLeft.setAttribute("cy", "10");
        topLeft.setAttribute("r", "10");
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