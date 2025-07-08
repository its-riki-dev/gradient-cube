precision mediump float;

uniform float uTime;
uniform float uDeformStrength;

varying vec2 vUv;

// Pseudo-random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
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
  vUv = uv;

  // Animate UVs using time
  vec3 pos = position;
  // Wavy distortion for animation
  float n = noise(uv * 5.0 + uTime * 0.5);
  pos.y += n * uDeformStrength;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}