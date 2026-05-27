"use client"
import React, { useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'

interface InteractiveMarker {
  id: string
  location: [number, number]
  name: string
  users: number
}

interface GlobeInteractiveProps {
  markers?: InteractiveMarker[]
  className?: string
  speed?: number
}

const defaultMarkers: InteractiveMarker[] = [
  { id: "hq",      location: [37.78,  -122.44], name: "HQ",    users: 1420 },
  { id: "eu",      location: [52.52,    13.41], name: "EU",    users:  892 },
  { id: "asia",    location: [35.68,   139.65], name: "Asia",  users: 2103 },
  { id: "latam",   location: [-23.55,  -46.63], name: "LATAM", users:  567 },
  { id: "mena",    location: [25.2,     55.27], name: "MENA",  users:  734 },
  { id: "oceania", location: [-33.87,  151.21], name: "APAC",  users:  445 },
]

export function GlobeInteractive({
  markers = defaultMarkers,
  speed = 0.003,
}: GlobeInteractiveProps) {
  const [loading, setLoading] = useState(true)

  const markersJson = JSON.stringify(markers)
  const speedVal    = speed

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100vw; height: 100vh;
      overflow: hidden;
      background: transparent;
      display: flex; align-items: center; justify-content: center;
    }
    #wrap {
      position: relative;
      width: 100vw; height: 100vw;
    }
    canvas {
      position: absolute; inset: 0;
      width: 100% !important; height: 100% !important;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 1.2s ease;
      touch-action: none;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    #label-layer {
      position: absolute; inset: 0;
      pointer-events: none;
    }
    .lbl {
      position: absolute;
      transform: translate(-50%, -100%);
      pointer-events: auto;
      cursor: pointer;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s, filter 0.3s;
    }
    .lbl-box {
      background: #1a1a2e;
      color: #fff;
      border-radius: 4px;
      padding: 4px 7px;
      font-family: monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      transition: transform 0.2s, padding 0.2s;
    }
    .lbl-box.expanded {
      padding: 5px 8px;
      transform: scale(1.05);
    }
    .lbl-users {
      font-family: system-ui, sans-serif;
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 0;
      text-transform: none;
      opacity: 0.75;
      margin-top: 2px;
    }
    .lbl-caret {
      width: 0; height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 5px solid #1a1a2e;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div id="wrap">
    <canvas id="globe"></canvas>
    <div id="label-layer"></div>
  </div>

  <!-- Inline Cobe -->
  <script>
var createGlobe = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/cobe/dist/index.esm.js
  var index_esm_exports = {};
  __export(index_esm_exports, {
    default: () => Pe
  });
  function Re(e, t, r) {
    let a = e.createShader(t);
    return e.shaderSource(a, r), e.compileShader(a), e.getShaderParameter(a, e.COMPILE_STATUS) ? a : (e.deleteShader(a), null);
  }
  function Y(e, t, r) {
    let a = Re(e, e.VERTEX_SHADER, t), o = Re(e, e.FRAGMENT_SHADER, r);
    if (!a || !o) return null;
    let i = e.createProgram();
    return e.attachShader(i, a), e.attachShader(i, o), e.linkProgram(i), e.getProgramParameter(i, e.LINK_STATUS) ? (e.deleteShader(a), e.deleteShader(o), i) : (e.deleteProgram(i), null);
  }
  function H(e, t, r) {
    let a = {};
    for (let o of r) a[o] = e.getUniformLocation(t, o);
    return a;
  }
  function Q(e, t, r) {
    let a = {};
    for (let o of r) a[o] = e.getAttribLocation(t, o);
    return a;
  }
  function Ae(e) {
    let t = {}, r = {}, a = {}, o = document.createElement("style");
    function i(t2, r2, a2, o2) {
      let i2 = t2[r2];
      i2 || (i2 = document.createElement("div"), i2.style.cssText = "position:absolute;width:1px;height:1px;pointer-events:none;anchor-name:" + a2, e.append(i2), t2[r2] = i2), i2.style.left = 100 * o2.x + "%", i2.style.top = 100 * o2.y + "%";
    }
    return document.head.append(o), { m: function(e2, r2) {
      let o2 = {};
      for (let n of e2) {
        let e3 = n.id;
        if (!e3) continue;
        let f = r2(n.location);
        o2[e3] = 1, i(t, e3, "--cobe-" + e3, f), f.visible ? a["--cobe-visible-" + e3] = "N" : delete a["--cobe-visible-" + e3];
      }
      for (let e3 in t) o2[e3] || (t[e3].remove(), delete t[e3], delete a["--cobe-visible-" + e3]);
    }, a: function(e2, t2) {
      let o2 = {};
      for (let n of e2) {
        let e3 = n.id;
        if (!e3) continue;
        let f = t2(n);
        o2[e3] = 1, i(r, e3, "--cobe-arc-" + e3, f), f.visible ? a["--cobe-visible-arc-" + e3] = "N" : delete a["--cobe-visible-arc-" + e3];
      }
      for (let e3 in r) o2[e3] || (r[e3].remove(), delete r[e3], delete a["--cobe-visible-arc-" + e3]);
    }, r: function() {
      for (let e2 in t) t[e2].remove();
      for (let e2 in r) r[e2].remove();
      o.remove();
    }, s: function() {
      let e2 = "";
      for (let t2 in a) e2 += t2 + ":" + a[t2] + ";";
      o.textContent = ":root{" + e2 + "}";
    } };
  }
  var { PI: Z, sin: le, cos: _e } = Math;
  var Be = "attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}";
  var Ce = "precision highp float;uniform vec2 t,v,s;uniform vec3 F,w;uniform vec4 n;uniform float k,x,y;uniform sampler2D z;float u;mat3 A(float a,float b){float c=cos(a),d=cos(b),e=sin(a),f=sin(b);return mat3(d,f*e,-f*c,0,c,e,f,d*-e,d*c);}vec3 B(vec3 c,out float G){c=c.xzy;float q=max(2.,floor(log2(2.236068*k*3.141593*(1.-c.z*c.z))*.72021));vec2 g=floor(pow(1.618034,q)/2.236068*vec2(1,1.618034)+.5),d=fract((g+1.)*.618034)*6.283185-3.883222,e=-2.*g,f=vec2(atan(c.y,c.x),c.z-1.),r=floor(vec2(e.y*f.x-d.y*(f.y*k+1.),-e.x*f.x+d.x*(f.y*k+1.))/(d.x*e.y-e.x*d.y));float o=3.141593;vec3 C;for(float h=0.;h<4.;h+=1.){vec2 D=vec2(mod(h,2.),floor(h*.5));float j=dot(g,r+D);if(j>k)continue;float a=j,b=0.;a>=16384.?(a-=16384.,b+=.868872):0.,a>=8192.?(a-=8192.,b+=.934436):0.,a>=4096.?(a-=4096.,b+=.467218):0.,a>=2048.?(a-=2048.,b+=.733609):0.,a>=1024.?(a-=1024.,b+=.866804):0.,a>=512.?(a-=512.,b+=.433402):0.,a>=256.?(a-=256.,b+=.216701):0.,a>=128.?(a-=128.,b+=.108351):0.,a>=64.?(a-=64.,b+=.554175):0.,a>=32.?(a-=32.,b+=.777088):0.,a>=16.?(a-=16.,b+=.888544):0.,a>=8.?(a-=8.,b+=.944272):0.,a>=4.?(a-=4.,b+=.472136):0.,a>=2.?(a-=2.,b+=.236068):0.,a>=1.?(a-=1.,b+=.618034):0.;float l=fract(b)*6.283185,i=1.-2.*j*u,m=sqrt(1.-i*i);vec3 p=vec3(cos(l)*m,sin(l)*m,i);float E=length(c-p);if(E<o)o=E,C=p;}G=o;return C.xzy;}void main(){u=1./k;vec2 c=1./t,b=(gl_FragCoord.xy*c*2.-1.)/x-v*vec2(1,-1)*c;b.x*=t.x*c.y;float a=dot(b,b),f=0.;vec4 l=vec4(0);if(a<=.64){float g;vec4 m=vec4(0);vec3 h=normalize(vec3(b,sqrt(.64-a)));mat3 o=A(s.y,s.x);float i=h.z;vec3 d=B(h*o,g);float j=asin(d.y),e=acos(-d.x/cos(j));e=d.z<0.?-e:e;float p=max(texture2D(z,vec2(e*.5/3.141593,-(j/3.141593+.5))).x,y),q=p*smoothstep(8e-3,0.,g)*pow(i,n.y)*n.x;m+=vec4(F*(mix((1.-q)*pow(i,.4),q,n.z)+.1)+pow(1.-i,4.)*w,1),l+=m*(1.+n.w)*.5,f=(1.-a)*(1.-a)*smoothstep(0.,1.,.2/(a-.64));}else{float r=sqrt(.2/(a-.64));f=smoothstep(.5,1.,r/(r+1.));}gl_FragColor=l+vec4(f*w,f);}";
  var be = "varying vec2 m;varying vec3 g;varying float h;attribute vec2 n;attribute vec3 p,w;attribute float q,x;uniform vec2 b,r;uniform float i,j,k,s;void main(){float c=cos(j),d=sin(j),e=cos(i),f=sin(i);vec3 a=p*(.8+s),l=vec3(e*a.x+f*a.z,f*d*a.x+c*a.y-e*d*a.z,-f*c*a.x+d*a.y+e*c*a.z);if(l.z<0.&&length(l.xy)<.8){gl_Position=vec4(2,2,0,1);return;}float t=b.y/b.x;vec2 y=(l.xy+n*q*2.)*vec2(t,1)*k+r*vec2(1,-1)*k/b;gl_Position=vec4(y,0,1),m=n,g=w,h=x;}";
  var ge = "precision highp float;varying vec2 m;varying vec3 g;varying float h;uniform vec3 v;void main(){if(length(m)>.25)discard;vec3 a=h>.5?g:v;gl_FragColor=vec4(a,1);}";
  var Fe = "varying vec3 i;varying float j,s,t;attribute vec2 k;attribute vec3 l,m,N;attribute float v,w,O;uniform vec2 g,x;uniform float y,z,h,A;mat3 B(float a,float b){float c=cos(a),d=cos(b),e=sin(a),f=sin(b);return mat3(d,f*e,-f*c,0,c,e,f,d*-e,d*c);}vec3 C(vec3 c,vec3 d,vec3 e,float a){float b=1.-a;return b*b*c+2.*b*a*d+a*a*e;}vec3 D(vec3 c,vec3 b,vec3 d,float a){float e=1.-a;return 2.*e*(b-c)+2.*a*(d-b);}void main(){mat3 b=B(z,y);float c=.8+A;vec3 d=l*c,e=m*c,f=l+m;float n=length(f);vec3 E=n>1e-3?f/n:vec3(0,1,0),o=E*(.8+v);float p=k.x;vec3 F=C(d,o,e,p),q=b*F,G=D(d,o,e,p),H=b*G;vec2 a=H.xy;float r=length(a);vec2 I=r>1e-3?vec2(-a.y,a.x)/r:vec2(1,0);float J=g.x/g.y;vec2 K=q.xy*vec2(1./J,1)*h+x*vec2(1,-1)*h/g,P=K+I*w*k.y*h;gl_Position=vec4(P,0,1),i=N,j=O,s=q.z,t=length(q.xy);}";
  var Le = "precision highp float;varying vec3 i;varying float j,s,t;uniform vec3 M;void main(){if(s<0.&&t<.8)discard;vec3 a=j>.5?i:M;gl_FragColor=vec4(a,1);}";
  var ee = 0.8;
  function U([e, t]) {
    let r = e * Z / 180, a = t * Z / 180 - Z, o = _e(r);
    return [-o * _e(a), le(r), o * le(a)];
  }
  var Pe = (e, t) => {
    let r = { alpha: true, stencil: false, antialias: true, depth: false, preserveDrawingBuffer: false, ...t.context }, a = e.getContext("webgl2", r), o = !!a;
    if (a || (a = e.getContext("webgl", r)), !a) return { destroy: () => {
    }, update: () => {
    } };
    let i = o ? null : a.getExtension("ANGLE_instanced_arrays"), n = t.devicePixelRatio || 1;
    e.width = t.width * n, e.height = t.height * n;
    let f = t.phi || 0, l = t.theta || 0, c = t.markers || [], s = t.arcs || [], A = t.mapSamples || 1e4, v = t.mapBrightness || 1, d = t.mapBaseBrightness || 0, g = t.baseColor || [1, 1, 1], m = t.markerColor || [1, 0.5, 0], u = t.glowColor || [1, 1, 1], h = t.arcColor || [0.3, 0.6, 1], E = t.arcWidth ?? 1, R = t.arcHeight ?? 0.2, b = t.diffuse || 1, x = t.dark || 0, y = t.opacity ?? 1, T = t.offset || [0, 0], B = t.scale || 1, p = t.markerElevation ?? 0.05, w = Y(a, Be, Ce), C = Y(a, be, ge), F = Y(a, Fe, Le);
    if (!w) return { destroy: () => {
    }, update: () => {
    } };
    let D = a.createBuffer();
    a.bindBuffer(a.ARRAY_BUFFER, D), a.bufferData(a.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), a.STATIC_DRAW);
    let _ = a.createBuffer();
    a.bindBuffer(a.ARRAY_BUFFER, _);
    let N = [];
    for (let e2 = 0; e2 <= 32; e2++) {
      let t2 = e2 / 32;
      N.push(t2, -1, t2, 1);
    }
    a.bufferData(a.ARRAY_BUFFER, new Float32Array(N), a.STATIC_DRAW);
    let k = a.createBuffer(), S = a.createBuffer(), I = H(a, w, ["t", "s", "k", "x", "v", "F", "w", "n", "y", "z"]), P = H(a, C, ["i", "j", "b", "k", "r", "v", "s"]), L = Q(a, C, ["n", "p", "q", "w", "x"]), z = H(a, F, ["y", "z", "g", "h", "x", "M", "A"]), G = Q(a, F, ["k", "l", "m", "v", "w", "N", "O"]), M = a.getAttribLocation(w, "a"), V = a.createTexture();
    a.bindTexture(a.TEXTURE_2D, V), a.texImage2D(a.TEXTURE_2D, 0, a.RGB, 1, 1, 0, a.RGB, a.UNSIGNED_BYTE, new Uint8Array([0, 0, 0])), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MIN_FILTER, a.NEAREST), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MAG_FILTER, a.NEAREST);
    let j = new Image();
    j.onload = () => {
      a.bindTexture(a.TEXTURE_2D, V), a.texImage2D(a.TEXTURE_2D, 0, a.RGB, a.RGB, a.UNSIGNED_BYTE, j), a.generateMipmap(a.TEXTURE_2D), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MIN_FILTER, a.NEAREST), a.texParameteri(a.TEXTURE_2D, a.TEXTURE_MAG_FILTER, a.NEAREST), a.activeTexture(a.TEXTURE0), a.bindTexture(a.TEXTURE_2D, V);
    }, j.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACAAQAAAADMzoqnAAAECklEQVR42u3VsW4jRRzH8d94gzfF4Q0VQaC4vBLTRTp0mze4ggfAPAE5XQEFsGNAVIjwBrmW7h7gJE+giKjyABTZE4g06LKJETdRJvtD65kdz6yduKABiW+TVfzRf2bXYxtcE/59YJCz6YdbgQF6ACSRrwYKYImmh5PbwOewlV3wlQNbAN6SEExjUOO+BU0aCSnxReHABUlK4YFQeJeUT3da8IIkZ6NGoSnFY5KsMoVzMKfECUnqxgPYRArarmUCndHwzIEaQEpg5xVdBXROl8mpAQx5dUgPiHoYAAkg5w3JABR06byGAVgcRGAz5bznj6phBQNRFwyqgdxebH6gshJAesWoFhgYpApAFoG8BIZ/fEhSox5jDjQXmV0Ar5XJfAIrALi3URVs09gHIL4XJCkLC5LH9JWiArABFCSrQjdgkBzRJ0WJeUOSNyQAfJJwUSWUBRlJQ8oGHATACGlBynnzy2kEYLNjrxouigD8BZcgOeVPqh12RtufaCN5wCPVDpvQ9lsIrqndsJtDcWqBCpf4hWN7OdWHBw58FwIaNOU/n1TpMW2DFaD48cmr4185T8NHkpUFX749pQPVdgRKC/DGoQPVeAEKv+WHvY8OOWNTPRp5kHuwSf8wzXtVBKR7YwEH9H3lQUaypUfSATOALyVNu5vZJW31Bnx98nkLfDUWJaz6ixvm+RIQRdl3kmRxxiaDoGnZW4CpPfkaQadlcPim1xOSvETQo7Lv75enVAXJ3xGUlony4KQBBWUM1NiDc6qhyS8RgQs18OCMMtPDaAUIyg0PZkRWDqs+wnKJBTDI1Js6BolegOsKmUxNDBAAKqQyMQmidhegBlLZ+wwKYdv5M/8x1khkb1cgKqP2H+MKyV5vS+whrE8DQDgAlUAoRBX056EElJCjJVACeJBZgNfVp+iCCm4RBWCgKsRxASSA9KgDhDtCiTuMyfHsKXzhC6wNAIjjWb8LKAOA2ctk3FmCOlgKFy8f1N0JJtgsxinYnVAHt4t3gPzZXSCTyCWCQmBT91QE3B5yarSN40dNHYPka4TlDhTUI8zLvl0JSL3vZn6DsCFZOeB2yROEpR68sECQQA++xIGCR2X7DwlEoLRgUrZrqlUg50S1uy43YqDcN6UFBVkhAjWiCV2Q0jgQPdplMKxvBXodcOfAwJYvgdL+1etA1YJJfBcZlQV7sO1i2gHoNiyxtQ5sBsCgWyoxCHiFFd2L5nUTCqMAqGUgsQ9f5kCcCiZgRYkMgMTd5WsB1rTzj0Em14BE4r+QxN1lCEsVur2PoF5Wbg8RJXR4djgvBgauhLywoEZQrt1KKRdVS4CdlJ8qafyP+9KIj/nE/d7kKwH9jgS72e9DV+kvfTWgct4ZyP8Byb8BPG7MaaIIkAQAAAAASUVORK5CYII=";
    let J = 0;
    function O(t2) {
      let r2 = Math.cos(l), a2 = Math.cos(f), o2 = Math.sin(l), i2 = Math.sin(f), c2 = a2 * t2[0] + i2 * t2[2], s2 = i2 * o2 * t2[0] + r2 * t2[1] - a2 * o2 * t2[2];
      return [(c2 / (e.width / e.height) * B + T[0] * B * n / e.width + 1) / 2, (-s2 * B + T[1] * B * n / e.height + 1) / 2, -i2 * r2 * t2[0] + o2 * t2[1] + a2 * r2 * t2[2] >= 0 || c2 * c2 + s2 * s2 >= 0.64];
    }
    function W(e2) {
      let t2 = U(e2), r2 = ee + p, a2 = O([t2[0] * r2, t2[1] * r2, t2[2] * r2]);
      return { x: a2[0], y: a2[1], visible: a2[2] };
    }
    function X(e2) {
      let t2 = U(e2.from), r2 = U(e2.to), a2 = [t2[0] + r2[0], t2[1] + r2[1], t2[2] + r2[2]], o2 = (a2[0] ** 2 + a2[1] ** 2 + a2[2] ** 2) ** 0.5;
      if (o2 < 1e-3) return null;
      let i2 = 0.25 * (ee + p) + 0.5 * (ee + R + p) / o2, n2 = O([a2[0] * i2, a2[1] * i2, a2[2] * i2]);
      return { x: n2[0], y: n2[1], visible: n2[2] };
    }
    function K(e2, t2, r2, n2, f2) {
      e2 < 0 || (a.enableVertexAttribArray(e2), a.vertexAttribPointer(e2, t2, a.FLOAT, false, r2, n2), o ? a.vertexAttribDivisor(e2, f2) : i && i.vertexAttribDivisorANGLE(e2, f2));
    }
    let q, Z2 = document.createElement("div");
    Z2.style.cssText = "position:relative;width:100%;height:100%", e.parentElement?.insertBefore(Z2, e), Z2.append(e);
    let $ = Ae(Z2);
    function te(t2) {
      if (t2.phi != q && (f = t2.phi), t2.theta != q && (l = t2.theta), t2.markers && (function(e2) {
        c = e2;
        let t3 = new Float32Array(8 * c.length);
        c.forEach((e3, r2) => {
          t3.set([...U(e3.location), e3.size, ...e3.color || [0, 0, 0], e3.color ? 1 : 0], 8 * r2);
        }), a.bindBuffer(a.ARRAY_BUFFER, k), a.bufferData(a.ARRAY_BUFFER, t3, a.DYNAMIC_DRAW);
      })(t2.markers), t2.arcs && (function(e2) {
        s = e2, J = s.length;
        let t3 = new Float32Array(12 * s.length);
        s.forEach((e3, r2) => {
          t3.set([...U(e3.from), ...U(e3.to), R + p, 5e-3 * E, ...e3.color || [0, 0, 0], e3.color ? 1 : 0], 12 * r2);
        }), a.bindBuffer(a.ARRAY_BUFFER, S), a.bufferData(a.ARRAY_BUFFER, t3, a.DYNAMIC_DRAW);
      })(t2.arcs), t2.width && t2.height && (e.width = t2.width * n, e.height = t2.height * n), t2.mapSamples != q && (A = t2.mapSamples), t2.mapBrightness != q && (v = t2.mapBrightness), t2.mapBaseBrightness != q && (d = t2.mapBaseBrightness), t2.baseColor != q && (g = t2.baseColor), t2.markerColor != q && (m = t2.markerColor), t2.glowColor != q && (u = t2.glowColor), t2.arcColor != q && (h = t2.arcColor), t2.arcWidth != q && (E = t2.arcWidth), t2.arcHeight != q && (R = t2.arcHeight), t2.diffuse != q && (b = t2.diffuse), t2.dark != q && (x = t2.dark), t2.opacity != q && (y = t2.opacity), t2.offset != q && (T = t2.offset), t2.scale != q && (B = t2.scale), t2.markerElevation != q && (p = t2.markerElevation), $.m(c, W), $.a(s, X), $.s(), a.viewport(0, 0, e.width, e.height), a.clearColor(0, 0, 0, 0), a.clear(a.COLOR_BUFFER_BIT), a.enable(a.BLEND), a.blendFunc(a.SRC_ALPHA, a.ONE_MINUS_SRC_ALPHA), a.useProgram(w), a.bindBuffer(a.ARRAY_BUFFER, D), a.enableVertexAttribArray(M), a.vertexAttribPointer(M, 2, a.FLOAT, false, 0, 0), o ? a.vertexAttribDivisor(M, 0) : i && i.vertexAttribDivisorANGLE(M, 0), a.uniform2f(I.t, e.width, e.height), a.uniform2f(I.s, f, l), a.uniform1f(I.k, A), a.uniform1f(I.x, B), a.uniform2f(I.v, T[0] * n, T[1] * n), a.uniform3fv(I.F, g), a.uniform3fv(I.w, u), a.uniform4f(I.n, v, b, x, y), a.uniform1f(I.y, d), a.uniform1i(I.z, 0), a.activeTexture(a.TEXTURE0), a.bindTexture(a.TEXTURE_2D, V), a.drawArrays(a.TRIANGLES, 0, 6), F && J > 0) {
        a.useProgram(F), a.bindBuffer(a.ARRAY_BUFFER, _), G.k >= 0 && (a.enableVertexAttribArray(G.k), a.vertexAttribPointer(G.k, 2, a.FLOAT, false, 0, 0), o ? a.vertexAttribDivisor(G.k, 0) : i && i.vertexAttribDivisorANGLE(G.k, 0)), a.bindBuffer(a.ARRAY_BUFFER, S);
        let t3 = 48;
        if (K(G.l, 3, t3, 0, 1), K(G.m, 3, t3, 12, 1), K(G.v, 1, t3, 24, 1), K(G.w, 1, t3, 28, 1), K(G.N, 3, t3, 32, 1), K(G.O, 1, t3, 44, 1), a.uniform1f(z.y, f), a.uniform1f(z.z, l), a.uniform2f(z.g, e.width, e.height), a.uniform1f(z.h, B), a.uniform2f(z.x, T[0] * n, T[1] * n), a.uniform3fv(z.M, h), a.uniform1f(z.A, p), o) a.drawArraysInstanced(a.TRIANGLE_STRIP, 0, 66, J);
        else if (i) i.drawArraysInstancedANGLE(a.TRIANGLE_STRIP, 0, 66, J);
        else for (let e2 = 0; e2 < J; e2++) a.drawArrays(a.TRIANGLE_STRIP, 0, 66);
      }
      if (C && c.length > 0) {
        a.useProgram(C), a.bindBuffer(a.ARRAY_BUFFER, D), L.n >= 0 && (a.enableVertexAttribArray(L.n), a.vertexAttribPointer(L.n, 2, a.FLOAT, false, 0, 0), o ? a.vertexAttribDivisor(L.n, 0) : i && i.vertexAttribDivisorANGLE(L.n, 0)), a.bindBuffer(a.ARRAY_BUFFER, k);
        let t3 = 32;
        K(L.p, 3, t3, 0, 1), K(L.q, 1, t3, 12, 1), K(L.w, 3, t3, 16, 1), K(L.x, 1, t3, 28, 1), a.uniform1f(P.i, f), a.uniform1f(P.j, l), a.uniform2f(P.b, e.width, e.height), a.uniform1f(P.k, B), a.uniform2f(P.r, T[0] * n, T[1] * n), a.uniform3fv(P.v, m), a.uniform1f(P.s, p), (function(e2) {
          if (o) a.drawArraysInstanced(a.TRIANGLES, 0, 6, e2);
          else if (i) i.drawArraysInstancedANGLE(a.TRIANGLES, 0, 6, e2);
          else for (let t4 = 0; t4 < e2; t4++) a.drawArrays(a.TRIANGLES, 0, 6);
        })(c.length);
      }
    }
    return te({ markers: c, arcs: s }), { update: te, destroy: () => {
      a.deleteBuffer(D), a.deleteBuffer(_), a.deleteBuffer(k), a.deleteBuffer(S), a.deleteProgram(w), C && a.deleteProgram(C), F && a.deleteProgram(F), $.r();
    } };
  };
  return __toCommonJS(index_esm_exports);
})();

