import { createNoise2D } from 'simplex-noise';
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
        this.alphaSpline.addPoint(0.6, 1.0);
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
        const N_STARS = 322;
        for (let i = 0; i < N_STARS; i++) {
            const particle = this.makeParticle();
            this.particles.push(particle);
        }

        // initialize the noise function
        const noise2D = createNoise2D();
        // returns a value between -1 and 1
        console.log(noise2D(0.2, 0.3));
    }

    tick(timeElapsed: number) {
        this.updateParticles(timeElapsed);
        this.updateGeometry();
    }

    makeParticle() {
        const particle = new Particle();
        particle.position = new Vector3(0, 0, 0);
        particle.size = 1;
        particle.colour = new Color();
        particle.alpha = this.alphaSpline.get(0);
        particle.life = 0;
        particle.rotation = Math.random() * 2.0 * Math.PI;
        particle.velocity = new Vector3(Math.cos(particle.rotation), 0, Math.sin(particle.rotation)).multiplyScalar(Math.random() + 1);

        return particle;
    }

    updateParticles(timeElapsed: number): void {
        const color = new Color();
        this.particles.forEach((p: Particle) => {
            p.life += timeElapsed;

            const t = Math.min(p.life / p.maxLife, 1); // t range is 0 to 1

            p.alpha = this.alphaSpline.get(t);
            p.colour.copy(this.colorSpline.getResult(t, color));
            p.position.add(p.velocity.clone().multiplyScalar(timeElapsed * 0.003));
            const distance = p.position.length();
            p.position.y = Math.abs(Math.sin(distance)) * (1 - t);
        });

    }
}