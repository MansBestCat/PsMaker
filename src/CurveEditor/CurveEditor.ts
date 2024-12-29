import GUI, { FunctionController } from "lil-gui";
import { Utility } from "../Utilitites/Utility";
import { LinearSpline } from "../Utilitites/LinearSpline";
import { Color } from "three";

type PointId = string;

class Point {
    constructor(
        public pointId: PointId,
        public element: HTMLElement,
        public lockX: boolean,   // Whether the x axis movement for the point is prevented.
        // Will be set to true for points 0 and n-1
        public lockY: boolean   // Whether the y axis movement for the point is prevented.
        // Will be set to true for colors
    ) { }
}

export class CurveEditor {

    SVGNS = "http://www.w3.org/2000/svg";
    POINT_RADIUS = 8;
    WIDTH = 238;
    HEIGHT = 100;
    AVAILABLE_WIDTH = this.WIDTH - 2 * this.POINT_RADIUS;
    AVAILABLE_HEIGHT = this.HEIGHT - 2 * this.POINT_RADIUS;
    TOP = this.POINT_RADIUS;
    LEFT = this.POINT_RADIUS;
    MAX_VALUE = 10; // FIXME: until we have scalar or some other way to fit the range

    points = new Array<Point>();            // Ordered, for output to the points of the LinearSpline
    pointsMap = new Map<PointId, Point>();  // Map,     for access from pointer events
    currentPoint?: Point;
    fillArea?: HTMLElement;
    isColor = false;
    inputColor?: HTMLInputElement;

    makeCurveEditor(gui: GUI, linearSpline: LinearSpline, labelText: string) {

        // Build up the CurveController ui elements and events
        const div = document.createElement("div");
        div.style.position = "relative";

        const svg = document.createElementNS(this.SVGNS, "svg") as HTMLElement;
        svg.setAttribute("width", this.WIDTH + "px");
        svg.setAttribute("height", this.HEIGHT + "px");
        svg.style.border = "2px solid red";

        svg.onpointerdown = (event: PointerEvent) => {
            event.stopPropagation();
            if (this.currentPoint) {
                throw new Error(`${Utility.timestamp()} Unexpected condition. Expected currentPoint to be undefined`);
            }

            const point = this.insertPoint(event, linearSpline);
            this.fillArea!.setAttribute("d", `${this.buildPathString()}`);
            svg.append(point.element);

            this.currentPoint = point;
        }

        svg.onpointermove = (event: PointerEvent) => {
            event.stopPropagation();
            if (!this.currentPoint) {
                return;
            }
            this.pointerMove(event, linearSpline);
        }

        svg.onpointerup = (event: PointerEvent) => {
            event.stopPropagation();
            this.currentPoint = undefined;
        }

        svg.onpointerleave = (event: PointerEvent) => {
            event.stopPropagation();
            this.currentPoint = undefined;
        };

        // Make the points
        this.isColor = linearSpline._points.some(point => point[1] instanceof Color ? true : false);
        const domValues = this.splineToDom(linearSpline);
        for (let i = 0; i < domValues.length; i++) {
            const { cx, cy } = domValues[i];
            const lockX = i === 0 || i === domValues.length - 1 ? true : false;
            const lockY = this.isColor;
            const point = this.makePoint(cx, cy, lockX, lockY);
            this.points.push(point);
        }

        if (this.isColor) {
            const input = document.createElement("input");
            input.type = "color";
            input.style.position = "absolute";
            input.style.visibility = "hidden";
            input.onchange = () => {
                console.log(`${Utility.timestamp()} change`)
            };
            div.append(input);
            this.inputColor = input;
        }

        // Iterate the points to draw a shape connecting them
        this.fillArea = this.connectPoints();
        svg.append(this.fillArea);

        // Put points into dom last so they'll be on top
        this.points.forEach(point => {
            svg.append(point.element);
        });

        div.append(svg);

        const label = document.createElement("p");
        label.innerHTML = labelText;
        div.append(label);

        // Make the controller and append to it our built-up div
        const curveEditor = gui.add({ stub: () => { } }, "stub");
        curveEditor.$widget.style.display = "none";
        (curveEditor as FunctionController).$button.style.display = "none"; // Remove the function/button. We are not using it.
        curveEditor.domElement.append(div);

        // Wire up events as necessary
        curveEditor.onChange(() => {
            console.log(`${Utility.timestamp()} onChange`);
        });
        curveEditor.onFinishChange(() => {
            console.log(`${Utility.timestamp()} onFinChange`);
        });

    }

