import { Vector3, Color, AdditiveBlending, ShaderMaterial, TextureLoader, Points } from "three";
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

export class RocketExhaust extends ParticleSystemBase {

    _alphaSpline: LinearSpline;
    _colourSpline: LinearSpline;
    _sizeSpline: LinearSpline;

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
            blending: AdditiveBlending,
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
        this._sizeSpline.AddPoint(0.5, 5.0);
        this._sizeSpline.AddPoint(1.0, 1.0);

        this._UpdateGeometry();
    }

    AddParticlesGate(timeElapsed?: number) {
        const life = (Math.random() * 0.75 + 0.25) * 10.0;
        this._particles.push({
            position: new Vector3(
                (Math.random() * 2 - 1) * 1.0,
                (Math.random() * 2 - 1) * 1.0,
                (Math.random() * 2 - 1) * 1.0),
            size: (Math.random() * 0.5 + 0.5) * 4.0,
            colour: new Color(),
            alpha: 1.0,
            life: life,
            maxLife: life,
            rotation: Math.random() * 2.0 * Math.PI,
            velocity: new Vector3(0, -15, 0),
        });
    }

    UpdateParticles(timeElapsed: number): void {
        for (let p of this._particles) {
            p.life -= timeElapsed;
        }

        this._particles = this._particles.filter(p => {
            return p.life > 0.0;
        });

        for (let p of this._particles) {
            const t = 1.0 - p.life / p.maxLife;

            p.rotation += timeElapsed * 0.5;
            p.alpha = this._alphaSpline.Get(t);
            p.currentSize = p.size * this._sizeSpline.Get(t);
            p.colour.copy(this._colourSpline.Get(t));

            p.position.add(p.velocity.clone().multiplyScalar(timeElapsed));

            const drag = p.velocity.clone();
            drag.multiplyScalar(timeElapsed * 0.1);
            drag.x = Math.sign(p.velocity.x) * Math.min(Math.abs(drag.x), Math.abs(p.velocity.x));
            drag.y = Math.sign(p.velocity.y) * Math.min(Math.abs(drag.y), Math.abs(p.velocity.y));
            drag.z = Math.sign(p.velocity.z) * Math.min(Math.abs(drag.z), Math.abs(p.velocity.z));
            p.velocity.sub(drag);
        }

        this._particles.sort((a, b) => {
            const d1 = this._camera.position.distanceTo(a.position);
            const d2 = this._camera.position.distanceTo(b.position);

            if (d1 > d2) {
                return -1;
            }

            if (d1 < d2) {
                return 1;
            }

            return 0;
        });
    }
}