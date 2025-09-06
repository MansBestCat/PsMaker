import { createNoise2D } from "simplex-noise";
import { Color, NormalBlending, Points, ShaderMaterial, Texture, TextureLoader, Vector3 } from "three";
import { Data } from "../Data";
import { Random } from "../Random";
import { LinearSpline } from "../Utilitites/LinearSpline";
import { LinearSplineOut } from "../Utilitites/LinearSplineOut";
import { Utility } from "../Utilitites/Utility";
import { Particle, ParticleSystemBase } from "./ParticleSystemBase";



const _VS = `
uniform float pointMultiplier;

attribute float size;
attribute float angle;
attribute vec4 colour;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;

  vAngle = vec2(cos(angle), sin(angle));
  vColour = colour;
}`;

const _FS = `

uniform sampler2D diffuseTexture;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
  gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
}`;

export class SmokePlume extends ParticleSystemBase {
    maxParticleLife = 4000;

    alphaSpline: LinearSpline;
    colorSpline: LinearSplineOut;
    sizeSpline: LinearSpline;
    velocitySpline: LinearSpline;

    noise: any;


    constructor(params: any, public data: Data) {

        super(params);

        const uniforms = {
            diffuseTexture: {
                value: undefined
            },
            pointMultiplier: {
                value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
            }
        };

        this.material = new ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            blending: NormalBlending,
            depthTest: false,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
            name: "smoke puff"
        });

        this.points = new Points(this.geometry, this.material);

        this.alphaSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this.alphaSpline.addPoint(0.0, 0.98);
        this.alphaSpline.addPoint(0.12, 0.24);
        this.alphaSpline.addPoint(1.0, 0.0);

        this.colorSpline = new LinearSplineOut((t: number, a: Color, b: Color, result: Color) => {
            result.copy(a);
            return result.lerp(b, t);
        });
        this.colorSpline.addPoint(0.0, new Color(0xffffff));
        this.colorSpline.addPoint(1.0, new Color(0xffffff));

        this.sizeSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this.sizeSpline.addPoint(0.0, 3.4);
        this.sizeSpline.addPoint(1.0, 9.43);

        this.velocitySpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (a - b);
        });
        this.velocitySpline.addPoint(0.0, 9.7);
        this.velocitySpline.addPoint(0.13, 4.5);
        this.velocitySpline.addPoint(0.39, 2.25);
        this.velocitySpline.addPoint(1.0, 0.0);

        this.emitRateSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this.emitRateSpline.addPoint(0.0, 1.0);

        this.updateGeometry();
    }

    init() {
        new TextureLoader().loadAsync(`textures/smoke.png`).then((texture: Texture) => {
            this.material.uniforms.diffuseTexture.value = texture;
        }).catch((err) => {
            console.error(`${Utility.timestamp()} Could not get texture`);
        });
        this.noise = createNoise2D(Random.getRng("sdfwa4"));  // is rng param needed? Math.random() suffice?
    }

    makeParticle() {
        const SLIGHT_OFFSET = 0.0001; // Prevents passing zero arg to noise()
        const windDirection = Math.PI / 4;

        const particle = new Particle();

        particle.position = new Vector3(0, 0, 0);
        particle.size = 1.0;
        particle.colour = new Color();

        particle.alpha = this.alphaSpline.get(0);
        particle.maxLife = this.maxParticleLife;
        particle.life = 0;

        let diff: number; // [-1,1]
        const i = Date.now();
        diff = this.noise(0, i * 0.0001 + SLIGHT_OFFSET);
        //console.log(`${Utility.timestamp()} ${diff}`);
        particle.rotation = windDirection + diff * Math.PI / 7;
        particle.velocity = new Vector3(
            Math.cos(particle.rotation),
            0,
            Math.sin(particle.rotation)
        ).multiplyScalar(0.5);

        return particle;
    }

    updateParticles(timeElapsed: number): void {
        const V_DAMP_FACTOR = 0.1;
        const color = new Color();

        this.particles.forEach((p: Particle) => {

            p.life += timeElapsed;

            const t = Math.min(p.life / p.maxLife, 1); // t range is 0 to 1

            p.position.add(p.velocity.clone().multiplyScalar(V_DAMP_FACTOR));

            p.size = this.sizeSpline.get(t);
            p.alpha = this.alphaSpline.get(t);
            p.colour.copy(this.colorSpline.getResult(t, color));
            //p.rotation += timeElapsed * 0.5;

        });

        this.particles = this.particles.filter(p =>
            p.life < p.maxLife
        );
        //console.log(`${Utility.timestamp()} ${this.particles.length}`);
    }
}