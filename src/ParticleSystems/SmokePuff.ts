import { Vector3, Color, ShaderMaterial, TextureLoader, Points, NormalBlending } from "three";
import { LinearSpline } from "../LinearSpline";
import { ParticleSystemBase } from "../ParticleSystemBase";



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

export class SmokePuff extends ParticleSystemBase {

    _alphaSpline: LinearSpline;
    _colourSpline: LinearSpline;
    _sizeSpline: LinearSpline;
    timerCounter = 0;

    constructor(params: any) {
        super(params);

        const uniforms = {
            diffuseTexture: {
                value: new TextureLoader().load('./resources/fire.png')
            },
            pointMultiplier: {
                value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
            }
        };

        this._material = new ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            blending: NormalBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        this._points = new Points(this._geometry, this._material);

        params.parent.add(this._points);

        this._alphaSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this._alphaSpline.AddPoint(0.0, 0.0);
        this._alphaSpline.AddPoint(0.1, 1.0);
        this._alphaSpline.AddPoint(0.6, 1.0);
        this._alphaSpline.AddPoint(1.0, 0.0);

        this._colourSpline = new LinearSpline((t: any, a: { clone: () => any; }, b: any) => {
            const c = a.clone();
            return c.lerp(b, t);
        });
        this._colourSpline.AddPoint(0.0, new Color(0xFFFF80));
        this._colourSpline.AddPoint(1.0, new Color(0xFF8080));

        this._sizeSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this._sizeSpline.AddPoint(0.0, 1.0);
        this._sizeSpline.AddPoint(1.0, 5.0);

        document.addEventListener('keyup', (e) => this._onKeyUp(e), false);

        this._UpdateGeometry();
    }

    _AddParticles(timeElapsed: number) {
        this.timerCounter += timeElapsed;
        if (this.timerCounter < 0.1) {
            return;
        }
        this.timerCounter = 0;
        const life = 3;
        this._particles.push({
            position: new Vector3(0, 0, 0),
            size: 2,
            colour: new Color(),
            alpha: 1.0,
            life: life,
            maxLife: life,
            rotation: Math.random() * 2.0 * Math.PI,
        });
        this._particles.forEach(particle => {
            const v = new Vector3(Math.cos(particle.rotation), 0, Math.sin(particle.rotation)).multiplyScalar(Math.random() * 3 + 1);
            particle.velocity = v;
        });
    }

    _UpdateParticles(timeElapsed: number): void {
        for (let p of this._particles) {
            p.life -= timeElapsed;
        }

        this._particles = this._particles.filter(p => {
            return p.life > 0.0;
        });

        for (let p of this._particles) {
            const t = 1.0 - p.life / p.maxLife;

            //p.rotation += timeElapsed * 0.5;
            p.alpha = this._alphaSpline.Get(t);
            p.currentSize = p.size; // * this._sizeSpline.Get(t);
            p.colour.copy(this._colourSpline.Get(t));

            p.position.add(p.velocity.clone().multiplyScalar(timeElapsed));

        }

        // this._particles.sort((a, b) => {
        //     const d1 = this._camera.position.distanceTo(a.position);
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