import { LinearSpline } from "./LinearSpline";
import { Utility } from "./Utility";

export class LinearSplineOut extends LinearSpline {

    get(t: number) {
        throw new Error(`${Utility.timestamp()} Not implemented. Use getResult instead.`);
    }

    /** Uses an out var to return the value to the caller */
    getResult(t: number, result: any) {
        const { p1, p2 } = this.getLerpPoints(t);

        if (p1 == p2) {
            return this._points[p1][1];
        }

        return this._lerp(
            (t - this._points[p1][0]) / (this._points[p2][0] - this._points[p1][0]),
            this._points[p1][1],
            this._points[p2][1],
            result
        );
    }

}
