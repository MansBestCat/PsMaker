import { AdditiveBlending, Color, Points, ShaderMaterial, Vector3 } from "three";
import { Data } from "../Data";
import { LinearSpline } from "../Utilitites/LinearSpline";
import { LinearSplineOut } from "../Utilitites/LinearSplineOut";
import { Particle, ParticleSystemBase } from "./ParticleSystemBase";


const _VS = `

attribute float size;
attribute float angle;
attribute vec4 colour;


void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size  / gl_Position.w;

}`;

const _FS = `


void main() {
  gl_FragColor = vec4(1.0,1.0,1.0,1.0);
}`;

export class SparkFountain extends ParticleSystemBase {
    maxParticleLife = 1000; // ms
    initialVelocity = 15;

    alphaSpline: LinearSpline;
    colorSpline: LinearSplineOut;
    emitRateSpline: LinearSpline;

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
            name: "spark fountain"
        });

        this.points = new Points(this.geometry, this.material);

        params.parent.add(this.points);

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

        this.emitRateSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this.emitRateSpline.addPoint(0.0, 10.0);
        this.emitRateSpline.addPoint(0.1, 2.0);
        this.emitRateSpline.addPoint(1.0, 0);

        this.updateGeometry();
    }

    addParticle(): void {
        const particle = new Particle();
        particle.position = new Vector3(0, 0, 0);
        particle.size = 1;
        particle.colour = new Color();
        particle.alpha = this.alphaSpline.get(0);
        particle.maxLife = Math.random() * this.maxParticleLife;
        particle.life = 0;
        particle.rotation = Math.random() * 2.0 * Math.PI;
        particle.velocity = new Vector3(Math.cos(particle.rotation), 0, Math.sin(particle.rotation)).multiplyScalar(Math.random() + 1);

        this.particles.push(particle);
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

        this.particles = this.particles.filter(p =>
            p.life < p.maxLife
        );
    }
}