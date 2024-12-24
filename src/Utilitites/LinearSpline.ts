import { Utility } from "./Utility";

export class LinearSpline {
    _points: any[];
    _lerp: any;
    constructor(lerp: any) {
        this._points = [];
        this._lerp = lerp;
    }

    addPoint(t: number, data: any) {
        this._points.push([t, data]);
    }

    get(t: number) {
        const { p1, p2 } = this.getLerpPoints(t);

        if (p1 == p2) {
            return this._points[p1][1];
        }

        return this._lerp(
            (t - this._points[p1][0]) / (this._points[p2][0] - this._points[p1][0]),
            this._points[p1][1],
            this._points[p2][1]
        );
    }

    getLerpPoints(t: number): { p1: number, p2: number } {
        if (t > 1.0) {
            throw new Error(`${Utility.timestamp()} LinearSpline t values are normalized to the interval [0.0-1.0]. Given t ${t} is out of range`);
        }
        let p1 = 0;

        // Determine start point
        for (let i = 0; i < this._points.length; i++) {
            if (this._points[i][0] >= t) {
                break;
            }
            p1 = i;
        }

        // Determine end point
        const p2 = Math.min(this._points.length - 1, p1 + 1);

        return { p1, p2 };
    }
}
