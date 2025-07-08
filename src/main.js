import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'lil-gui'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

// Canvas & Renderer
const canvas = document.getElementById('canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.setClearColor(0xffffff)

// Scene & Camera
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(3, 2, 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5))
const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(5, 5, 5)
dirLight.castShadow = true
dirLight.shadow.mapSize.set(2048, 2048)
dirLight.shadow.radius = 4
dirLight.shadow.camera.left = -5
dirLight.shadow.camera.right = 5
dirLight.shadow.camera.top = 5
dirLight.shadow.camera.bottom = -5
dirLight.shadow.camera.near = 1
dirLight.shadow.camera.far = 15
scene.add(dirLight)

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ opacity: 0.2 })
)
ground.rotation.x = -Math.PI / 2
ground.position.y = -1
ground.receiveShadow = true
scene.add(ground)

// Grid
const gridHelper = new THREE.GridHelper(10, 10, 0xaaaaaa, 0xcccccc)
gridHelper.position.y = -0.99
scene.add(gridHelper)

// Uniforms
const uniforms = {
  uTime: { value: 0.0 },
  uGradient: { value: 0.7 },
  uColorA: { value: new THREE.Color('#ff0080') },
  uColorB: { value: new THREE.Color('#000000') },
  uColorC: { value: new THREE.Color('#0000ff') },
  uColorD: { value: new THREE.Color('#ffb733') },
  uGrainStrength: { value: 0.05 },
  uDeformStrength: { value: 0.1 }
}

// Shader Material
const geometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32)
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  side: THREE.DoubleSide
})

const cube = new THREE.Mesh(geometry, material)
cube.castShadow = true
cube.position.y = 0.5
scene.add(cube)

// Custom Depth Material for Shadow Deformation
const depthMaterial = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking,
  side: THREE.DoubleSide
})

depthMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = uniforms.uTime
  shader.uniforms.uDeformStrength = uniforms.uDeformStrength

  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `
      #include <common>
      uniform float uTime;
      uniform float uDeformStrength;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

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
    `
  )

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
      vec3 transformed = position;
      float n = noise(uv * 5.0 + uTime * 0.5);
      transformed.y += n * uDeformStrength;
    `
  )
}

cube.customDepthMaterial = depthMaterial

// GUI Controls
const gui = new GUI()
const settings = {
  gradient: uniforms.uGradient.value,
  colorA: '#ff0080',
  colorB: '#000000',
  colorC: '#0000ff',
  colorD: '#ffb733',
  grainStrength: uniforms.uGrainStrength.value,
  deformStrength: uniforms.uDeformStrength.value
}

gui.add(settings, 'gradient', 0, 1, 0.01).onChange(val => uniforms.uGradient.value = val)
gui.addColor(settings, 'colorA').onChange(val => uniforms.uColorA.value.set(val))
gui.addColor(settings, 'colorB').onChange(val => uniforms.uColorB.value.set(val))
gui.addColor(settings, 'colorC').onChange(val => uniforms.uColorC.value.set(val))
gui.addColor(settings, 'colorD').onChange(val => uniforms.uColorD.value.set(val))
gui.add(settings, 'grainStrength', 0.0, 0.2, 0.001).onChange(val => uniforms.uGrainStrength.value = val)
gui.add(settings, 'deformStrength', 0.0, 1.0, 0.01).onChange(val => uniforms.uDeformStrength.value = val)

// Animate
const clock = new THREE.Clock()
let hasLoaded = false

function animate() {
  requestAnimationFrame(animate)

  const elapsedTime = clock.getElapsedTime()
  uniforms.uTime.value = elapsedTime
  cube.rotation.y = elapsedTime * 0.25

  controls.update()
  renderer.render(scene, camera)

  if (!hasLoaded) {
    hasLoaded = true
    const loader = document.getElementById('loader')
    if (loader) loader.classList.add('hidden')
  }
}
animate()

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})