    splineToDom(linearSpline: LinearSpline): Array<{ cx: number, cy: number }> {
        const domValues = new Array();
        for (let i = 0; i < linearSpline._points.length; i++) {
            const t = linearSpline._points[i][0];
            const value = linearSpline._points[i][1];
            const cx = this.LEFT + t * this.AVAILABLE_WIDTH;
            let cy;
            if (value instanceof Color) {
                cy = this.TOP;
            } else {
                cy = this.TOP + this.AVAILABLE_HEIGHT / this.MAX_VALUE * (this.MAX_VALUE - value);
            }
            domValues.push({ cx, cy });
        }
        return domValues;
    }

    xDomToSpline(cx: number): number {
        const t = (cx - this.LEFT) / this.AVAILABLE_WIDTH;
        return t;
    }

    yDomToSpline(cy: number): number {
        const value = -((cy - this.TOP) * (this.MAX_VALUE / this.AVAILABLE_HEIGHT) - this.MAX_VALUE);
        return value;
    }

    pointerMove(event: PointerEvent, linearSpline: LinearSpline) {
        const point = this.pointsMap.get(this.currentPoint!.element.dataset.pointId!)!;
        const index = this.points.indexOf(point);
        let xBetweenPoints = true;
        if (index > 0) {
            // check to the left
            const pointToTheLeft = this.points[index - 1];
            if (event.offsetX < parseFloat(pointToTheLeft.element.getAttribute("cx")!) + 2 * this.POINT_RADIUS) {
                xBetweenPoints = false;
            }
        }
        if (index < this.points.length - 1) {
            // check to the right
            const pointToTheRight = this.points[index + 1];
            if (event.offsetX > parseFloat(pointToTheRight.element.getAttribute("cx")!) - 2 * this.POINT_RADIUS) {
                xBetweenPoints = false;
            }
        }

        if (!this.currentPoint!.lockX && xBetweenPoints) {
            this.currentPoint!.element.setAttribute("cx", event.offsetX.toString());
            const t = this.xDomToSpline(event.offsetX);
            linearSpline._points[index][0] = t;
            //console.log(`${Utility.timestamp()} set t to ${t}`);
        }
        if (!this.currentPoint!.lockY && event.offsetY > this.POINT_RADIUS && event.offsetY < this.HEIGHT - this.POINT_RADIUS) {
            this.currentPoint!.element.setAttribute("cy", event.offsetY.toString());
            const value = this.yDomToSpline(event.offsetY);
            linearSpline._points[index][1] = value;
            //console.log(`${Utility.timestamp()} set value to ${value}`);
        }
        this.fillArea!.setAttribute("d", `${this.buildPathString()}`);
    }

    insertPoint(event: PointerEvent, linearSpline: LinearSpline): Point {
        // Add a new point        
        const point = this.makePoint(event.offsetX, event.offsetY, false, this.isColor);
        for (let i = 1; i < this.points.length; i++) {
            const cx = parseFloat(this.points[i].element.getAttribute("cx")!);
            if (cx > event.offsetX) {
                // Insert the point at the index i
                this.points.splice(i, 0, point);
                const _cx = this.xDomToSpline(parseFloat(point.element.getAttribute("cx")!));
                const _cy = this.yDomToSpline(parseFloat(point.element.getAttribute("cy")!));
                linearSpline._points.splice(i, 0, [_cx, _cy]);
                break;
            }
        }
        return point;
    }

    /**
     * Make a point, add it to the map, and return it.
     */
    makePoint(cx: number, cy: number, lockX: boolean, lockY: boolean): Point {
        const pointId = Utility.generateUid(8);
        const point = new Point(pointId, this.makePointElement(pointId, cx, cy), lockX, lockY);
        this.pointsMap.set(point.pointId, point);
        return point;
    }

    makePointElement(pointId: PointId, cx: number, cy: number): HTMLElement {
        const point = document.createElementNS(this.SVGNS, "circle") as HTMLElement;
        point.dataset.pointId = pointId;
        point.setAttribute("cx", cx.toString());
        point.setAttribute("cy", cy.toString());
        point.setAttribute("r", this.POINT_RADIUS.toString());
        point.setAttribute("stroke", "white");
        point.setAttribute("stroke-width", "2");

        point.onpointerdown = (event: PointerEvent) => {
            event.stopPropagation();
            const element = event.target as HTMLElement;
            this.currentPoint = this.pointsMap.get(element.dataset.pointId!);
            if (this.isColor) {
                this.inputColor?.showPicker();
            }
        }
        return point;
    }

    connectPoints(): HTMLElement {
        const fillArea = document.createElementNS(this.SVGNS, "path") as HTMLElement;
        fillArea.setAttribute("fill", "white");
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