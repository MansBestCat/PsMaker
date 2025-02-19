import { createNoise2D } from "simplex-noise";
import { AdditiveBlending, Color, Points, ShaderMaterial, Vector3 } from "three";
import { Data } from "../Data";
import { LinearSpline } from "../Utilitites/LinearSpline";
import { LinearSplineOut } from "../Utilitites/LinearSplineOut";
import { ParticleNoise, ParticleSystemBase } from "./ParticleSystemBase";

const _VS = `

attribute float size;
attribute float angle;
attribute vec4 colour;

varying vec4 vColour;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size  / gl_Position.w;

  vColour = colour;
}`;

const _FS = `

varying vec4 vColour;

void main() {
  gl_FragColor = vec4(vColour);
}`;

export class TwinkleStars extends ParticleSystemBase {

    alphaSpline: LinearSpline;
    colorSpline: LinearSplineOut;
    noise: Array<number>;

    constructor(params: any, public data: Data) {

        super(params);

        const uniforms = {};

        this.material = new ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            blending: AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
            name: "twinkle stars"
        });

        this.points = new Points(this.geometry, this.material);

        this.alphaSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this.alphaSpline.addPoint(0.0, 0.0);
        this.alphaSpline.addPoint(0.1, 1.0);
        this.alphaSpline.addPoint(0.6, 1.0);
        this.alphaSpline.addPoint(1.0, 0.0);

        this.colorSpline = new LinearSplineOut((t: number, a: Color, b: Color, result: Color) => {
            result.copy(a);
            return result.lerp(b, t);
        });
        this.colorSpline.addPoint(0.0, new Color(0xFFFF80));
        this.colorSpline.addPoint(1.0, new Color(0xFF8080));

        this.updateGeometry();

        this.noise = new Array();
    }

    init() {
        const N_STARS = 100;

        for (let i = 0; i < N_STARS; i++) {
            const particle = this.makeParticle();
            this.particles.push(particle);
        }

        // Make a shared noise array for the ps
        const noise2D = createNoise2D();
        const i = Math.random();
        for (let j = 0; j < 1; j += 0.00015) { // 15000 ms
            this.noise.push(Math.pow(noise2D(i, j), 3));
        }
        // After exponentiating values, re-normalize max to 1
        const max = Math.max(...this.noise);
        const scaleToOne = 1 / max;
        this.noise = this.noise.map(n => n * scaleToOne);
    }

    tick(timeElapsed: number) {
        this.updateParticles(timeElapsed);
        this.updateGeometry();
    }

    makeParticle() {
        const particle = new ParticleNoise();
        particle.position = new Vector3(0, 0, 0);
        particle.size = 30;
        particle.colour = new Color();
        particle.alpha = this.alphaSpline.get(0);
        particle.life = Math.round(Math.random() * 15);
        particle.strideScalar = Math.random() * 2.0 - 1.0;

        return particle;
    }

    updateParticles(timeElapsed: number): void {
        const color = new Color();
        (this.particles as Array<ParticleNoise>).forEach(p => {

            // increment or decrement p.life according to scalar
            p.life += Math.round(timeElapsed * p.strideScalar);

            // Wrap to clamp values between 0 and noise.length
            if (p.life > this.noise.length) {
                p.life = p.life - this.noise.length;
            } else if (p.life < 0) {
                p.life = this.noise.length + p.life;
            }

            p.alpha = this.noise[p.life];
            //p.colour.copy(this.colorSpline.getResult(t, color));
        });

    }
}