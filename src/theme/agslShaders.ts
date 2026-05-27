// Platform intentionally NOT imported at module level — see sqliteDb.ts for rationale.
import { Skia } from '@shopify/react-native-skia';


/**
 * AGSL Shaders Source Code
 */

export const AGSL_SHADERS = {
  /**
   * GPU Lightning Bolt Shader
   * Employs Fractal Brownian Motion (FBM) noise to trace electric pathways and pulse flicker.
   */
  lightning: `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_start;
    uniform vec2 u_end;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        // Avoid matrix rotations in basic AGSL loops to preserve low-end compatibility
        for (int i = 0; i < 4; ++i) {
            v += a * noise(p);
            p = p * 2.2 + shift;
            a *= 0.5;
        }
        return v;
    }

    vec4 main(vec2 coords) {
        vec2 uv = coords / u_resolution.xy;
        
        // Compute displacement path
        float strike = fbm(uv * 6.0 + vec2(0.0, -u_time * 3.5));
        float dist = abs(uv.x - 0.5 - strike * 0.15);
        
        // High intensity core + soft bloom gradient
        float bolt = 0.0018 / (dist * dist + 0.00008);
        float glow = 0.012 / (dist + 0.008);
        
        // Lightning flicker modulation
        float flicker = sin(u_time * 50.0) * 0.4 + 0.6;
        vec3 color = vec3(0.7, 0.82, 1.0) * (bolt + glow) * flicker;
        
        return vec4(color, clamp(color.r * 1.5, 0.0, 1.0));
    }
  `,

  /**
   * GPU Aurora Curtain Shader
   * Deforms color curtains using nested trigonometric displacement waves.
   */
  aurora: `
    uniform float u_time;
    uniform vec2 u_resolution;

    vec4 main(vec2 coords) {
        vec2 uv = coords / u_resolution.xy;
        
        // Wave deformation displacement
        float wave = sin(uv.x * 4.5 + u_time * 0.7) * 0.08 + sin(uv.x * 2.0 - u_time * 0.3) * 0.03;
        float dist = abs(uv.y - 0.45 - wave);
        
        // Double curtain structure
        float curtain1 = exp(-dist * 14.0);
        float curtain2 = exp(-dist * 5.0) * 0.25;
        
        // Vertical scanlines resembling light rays
        float verticalRay = sin(uv.x * 55.0 - u_time * 2.0) * 0.2 + 0.8;
        
        // Multi-color spectral blending
        vec3 cyan = vec3(0.08, 0.85, 0.7) * curtain1 * verticalRay;
        vec3 violet = vec3(0.55, 0.1, 0.9) * curtain2;
        vec3 combined = cyan + violet;
        
        return vec4(combined, length(combined) * 0.8);
    }
  `,

  /**
   * GPU Crepuscular God Rays Shader
   * Iterates rays outwards from a NOAA solar coordinate focus center.
   */
  godRays: `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_sun_pos;

    vec4 main(vec2 coords) {
        vec2 uv = coords / u_resolution.xy;
        vec2 delta = uv - u_sun_pos;
        float dist = length(delta);
        
        // Angular radial frequency
        float angle = atan(delta.y, delta.x);
        float rays = sin(angle * 18.0 + u_time * 0.25) * 0.5 + 0.5;
        rays += sin(angle * 6.0 - u_time * 0.08) * 0.35;
        
        // Core falloff from solar point source
        float falloff = exp(-dist * 2.2) * rays;
        
        vec3 light = vec3(1.0, 0.85, 0.6) * falloff * 0.7;
        return vec4(light, length(light) * 0.5);
    }
  `,

  /**
   * Gyro Glass Refraction & Chromatic Aberration Shader
   * Simulates dynamic light refraction through physical cards mapped to device gyroscopes.
   */
  glassRefraction: `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_gyro; // Gyroscope offset vector

    vec4 main(vec2 coords) {
        vec2 uv = coords / u_resolution.xy;
        
        // Dynamic iridescent ripple displacement
        vec2 offset = u_gyro * 0.022;
        
        float r = sin(uv.x + offset.x) * 0.5 + 0.5;
        float g = sin(uv.y + offset.y) * 0.5 + 0.5;
        float b = sin(uv.x - offset.x * 0.6) * 0.5 + 0.5;
        
        // Iridescent reflection border highlights
        vec3 iridescence = vec3(r, g, b) * 0.08 + vec3(0.04);
        
        return vec4(iridescence, 0.05);
    }
  `,
};

// Internal JSI compiled cache
const compiledShadersCache: Record<string, any> = {
  lightning: null,
  aurora: null,
  godRays: null,
  glassRefraction: null,
};

/**
 * Lazy Shader Compiler
 * Compiles shaders on-demand to safeguard fast startup
 */
export const getShader = (type: keyof typeof AGSL_SHADERS): any => {
  const platformOS: string = (() => {
    try { return require('react-native').Platform.OS; } catch { return 'native'; }
  })();
  if (platformOS !== 'web' || typeof Skia === 'undefined' || !Skia) {
    return null;
  }

  if (compiledShadersCache[type]) {

    return compiledShadersCache[type];
  }

  try {
    const compiled = Skia.RuntimeEffect.Make(AGSL_SHADERS[type]);
    if (compiled) {
      compiledShadersCache[type] = compiled;
      return compiled;
    }
  } catch (error) {
    console.error(`[Weathix Shaders] AGSL Compilation failure on type: ${type}`, error);
  }

  return null;
};
