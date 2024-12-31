
import { Object3D, Quaternion, Vector2, Vector3 } from "three";

export class Utility {
    static ROUND_PRECISION = 4; // 4 decimal places;

    // Async Resource Getter constants
    static ARG_RETRIES = 3;
    static ARG_CHECK_INTERVAL = 200;
    static MESH_NAME_REGEX = /^[0-9A-Za-z _]+$/;    // enforce camelCase and spaces for mesh names and for model names. All others are invalid.

    static hashCode(input: string): number {
        let hash = 0, i, chr;
        if (input.length === 0) return hash;
        for (i = 0; i < input.length; i++) {
            chr = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    static generateUid(len: number): string {
        let uid = "";
        for (let i = 0; i < len; i++) {
            const digit = Math.round(Math.random() * 15);
            uid += digit.toString(16);
        }
        return uid;
    }

    static rotateVector(quat: Quaternion, vIn: Vector3): Vector3 {
        const vOut = new Vector3().copy(vIn);
        vOut.applyQuaternion(quat);
        return vOut;
    }

    static vectorsAlmostEqual(v1: Vector3, v2: Vector3): boolean {
        return Utility.roundVector3(v1, Utility.ROUND_PRECISION).equals(Utility.roundVector3(v2, Utility.ROUND_PRECISION));
    }

    static roundVector3(vIn: Vector3, places: number): Vector3 {
        const xPos = Utility.round(vIn.x, places);
        const yPos = Utility.round(vIn.y, places);
        const zPos = Utility.round(vIn.z, places);
        return new Vector3(xPos, yPos, zPos);
    }

    static round(n: number, places: number) {
        return parseFloat(n.toFixed(places));
    }

    static vectorCompare(v1: Vector3, v2: Vector3): boolean {
        return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
    }

    /**
     * Place and orient an object close to another entity.
     * Can be used for:
     *   * Placing a projectile before firing
     *   * Placing a building block
     *   * Positioning a raycast
     * @param object - The object to place.
     * @param offset - The distance from the base to place the object. Client may refer to it as firingPoint or something similar.
     * @param base - The entity the new object will be placed next to.
     */
    static placeAdjacentObject(object: Object3D, offset: Vector3, base: Object3D): void {
        const projectilePos = Utility.rotateVector(base.quaternion, offset);
        projectilePos.add(base.position);
        object.position.copy(projectilePos);       // position it
        object.setRotationFromQuaternion(base.quaternion); // face same direction as player   
    }

    /**
     * Offsets a position by a random amount on each axis, up to +/- maxDeviation
     */
    static jitter(v: Vector3, maxDeviation: number): Vector3 {
        const xDeviation = Math.random() * maxDeviation * 2 - maxDeviation;
        const yDeviation = Math.random() * maxDeviation * 2 - maxDeviation;
        const zDeviation = Math.random() * maxDeviation * 2 - maxDeviation;
        const v_result = new Vector3(v.x + xDeviation, v.y + yDeviation, v.z + zDeviation);
        // console.log(`Jitter`);
        // console.log(v);
        // console.log(v_result);
        return v_result;
    }

    /**
     * Determine if coordinates are within elements bounds. Both are with respect to the viewport
     * @param element 
     * @param coordinates 
     * @returns 
     */
    static elementContainsCoords(element: HTMLElement, coordinates: Vector2): boolean {
        const clientRect = element.getBoundingClientRect();
        const result = (coordinates.x > clientRect.left &&
            coordinates.x < clientRect.left + clientRect.width &&
            coordinates.y > clientRect.top &&
            coordinates.y < clientRect.top + clientRect.height
        );
        //console.log(`${Utility.timestamp()} Is ${coordinates.x},${coordinates.y} in ${clientRect.x}, ${clientRect.y}, ${clientRect.x + clientRect.width}, ${clientRect.y + clientRect.height}: ${result}`);
        return result;
    }

    static removeChildren(parent: HTMLElement) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }
    static removeChildrenFromTable(table: HTMLTableElement) {
        table.innerHTML = "";
    }

    /**
     * For htmlelement id's and for css selectors
     */
    static convertToKebabCase(input: string) {
        return input.toLowerCase().replace(/ /g, "-");
    }

    static convertToSnakeCase(input: string) {
        return input.toLowerCase().replace(" ", "_");
    }

    static timestamp(): string {
        return new Date().toISOString();
    }

    /**
     * Validates the parameters, concatenate and return. Throws error if invalid.
     * This enforces our mesh naming convention of modelname-meshname
     */

    static generateValidMeshName(modelName: string, meshName: string): string {
        if (!modelName || modelName.length === 0) {
            throw new Error(`${Utility.timestamp()} modelName not provided`);
        }
        if (!meshName || meshName.length === 0) {
            throw new Error(`${Utility.timestamp()} meshName not provided`);
        }
        if (!modelName.match(Utility.MESH_NAME_REGEX)) {
            throw new Error(`${Utility.timestamp()} Invalid modelName ${modelName}`);
        }
        if (meshName && !meshName.match(Utility.MESH_NAME_REGEX)) {
            throw new Error(`${Utility.timestamp()} Invalid meshName ${meshName}`);
        }
        return `${modelName}-${meshName}`;
    }

    static getModelName(name: string): string {
        const parts = name.split("-");
        return parts[0];
    }

    static getMeshName(name: string): string {
        const parts = name.split("-");
        return parts[1];
    }

    static center(element: HTMLElement) {
        const clientRect = element.getBoundingClientRect();
        element.style.left = (window.innerWidth - clientRect.width) / 2 + "px";
        element.style.top = (window.innerHeight - clientRect.height) / 2 + "px";
    }

    static lerp(a: number, b: number, t: number) {
        return a + t * (b - a);
    }

    static clamp(min: number, max: number, v: number) {
        return Math.min(Math.max(v, min), max);
    }

    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
    static isPointInPolygon(test: Vector2, vert: Array<Vector2>): boolean {
        let i, j, c = 0;
        const nvert = vert.length;
        for (i = 0, j = nvert - 1; i < nvert; j = i++) {
            if (((vert[i].y > test.y) != (vert[j].y > test.y)) &&
                (test.x < (vert[j].x - vert[i].x) * (test.y - vert[i].y) / (vert[j].y - vert[i].y) + vert[i].x)) {
                c++;
            }
        }
        return (c % 2 === 0) ? false : true;
    }

    /** Wraps map getter in a retry and returns Promise. For accessing resources loaded into map entries asynchronously */
    static asyncResourceGetter(map: Map<any, any>, key: string): Promise<any> {
        let retries = Utility.ARG_RETRIES;
        return new Promise<any>((resolve, reject) => {

            // Immediately try to get the resource
            const value = map.get(key);
            if (value) {
                resolve(value);
                return;
            }

            // key did not exist, retry
            const interval = setInterval(() => {
                const value = map.get(key);
                if (value) {
                    resolve(value);
                    clearInterval(interval);
                    return;

                } else if (retries < 1) {
                    reject(`Trying to get asset '${key}', timed out`);
                    clearInterval(interval);
                    return;
                }

                retries--;
            }, Utility.ARG_CHECK_INTERVAL);
        });
    }

}