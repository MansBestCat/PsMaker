import { AdditiveBlending, Color, Points, ShaderMaterial, Vector3 } from "three";
import { Data } from "../Data";
import { LinearSpline } from "../Utilitites/LinearSpline";
import { LinearSplineOut } from "../Utilitites/LinearSplineOut";
import { Particle, ParticleSystemBase } from "./ParticleSystemBase";

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
        this.alphaSpline.addPoint(1.0, 0.0);

        this.colorSpline = new LinearSplineOut((t: number, a: Color, b: Color, result: Color) => {
            result.copy(a);
            return result.lerp(b, t);
        });
        this.colorSpline.addPoint(0.0, new Color(0xFFFF80));
        this.colorSpline.addPoint(1.0, new Color(0xFF8080));

        this.updateGeometry();

    }

    init() {
        // This ps pushes all particles in advance.
        // After init, the array is final, no particles are added or removed.
        const N_PARTICLES = 100;

        for (let i = 0; i < N_PARTICLES; i++) {
            const particle = this.makeParticle();
            this.particles.push(particle);
        }
    }

    tick(timeElapsed: number) {
        this.updateParticles(timeElapsed);
        this.updateGeometry();
    }

    makeParticle() {
        const particle = new Particle();
        particle.position = new Vector3(0, 0, 0);
        particle.size = 30;
        particle.colour = new Color();
        particle.alpha = this.alphaSpline.get(0);
        particle.life = -1;
        particle.maxLife = 2000;
        particle.tScalar = Math.random() + 0.5; // 0.5-1.5

        return particle;
    }

    updateParticles(timeElapsed: number): void {
        const color = new Color();

        this.particles.forEach(p => {

            // Give each particle a chance to activate
            if (p.life === -1 && Math.random() > 0.95) {
                p.life = 0;
                return; // that's it for this particle this iteration
            }

            // increment life according to scalar
            p.life += Math.round(timeElapsed * p.tScalar);

            if (p.life >= p.maxLife) {
                // particle is done animating, deactivate it
                p.life = -1;
                return; // that's it for this particle this iteration
            }

            p.alpha = this.alphaSpline.get(p.life / p.maxLife);
            //p.colour.copy(this.colorSpline.getResult(t, color));
        });

    }
}