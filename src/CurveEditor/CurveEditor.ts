import GUI from "lil-gui";
import { Utility } from "../Utilitites/Utility";
import { Vector2 } from "three";

type PointId = string;

class Point {
    constructor(
        public pointId: PointId,
        public element: HTMLElement,
        public lockX: boolean   // Whether the x axis movement for the points is prevented.
        // Will be set to true for points 0 and n-1
    ) { }
}

export class CurveEditor {

    SVGNS = "http://www.w3.org/2000/svg";
    POINT_RADIUS = 10;
    WIDTH = 150;
    HEIGHT = 75;

    points = new Array<Point>();            // Ordered, for output to the points of the LinearSpline
    pointsMap = new Map<PointId, Point>();  // Map,     for access from pointer events
    currentPoint?: Point;
    fillArea?: HTMLElement;

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
            if (!this.currentPoint.lockX) {
                this.currentPoint.element.setAttribute("cx", event.offsetX.toString());
            }
            this.currentPoint.element.setAttribute("cy", event.offsetY.toString());
            this.fillArea!.setAttribute("d", `${this.buildPathString()}`);
        }

        svg.onpointerup = (event: PointerEvent) => {
            event.stopPropagation();
            this.currentPoint = undefined;
        }

        // Make the end points
        const pointLeft = this.makePoint(10, 10, true);
        const pointRight = this.makePoint(100, 10, true);
        this.points.push(pointLeft, pointRight);

        // Iterate the points to draw a shape connecting them
        this.fillArea = this.connectPoints();
        svg.append(this.fillArea);

        // Points last so they'll be on top
        svg.append(pointLeft.element, pointRight.element);

        div.append(svg);

        // Call lil-gui to make it and append our built-up div
        const curveEditor = gui.add(points, "stub");
        curveEditor.domElement.append(div);

        // Wire up events as necessary
        curveEditor.onChange(() => {
            console.log(`${Utility.timestamp()} onChange`);
        });
        curveEditor.onFinishChange(() => {
            console.log(`${Utility.timestamp()} onFinChange`);
        });

    }

    /**
     * Make a point, add it to the map, and return it.
     */
    makePoint(cx: number, cy: number, lockX: boolean): Point {
        const pointId = Utility.generateUid(8);
        const point = new Point(pointId, this.makePointElement(pointId, cx, cy), lockX);
        this.pointsMap.set(point.pointId, point);
        return point;
    }

    makePointElement(pointId: PointId, cx: number, cy: number): HTMLElement {
        const point = document.createElementNS(this.SVGNS, "circle") as HTMLElement;
        point.dataset.pointId = pointId;
        point.setAttribute("cx", cx.toString());
        point.setAttribute("cy", cy.toString());
        point.setAttribute("r", this.POINT_RADIUS.toString());

        point.onpointerdown = (event: PointerEvent) => {
            event.stopPropagation();
            const element = event.target as HTMLElement;
            this.currentPoint = this.pointsMap.get(element.dataset.pointId!);
        }
        return point;
    }

    connectPoints(): HTMLElement {
        const fillArea = document.createElementNS(this.SVGNS, "path") as HTMLElement;
        fillArea.setAttribute("fill", "#FFFFFF");
        fillArea.setAttribute("d", `${this.buildPathString()}`);
        return fillArea;
    }

    buildPathString(): string {
        // Draw clockwise from top left.
        // Start by drawing the points left to right, then down the right side, and the bottom, then up the left        
        let pathString = "M ";
        for (let i = 0; i < this.points.length; i++) {
            pathString += `${this.pointPathString(i)} L `;
        }
        const bottomRight = { left: this.WIDTH - this.POINT_RADIUS, top: this.HEIGHT - this.POINT_RADIUS };
        const bottomLeft = { left: this.POINT_RADIUS, top: this.HEIGHT - this.POINT_RADIUS };
        pathString += `${bottomRight.left} ${bottomRight.top} L`;
        pathString += `${bottomLeft.left} ${bottomLeft.top} Z`;
        return pathString;
    }

    pointPathString(index: number) {
        return `${this.points[index].element.getAttribute("cx")} ${this.points[index].element.getAttribute("cy")}`;
    }
}