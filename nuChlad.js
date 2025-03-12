// Import camera module components
import { Camera, CameraController, Vector3, PathGenerator } from './camera.js';

// Import the ShapeDeformer and presets
import { ShapeDeformer, presetConfigurations } from './shapeDeformer.js';

// Import our new Renderer module
import { Renderer } from './renderer.js';

// Import UI modules
import { setupDeformationUI, updateDeformationUI, resetDeformationUI } from './deformationUI.js';
import { setupCameraUI, setupOrbitSpeedControl } from './cameraUI.js';
import { setupPresetSelector, setupResetButton } from './generalUI.js';

// Set up canvas and context
const canvas = document.getElementById('canvas');

// Get static UI controls and value displays
const rotXSlider = document.getElementById('rotX');
const rotYSlider = document.getElementById('rotY');
const depthSlider = document.getElementById('depth');

const rotXValue = document.getElementById('rotXValue');
const rotYValue = document.getElementById('rotYValue');
const depthValue = document.getElementById('depthValue');

// Parameters for our deformable 3D sphere
const baseRadius = 200;
const numPointsTheta = 40;  // Resolution along the equator
const numPointsPhi = 20;    // Resolution from pole to pole

// Initialize the ShapeDeformer
const shapeDeformer = new ShapeDeformer(baseRadius);

// Initialize our Renderer
const renderer = new Renderer(canvas, shapeDeformer, {
  lightDir: { x: 0.5, y: -0.5, z: 0.7 }
});

// Reference to the controls container
const controlsContainer = document.querySelector('.controls');

// Set up the deformation UI
const { modeSliders, modeValues } = setupDeformationUI(shapeDeformer, controlsContainer);

// Update the static slider event listeners
rotXSlider.addEventListener('input', () => { 
  rotXValue.textContent = rotXSlider.value; 
});

depthSlider.addEventListener('input', () => { 
  depthValue.textContent = depthSlider.value; 
});

// Create and configure the camera
const camera = new Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.setPosition(0, 0, 500);
camera.lookAt(0, 0, 0);
const cameraController = new CameraController(camera, canvas);

// Create PathGenerator
const pathGen = new PathGenerator();

// Set up the camera UI
setupCameraUI(camera, pathGen, document.body);

// Set up the orbit speed control
setupOrbitSpeedControl(camera, rotYSlider, rotYValue);

// Set up the preset selector
setupPresetSelector(
  shapeDeformer, 
  presetConfigurations, 
  document.body, 
  { modeSliders, modeValues }, 
  updateDeformationUI
);

// Set up the reset button
setupResetButton(
  document.body, 
  resetDeformationUI, 
  [shapeDeformer, modeSliders, modeValues]
);

// Calculate an effective Y-rotation angle from the camera position.
function calculateAngleFromCamera(camera) {
  const camX = camera.position.x;
  const camZ = camera.position.z;
  return Math.atan2(camX, camZ) * (100 / Math.PI);
}

// Animation loop
let lastTime = performance.now();
function animate() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Update the camera and controller
  cameraController.update(deltaTime / 1000);
  camera.update(deltaTime);
  
  // Compute the effective rotation
  const rotX = parseFloat(rotXSlider.value);
  const camAngle = calculateAngleFromCamera(camera);
  const depth = parseFloat(depthSlider.value);
  
  // Use our renderer instead of directly calling drawShape
  renderer.draw(rotX, camAngle, depth, numPointsTheta, numPointsPhi);
  
  requestAnimationFrame(animate);
}

animate();