import { Vector3, Color, AdditiveBlending, ShaderMaterial, TextureLoader, Points } from "three";
import { LinearSpline } from "../LinearSpline";
import { ParticleSystemBase } from "../ParticleSystemBase";



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

export class SparksParticleSystem extends ParticleSystemBase {

    _alphaSpline: LinearSpline;
    _colourSpline: LinearSpline;

    constructor(params: any) {
        super(params);

        const uniforms = {};

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

        document.addEventListener('keyup', (e) => this._onKeyUp(e), false);

        this._UpdateGeometry();
    }

    _AddParticles(timeElapsed?: number) {
        const life = (Math.random() * 0.75 + 0.25) * 6.0;
        this._particles.push({
            position: new Vector3(0, 0, 0),
            size: 1,
            colour: new Color(),
            alpha: 1.0,
            life: life,
            maxLife: life,
            rotation: Math.random() * 2.0 * Math.PI
        });
        this._particles.forEach(particle => {
            particle.velocity = new Vector3(Math.cos(particle.rotation), 0.01, Math.sin(particle.rotation));
        })
    }

    _UpdateParticles(timeElapsed: number): void {
        for (let p of this._particles) {
            p.life -= timeElapsed;
        }

        this._particles = this._particles.filter(p => {
            return p.life > 0.0;
        });

        for (let p of this._particles) {
            const t = 1.0 - p.life / p.maxLife; // 0 to 1

            p.alpha = this._alphaSpline.Get(t);
            p.colour.copy(this._colourSpline.Get(t));

            p.position.add(p.velocity.clone().multiplyScalar(timeElapsed * 3));
            const distance = p.position.length();
            p.position.y = Math.abs(Math.sin(distance)) * (1 - t) * 2;

        }

    }
}