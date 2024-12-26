import GUI from "lil-gui";
import { Utility } from "../Utilitites/Utility";

export class CurveEditor {

    SVGNS = "http://www.w3.org/2000/svg";
    POINT_RADIUS = 10;
    WIDTH = 150;
    HEIGHT = 75;

    points = new Array<HTMLElement>();
    currentPoint?: HTMLElement;

    makeCurveEditor(gui: GUI, points: any) {

        // Build up the CurveController ui elements and events
        const div = document.createElement("div");

        const svg = document.createElementNS(this.SVGNS, "svg") as HTMLElement;
        svg.setAttribute("width", this.WIDTH + "px");
        svg.setAttribute("height", this.HEIGHT + "px");
        svg.style.border = "2px solid red";

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

        // Make and push the end points
        const topLeft = this.makePoint(10, 10);
        const topRight = this.makePoint(100, 10);
        this.points.push(topLeft, topRight);

        // Iterate the points to draw a shape connecting them
        this.connectPoints();

        svg.append(topLeft, topRight);



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

    makePoint(cx: number, cy: number): HTMLElement {
        const point = document.createElementNS(this.SVGNS, "circle") as HTMLElement;
        point.setAttribute("cx", cx.toString());
        point.setAttribute("cy", cy.toString());
        point.setAttribute("r", this.POINT_RADIUS.toString());
        point.onpointerdown = (event: PointerEvent) => {
            event.stopPropagation();
            const element = event.target as HTMLElement;
            this.currentPoint = element;
        }
        return point;
    }


    connectPoints() {
        // const arrow = document.createElementNS(this.SVGNS, "path");
        // arrow.setAttribute("d", "M 30 0 L 140 0 L 140 7 L 85 20 L 30 7 Z");
        // arrow.setAttribute("fill", "#FFFFFF");
        // svg.appendChild(arrow);

    }
}