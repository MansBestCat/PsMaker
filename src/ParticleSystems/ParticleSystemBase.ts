import { BufferGeometry, Color, Float32BufferAttribute, Material, Points, ShaderMaterial, Vector3 } from "three";
import { LinearSpline } from "../Utilitites/LinearSpline";
import { Utility } from "../Utilitites/Utility";


export class Particle {
    alpha!: number;     // 0.0 to 1.0
    life!: number;      // ms, 0-based number, from 0 to maxLife-1
    maxLife!: number;   // ms, 1-based number
    position!: Vector3;
    size!: number;
    colour!: Color;
    rotation!: number;  // rads
    velocity!: Vector3;
    tScalar!: number; // optionally used to index a spline in a way to create a faster or slower animation
}


export abstract class ParticleSystemBase {
    particles: Particle[];

    geometry: BufferGeometry;
    material!: ShaderMaterial;
    points!: Points<BufferGeometry, Material>;

    frequency: number;  //emit every frequency ms
    freqCounter: number;
    emitterLife: number;       // range from 0 to maxEmitterLife
    maxEmitterLife?: number;    // duration of the particle system. If defined, must be gt 0
    emitRateSpline?: LinearSpline;

    maxParticleLife!: number;

    constructor(params: any) {
        if (!params.frequency) {
            throw new Error(`${Utility.timestamp()} Missing expected to param in ParticleSystemBase()`);
        }
        this.particles = [];

        this.geometry = new BufferGeometry();
        this.geometry.setAttribute('position', new Float32BufferAttribute([], 3));
        this.geometry.setAttribute('size', new Float32BufferAttribute([], 1));
        this.geometry.setAttribute('colour', new Float32BufferAttribute([], 4));
        this.geometry.setAttribute('angle', new Float32BufferAttribute([], 1));

        if (params.maxEmitterLife) {
            if (params.maxEmitterLife === 0) {
                throw new Error(`${Utility.timestamp()} Can't be zero`);
            }
            this.maxEmitterLife = params.maxEmitterLife;
        }
        this.emitterLife = 0;
        this.frequency = params.frequency;
        this.freqCounter = 0;

    }

    tick(timeElapsed: number) {
        this.addParticlesGate(timeElapsed);
        this.updateParticles(timeElapsed);
        this.updateGeometry();
    }

    abstract makeParticle(): Particle;

    /** Increment a particle's life and update its other properties from splines */
    abstract updateParticles(timeElapsed: number): void;

    addParticlesGate(timeElapsed: number) {
        this.freqCounter += timeElapsed;
        if (this.freqCounter < this.frequency) {
            return;
        }

        if (this.maxEmitterLife && this.emitterLife > this.maxEmitterLife) {
            // emission time is over, ps is winding down
            return;
        }

        // Reset the freq counter
        this.freqCounter = this.freqCounter - this.frequency;

        // Determine how many particles to add
        const numParticles = this.numParticles();
        for (let i = 0; i < numParticles; i++) {
            const particle = this.makeParticle();
            this.particles.push(particle);
        }
        //console.log(`${Utility.timestamp()} in addParticlesGate, adding ${numParticles}`);
    }

    numParticles() {
        if (!this.emitRateSpline) {
            throw new Error(`${Utility.timestamp()} All ps that inherit from ParticleSystemBase as of 24 DEC 2024 req emitRateSpline to be defined`);
        }

        if (this.maxEmitterLife === undefined) {
            // infinite
            return this.emitRateSpline.get(0);

        } else {
            return this.emitRateSpline.get(this.emitterLife / this.maxEmitterLife);

        }
    }

    updateGeometry() {
        const positions: number[] = [];
        const sizes: number[] = [];
        const colours: number[] = [];
        const angles: number[] = [];

        for (const p of this.particles) {
            positions.push(p.position.x, p.position.y, p.position.z);
            colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
            sizes.push(p.size);
            angles.push(0); // FIXME:
        }

        this.geometry.setAttribute(
            'position', new Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute(
            'size', new Float32BufferAttribute(sizes, 1));
        this.geometry.setAttribute(
            'colour', new Float32BufferAttribute(colours, 4));
        this.geometry.setAttribute(
            'angle', new Float32BufferAttribute(angles, 1));

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        this.geometry.attributes.colour.needsUpdate = true;
        this.geometry.attributes.angle.needsUpdate = true;
    }

    sort() {
        // console.log(`${Utility.timestamp()} ${this.particles.length}`);
        // this.particles.sort((a, b) => {
        //     const d1 = this.data.cameraManMain.position.distanceTo(a.position);
        //     const d2 = this._camera.position.distanceTo(b.position);

        //     if (d1 > d2) {
        //         return -1;
        //     }

        //     if (d1 < d2) {
        //         return 1;
        //     }

        //     return 0;
        // });
    }
}