window.createGlobe = createGlobe.default || createGlobe;
</script>

  <script>
    var MARKERS  = ${markersJson};
    var SPEED    = ${speedVal};
    var expanded = null;

    var canvas      = document.getElementById('globe');
    var labelLayer  = document.getElementById('label-layer');
    var labelEls    = {};

    /* ---------- build label DOM ---------- */
    MARKERS.forEach(function(m) {
      var wrap = document.createElement('div');
      wrap.className = 'lbl';
      wrap.id = 'lbl-' + m.id;

      var box = document.createElement('div');
      box.className = 'lbl-box';
      box.id = 'box-' + m.id;
      box.textContent = m.name;

      var caret = document.createElement('div');
      caret.className = 'lbl-caret';

      wrap.appendChild(box);
      wrap.appendChild(caret);
      labelLayer.appendChild(wrap);
      labelEls[m.id] = wrap;

      wrap.addEventListener('click', function() {
        var wasExpanded = expanded === m.id;
        expanded = wasExpanded ? null : m.id;
        updateLabelContent();
      });
    });

    function updateLabelContent() {
      MARKERS.forEach(function(m) {
        var box = document.getElementById('box-' + m.id);
        if (!box) return;
        if (expanded === m.id) {
          box.classList.add('expanded');
          if (!document.getElementById('users-' + m.id)) {
            var u = document.createElement('div');
            u.className = 'lbl-users';
            u.id = 'users-' + m.id;
            u.textContent = m.users.toLocaleString() + ' users';
            box.appendChild(u);
          }
        } else {
          box.classList.remove('expanded');
          var u = document.getElementById('users-' + m.id);
          if (u) u.remove();
        }
      });
    }

    /* ---------- math ---------- */
    function toRad(deg) { return deg * Math.PI / 180; }

    function projectMarker(location, phi, theta, aspectRatio) {
      var lat = toRad(location[0]);
      var lon = toRad(location[1]);
      var x0 = Math.cos(lat) * Math.cos(lon);
      var y0 = Math.sin(lat);
      var z0 = Math.cos(lat) * Math.sin(lon);
      var cp = Math.cos(phi),  sp = Math.sin(phi);
      var ct = Math.cos(theta), st = Math.sin(theta);
      var x1 =  cp * x0 + sp * z0;
      var y1 =  st * sp * x0 + ct * y0 - st * cp * z0;
      var z1 = -ct * sp * x0 + st * y0 + ct * cp * z0;
      var scale = 0.8;
      var px = (x1 * scale / aspectRatio + 1) / 2;
      var py = (-y1 * scale + 1) / 2;
      return { px: px, py: py, visible: z1 > 0 };
    }

    /* ---------- globe init ---------- */
    function init() {
      var size = canvas.offsetWidth;
      if (size === 0) return;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = size * dpr;
      canvas.height = size * dpr;

      var phi      = 0;
      var phiOff   = 0;
      var thetaOff = 0;
      var dragDelta  = { phi: 0, theta: 0 };
      var dragStart  = null;
      var paused     = false;
      var aspectRatio = 1; // canvas is always square

      var globe = window.createGlobe(canvas, {
        devicePixelRatio: dpr,
        width:  size * dpr,
        height: size * dpr,
        phi: 0, theta: 0.2,
        dark: 0, diffuse: 1.1,
        mapSamples: 16000, mapBrightness: 10,
        baseColor:   [1, 1, 1],
        markerColor: [0, 0, 0],
        glowColor:   [0.9, 0.9, 0.9],
        markerElevation: 0,
        markers: MARKERS.map(function(m) {
          return { location: m.location, size: 0.03 };
        }),
        arcs: [], arcColor: [0.15, 0.3, 0.55],
        arcWidth: 0.5, arcHeight: 0.25, opacity: 0.7,
      });

      function animate() {
        if (!paused) phi += SPEED;
        var totalPhi   = phi   + phiOff   + dragDelta.phi;
        var totalTheta = 0.2   + thetaOff + dragDelta.theta;

        globe.update({ phi: totalPhi, theta: totalTheta });

        var w = canvas.offsetWidth;
        var h = canvas.offsetHeight;

        MARKERS.forEach(function(m) {
          var el = labelEls[m.id];
          if (!el) return;
          var proj = projectMarker(m.location, totalPhi, totalTheta, aspectRatio);
          el.style.left         = (proj.px * w) + 'px';
          el.style.top          = (proj.py * h - 8) + 'px';
          el.style.opacity      = proj.visible ? '1' : '0';
          el.style.filter       = proj.visible ? 'none' : 'blur(4px)';
          el.style.pointerEvents = proj.visible ? 'auto' : 'none';
        });

        requestAnimationFrame(animate);
      }

      animate();
      setTimeout(function() { canvas.style.opacity = '1'; });

      /* ------ touch / pointer drag ------ */
      canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length > 0) {
          dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          paused = true;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', function(e) {
        if (dragStart && e.touches.length > 0) {
          dragDelta.phi   = (e.touches[0].clientX - dragStart.x) / 300;
          dragDelta.theta = (e.touches[0].clientY - dragStart.y) / 600;
        }
      }, { passive: true });

      canvas.addEventListener('touchend', function() {
        if (dragStart) {
          phiOff   += dragDelta.phi;
          thetaOff += dragDelta.theta;
          dragDelta = { phi: 0, theta: 0 };
        }
        dragStart = null;
        paused = false;
      }, { passive: true });
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      var ro = new ResizeObserver(function(entries) {
        if (entries[0] && entries[0].contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }
  </script>
</body>
</html>`

  return (
    <View style={styles.container}>
      <WebView
        source={{ html, baseUrl: 'https://localhost' }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        underlayColor="transparent"
        backgroundColor="transparent"
        opaque={false}
        scalesPageToFit={false}
        scrollEnabled={false}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <ActivityIndicator
          size="large"
          color="#ffffff"
          style={StyleSheet.absoluteFillObject}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
})
