import { CatmullRomCurve3, Color, DoubleSide, NormalBlending, Points, ShaderMaterial, Texture, TextureLoader } from "three";
import { LinearSpline } from "../Utilitites/LinearSpline";
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
  // gl_PointSize = size * pointMultiplier / gl_Position.w;
  gl_PointSize = 10.0;
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
}
`;

export class SplineFollower extends ParticleSystemBase {

    velocityScalar = 0.5;
    dampingFactor = 0.1;
    maxParticleLife = 10000;

    spline: CatmullRomCurve3;

    constructor(params: any, spline: CatmullRomCurve3) {

        super(params);

       const uniforms = {
            diffuseTexture: { value: undefined },
            pointMultiplier: { value: window.devicePixelRatio }
        }

        this.spline = spline;
        this.material = new ShaderMaterial({
            uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            blending: NormalBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
            side: DoubleSide,
            alphaTest: 0.01
        });


        this.points = new Points(this.geometry, this.material);

        this.emitRateSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this.emitRateSpline.addPoint(0.0, 1.0);

        this.updateGeometry();

    }

    init() {
        new TextureLoader().loadAsync(`textures/smoke.png`).then((texture: Texture) => {
            this.material.uniforms.diffuseTexture.value = texture;
            this.material.needsUpdate = true;
        }).catch((err) => {
            console.error(`${Utility.timestamp()} Could not get texture`);
        });
    }


    makeParticle(): Particle {
        const particle = new Particle();
        particle.size = 1.0;
        particle.colour = new Color(0xaaaaaa);
        particle.alpha = 1.0;
        particle.maxLife = this.maxParticleLife;
        particle.life = 0;

        const t = Math.random();
        particle.position = this.spline.getPoint(t);
        particle.velocity = this.spline.getTangent(t).multiplyScalar(this.velocityScalar);

        return particle;
    }

    updateParticles(timeElapsed: number): void {
        this.particles.forEach(p => {
            p.life += timeElapsed;
            const t = Math.min(p.life / p.maxLife, 1.0);
            p.alpha = 1.0 - t;
            p.size = 2.0 + t * 3.0;
            p.position.add(p.velocity.clone().multiplyScalar(timeElapsed * 0.001 * (1 - t) * this.dampingFactor));
        });

        this.particles = this.particles.filter(p => p.life < p.maxLife);

        this.updateGeometry();
    }
}
