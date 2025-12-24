import { ShaderMaterial, DataTexture, RGBAFormat, FloatType, AdditiveBlending } from "three";

export function getPointMaterial(size: number) {
  const data = new Float32Array(4);
  const dataTexture = new DataTexture(data, 1, 1, RGBAFormat, FloatType);
  dataTexture.needsUpdate = true;

  return new ShaderMaterial({
    uniforms: {
      uPositions: { value: dataTexture },
      uTime: { value: 0 },
      uFocus: { value: 5.6 },
      uAperture: { value: 3.0 },
      uFov: { value: 45 },
      uResolution: { value: [typeof window !== 'undefined' ? window.innerWidth : 1920, typeof window !== 'undefined' ? window.innerHeight : 1080] },
    },
    vertexShader: `
      uniform sampler2D uPositions;
      uniform float uTime;
      uniform float uFocus;
      uniform float uAperture;
      uniform float uFov;
      uniform vec2 uResolution;
      
      varying float vDistance;
      varying float vSparkle;
      
      void main() {
        vec3 pos = texture2D(uPositions, uv).xyz;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        vDistance = abs(mvPosition.z);
        
        float blur = abs(vDistance - uFocus) / uAperture;
        blur = clamp(blur, 0.0, 1.0);
        
        // Sparkle effect
        float sparkle = sin(uTime * 2.0 + pos.x * 10.0 + pos.y * 8.0) * 0.5 + 0.5;
        sparkle *= sin(uTime * 1.5 + pos.z * 12.0) * 0.5 + 0.5;
        vSparkle = sparkle;
        
        float size = mix(4.0, 1.5, blur) * (1.0 + sparkle * 0.3);
        gl_PointSize = size * (uResolution.y / 900.0);
      }
    `,
    fragmentShader: `
      varying float vDistance;
      varying float vSparkle;
      
      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        
        if (dist > 0.5) discard;
        
        float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
        
        // Color dorado #FFC700
        vec3 goldCore = vec3(1.0, 0.78, 0.0);
        vec3 goldBright = vec3(1.0, 0.85, 0.2);
        
        vec3 color = mix(goldCore, goldBright, vSparkle * 0.5);
        
        float brightness = 0.6 + vSparkle * 0.4;
        color *= brightness;
        
        // Glow effect
        float glow = exp(-dist * 3.0) * 0.5;
        color += goldCore * glow;
        
        gl_FragColor = vec4(color, alpha * 0.85);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}
