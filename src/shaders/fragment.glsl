precision mediump float;

uniform float uTime;
uniform float uGradient;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorD;
uniform float uGrainStrength;

varying vec2 vUv;

// Pseudo-random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Value noise
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

void main() {
  // Animate UVs using time
  float t = uTime * 0.2;
  vec2 uv = vUv * 3.0;

  // Wavy distortion for animation
  uv.x += sin(uv.y * 2.0 + t) * 0.3;
  uv.y += cos(uv.x * 2.0 + t) * 0.3;

  // Two animated noise layers
  float n1 = noise(uv + t);
  float n2 = noise(uv * 1.5 - t * 0.5);

  // Blend using noise
  vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 1.0, n1 * uGradient));
  col = mix(col, uColorC, smoothstep(0.0, 1.0, n2 * uGradient));
  col = mix(col, uColorD, smoothstep(0.3, 1.0, (n1 + n2) * 0.5 * uGradient));

  // Add subtle time pulse
  col = mix(col, vec3(1.0, 0.0, 0.0), 0.25 * sin(uTime));

  // Grain
  float grain = random(vUv * uTime * 60.0);
  col += uGrainStrength * (grain - 0.5);

  gl_FragColor = vec4(col, 1.0);
}