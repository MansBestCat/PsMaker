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
    divOutput?: HTMLDivElement;

    // For color type
    isColor = false;
    lastColorPoint?: Point;
    inputColor?: HTMLInputElement;
    colorStops?: Array<Element>;

    constructor(public gui: GUI, public linearSpline: LinearSpline) { }

    makeCurveEditor(labelText: string) {

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

            const point = this.insertPoint(event);

            this.updateFillAndOutput();

            svg.append(point.element);

            this.currentPoint = point;
        }

        svg.onpointermove = (event: PointerEvent) => {
            event.stopPropagation();
            if (!this.currentPoint) {
                return;
            }
            this.pointerMove(event);

            this.updateFillAndOutput();
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
        this.isColor = this.linearSpline._points.some(point => point[1] instanceof Color ? true : false);
        const domValues = this.splineToDom();
        for (let i = 0; i < domValues.length; i++) {
            const { cx, cy } = domValues[i];
            const lockX = i === 0 || i === domValues.length - 1 ? true : false;
            const lockY = this.isColor;
            const point = this.makePoint(cx, cy, lockX, lockY);
            this.points.push(point);
        }

        // Iterate the points to draw a shape connecting them
        this.fillArea = this.makeFillElement();
        svg.append(this.fillArea);

        // Put points into dom last so they'll be on top
        this.points.forEach(point => {
            svg.append(point.element);
        });


        div.append(svg);

        const label = document.createElement("p");
        label.innerHTML = labelText;
        div.append(label);

        // Output pane, list of points and values
        const divOutput = document.createElement("div");
        divOutput.style.zIndex = "1";
        divOutput.style.position = "absolute";
        divOutput.style.background = "rgba(255, 255, 255, 0.5)";
        divOutput.style.width = "60%";
        divOutput.style.left = "24%";
        divOutput.style.top = "8%";
        divOutput.style.pointerEvents = "none";
        divOutput.style.whiteSpace = "pre";
        divOutput.style.color = "red";
        divOutput.style.fontSize = "13px";
        divOutput.style.padding = "2px 3px";
        div.append(divOutput);
        this.divOutput = divOutput;

        if (this.isColor) {
            // Create a color input for opening the color picker
            const input = document.createElement("input");
            input.type = "color";
            input.style.position = "absolute";
            input.style.visibility = "hidden";
            input.onchange = this.inputColorChange.bind(this);
            div.append(input);
            this.inputColor = input;

            // Create the extra elements needed to render a color gradient
            this.gradientSetup(svg, this.linearSpline._points.length);
        }

        // All output elements are ready, do the initial rendering
        this.updateFillAndOutput();

        // Make the controller and append to it our built-up div
        const curveEditor = this.gui.add({ stub: () => { } }, "stub");
        curveEditor.$widget.style.display = "none";
        (curveEditor as FunctionController).$button.style.display = "none"; // Remove the function/button. We are not using it.
        curveEditor.domElement.append(div);

    }

    inputColorChange(event: Event) {
        const point = this.pointsMap.get(this.lastColorPoint!.element.dataset.pointId!)!;
        const index = this.points.indexOf(point);
        const value = new Color((event.target as HTMLInputElement).value);
        this.linearSpline._points[index][1] = value;

        this.updateFillAndOutput();

    }

    splineToDom(): Array<{ cx: number, cy: number }> {
        const domValues = new Array();
        for (let i = 0; i < this.linearSpline._points.length; i++) {
            const t = this.linearSpline._points[i][0];
            const value = this.linearSpline._points[i][1];
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

    pointerMove(event: PointerEvent) {
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
            this.linearSpline._points[index][0] = t;
            //console.log(`${Utility.timestamp()} set t to ${t}`);
        }
        if (!this.currentPoint!.lockY && event.offsetY > this.POINT_RADIUS && event.offsetY < this.HEIGHT - this.POINT_RADIUS) {
            this.currentPoint!.element.setAttribute("cy", event.offsetY.toString());
            const value = this.yDomToSpline(event.offsetY);
            this.linearSpline._points[index][1] = value;
            //console.log(`${Utility.timestamp()} set value to ${value}`);
        }
    }

    insertPoint(event: PointerEvent): Point {
        // Add a new point        
        const point = this.makePoint(event.offsetX, event.offsetY, false, this.isColor);
        for (let i = 1; i < this.points.length; i++) {
            const cx = parseFloat(this.points[i].element.getAttribute("cx")!);
            if (cx > event.offsetX) {
                // Insert the point at the index i
                this.points.splice(i, 0, point);
                const t = this.xDomToSpline(parseFloat(point.element.getAttribute("cx")!));
                const value = this.isColor ? new Color : this.yDomToSpline(parseFloat(point.element.getAttribute("cy")!));
                this.linearSpline._points.splice(i, 0, [t, value]);
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
                this.lastColorPoint = this.currentPoint;
                this.inputColor?.showPicker();
            }
        }
        return point;
    }

    makeFillElement(): HTMLElement {
        const element = document.createElementNS(this.SVGNS, "path") as HTMLElement;
        const fill = this.isColor ? 'url(#Gradient)' : "white";
        element.setAttribute("fill", fill);
        element.setAttribute("d", `${this.buildPathString()}`);
        return element;
    }

    updateFillAndOutput() {
        this.fillArea!.setAttribute("d", `${this.buildPathString()}`);
        if (this.isColor) {
            this.updateGradientStops();
        }

        this.divOutput!.innerHTML = this.toString();
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

    /** Serialized list of points and values */
    toString(): string {
        let output = "";
        for (let i = 0; i < this.linearSpline._points.length; i++) {
            const x = Utility.round(parseFloat(this.linearSpline._points[i][0]), 2);
            const y = this.isColor ? this.linearSpline._points[i][1].getHexString()
                : Utility.round(parseFloat(this.linearSpline._points[i][1]), 2);
            output += `p_${i} = (${x}, ${y})\n`;
        }
        return output;
    }

    gradientSetup(svg: Element, numPoints: number) {
        var defs = document.createElementNS(this.SVGNS, 'defs');
        var gradient = document.createElementNS(this.SVGNS, 'linearGradient');

        // Apply the <lineargradient> to <defs>
        gradient.id = 'Gradient';
        gradient.setAttribute('x1', '0');
        gradient.setAttribute('x2', '1');
        gradient.setAttribute('y1', '0');
        gradient.setAttribute('y2', '0');

        // Create a <stop> element and set its offset based on the position of the for loop.
        this.colorStops = new Array();
        for (let i = 0; i < numPoints; i++) {
            this.colorStops.push(document.createElementNS(this.SVGNS, 'stop'));
        }

        gradient.append(...this.colorStops);

        defs.appendChild(gradient);

        svg.appendChild(defs);

    }

    updateGradientStops() {
        // Create <svg>, <defs>, <linearGradient> and <rect> elements using createElementNS to apply the SVG namespace.

        // Parses an array of stop information and appends <stop> elements to the <linearGradient>
        for (let i = 0; i < this.linearSpline._points.length; i++) {

            const offset = Utility.round(this.linearSpline._points[i][0] * 100, 1) + "%";
            const color = "#" + this.linearSpline._points[i][1].getHexString();

            this.colorStops![i].setAttribute('offset', offset);
            this.colorStops![i].setAttribute('stop-color', color);

        }

    }
}