// Import camera module components from your camera.js file
import { Camera, CameraController, Vector3, PathGenerator } from './camera.js';
// Import the ShapeDeformer and presets
import { ShapeDeformer, presetConfigurations } from './shapeDeformer.js';

// Set up canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Get static UI controls and value displays (the ones that aren't for deformation modes)
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

// Initialize the ShapeDeformer with the same base radius
const shapeDeformer = new ShapeDeformer(baseRadius);

// Reference to the controls container
const controlsContainer = document.querySelector('.controls');

// Array to store slider references
const modeSliders = [];
const modeValues = [];

// Function to set up the UI for all deformation modes
function setupDeformationModeUI() {
  // Get existing mode sliders (first 3)
  const existingModeSliders = [
    document.getElementById('mode1'),
    document.getElementById('mode2'),
    document.getElementById('mode3')
  ];
  
  const existingModeValues = [
    document.getElementById('mode1Value'),
    document.getElementById('mode2Value'),
    document.getElementById('mode3Value')
  ];
  
  // Connect existing sliders to the first 3 modes
  for (let i = 0; i < 3; i++) {
    if (i < shapeDeformer.modes.length) {
      existingModeSliders[i].value = shapeDeformer.modes[i].amplitude;
      existingModeValues[i].textContent = existingModeSliders[i].value;
      
      // Store references
      modeSliders[i] = existingModeSliders[i];
      modeValues[i] = existingModeValues[i];
      
      // Add event listener
      existingModeSliders[i].addEventListener('input', () => {
        modeValues[i].textContent = modeSliders[i].value;
        shapeDeformer.setAmplitude(i, parseFloat(modeSliders[i].value));
      });
    }
  }
  
  // Create new sliders for additional modes (after mode3)
  for (let i = 3; i < shapeDeformer.modes.length; i++) {
    const mode = shapeDeformer.modes[i];
    
    // Create container
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    
    // Create label
    const label = document.createElement('label');
    label.textContent = `${mode.name}:`;
    label.setAttribute('for', `mode${i+1}`);
    
    // Create slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `mode${i+1}`;
    slider.min = '0';
    slider.max = '50';
    slider.value = mode.amplitude;
    slider.step = '1';
    
    // Create value display
    const valueDisplay = document.createElement('span');
    valueDisplay.id = `mode${i+1}Value`;
    valueDisplay.className = 'value-display';
    valueDisplay.textContent = slider.value;
    
    // Store references
    modeSliders[i] = slider;
    modeValues[i] = valueDisplay;
    
    // Add event listener
    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
      shapeDeformer.setAmplitude(i, parseFloat(slider.value));
    });
    
    // Append elements to container
    sliderContainer.appendChild(label);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);
    
    // Insert the new slider container before the rotX slider container
    const rotXContainer = rotXSlider.parentElement;
    controlsContainer.insertBefore(sliderContainer, rotXContainer);
  }
}

// Setup UI for all deformation modes
setupDeformationModeUI();

// Update the static slider event listeners
rotXSlider.addEventListener('input', () => { 
  rotXValue.textContent = rotXSlider.value; 
});

depthSlider.addEventListener('input', () => { 
  depthValue.textContent = depthSlider.value; 
});

// Create and configure the camera from camera.js
const camera = new Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.setPosition(0, 0, 500); // Place camera well outside the sphere
camera.lookAt(0, 0, 0);
const cameraController = new CameraController(camera, canvas);

// Use the PathGenerator to create a simple circular orbital path around the center
const pathGen = new PathGenerator();
const orbitalPath = pathGen.circularPath(500, new Vector3(0, 0, 0), 16);
const rotationPath = pathGen.generateRotationPath(orbitalPath, true);

// Repurpose the rotY slider to control the orbit speed
rotYSlider.addEventListener('input', () => {
  const speed = parseFloat(rotYSlider.value) / 50; // scale to a proper speed value
  if (speed > 0) {
    camera.pathDuration = 20000 / speed; // higher slider values mean faster orbit
  }
  rotYValue.textContent = rotYSlider.value;
});

// Define a light direction (normalized)
const lightDir = { x: 0.5, y: -0.5, z: 0.7 };
const lightLength = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
lightDir.x /= lightLength;
lightDir.y /= lightLength;
lightDir.z /= lightLength;

// A rotation function that applies a manual X rotation and a Y rotation derived from the camera
function rotatePoint(point, angleX, angleY) {
  const radX = (angleX / 100) * Math.PI;
  const radY = (angleY / 100) * Math.PI;
  
  let { x, y, z } = point;
  
  // Rotate around the X axis
  const y1 = y * Math.cos(radX) - z * Math.sin(radX);
  const z1 = y * Math.sin(radX) + z * Math.cos(radX);
  y = y1;
  z = z1;
  
  // Rotate around the Y axis (camera-derived)
  const x2 = x * Math.cos(radY) + z * Math.sin(radY);
  const z2 = -x * Math.sin(radY) + z * Math.cos(radY);
  x = x2;
  z = z2;
  
  return { x, y, z };
}

// Compute lighting based on a given normal vector
function calculateLighting(normal) {
  const dot = normal.x * lightDir.x + normal.y * lightDir.y + normal.z * lightDir.z;
  const intensity = Math.max(0.1, dot);
  const blue = Math.floor(120 + 135 * intensity);
  const green = Math.floor(120 * intensity);
  const red = Math.floor(40 * intensity);
  return `rgb(${red}, ${green}, ${blue})`;
}

// Calculate the normal vector for a triangle defined by three 3D points
function calculateNormal(p1, p2, p3) {
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
  const v2 = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };
  const normal = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  };
  const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
  normal.x /= length;
  normal.y /= length;
  normal.z /= length;
  return normal;
}

// Simple perspective projection from 3D to 2D canvas space
function projectPoint(point, depth) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const depthFactor = depth / 1000;
  const scale = 1 + point.z * depthFactor;
  const x2d = centerX + point.x / scale;
  const y2d = centerY + point.y / scale;
  return { x: x2d, y: y2d, z: point.z };
}

// Render the deformed sphere by converting its grid into triangles
function drawShape(rotX, camAngle, depth) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Use the ShapeDeformer to create sphere points
  const spherePoints = shapeDeformer.createDeformedSphere(numPointsTheta, numPointsPhi);
  const triangles = [];
  
  // Build triangles from the grid of sphere points
  for (let j = 0; j < spherePoints.length - 1; j++) {
    for (let i = 0; i < spherePoints[j].length - 1; i++) {
      const p1 = rotatePoint(spherePoints[j][i], rotX, camAngle);
      const p2 = rotatePoint(spherePoints[j][i + 1], rotX, camAngle);
      const p3 = rotatePoint(spherePoints[j + 1][i], rotX, camAngle);
      const p4 = rotatePoint(spherePoints[j + 1][i + 1], rotX, camAngle);
      
      const p1_2d = projectPoint(p1, depth);
      const p2_2d = projectPoint(p2, depth);
      const p3_2d = projectPoint(p3, depth);
      const p4_2d = projectPoint(p4, depth);
      
      const normal1 = calculateNormal(p1, p2, p3);
      const normal2 = calculateNormal(p2, p4, p3);
      
      // Backface culling: only draw triangles facing the camera
      if (normal1.z < 0) {
        const color1 = calculateLighting(normal1);
        const avgZ1 = (p1.z + p2.z + p3.z) / 3;
        triangles.push({ points: [p1_2d, p2_2d, p3_2d], color: color1, avgZ: avgZ1 });
      }
      if (normal2.z < 0) {
        const color2 = calculateLighting(normal2);
        const avgZ2 = (p2.z + p3.z + p4.z) / 3;
        triangles.push({ points: [p2_2d, p4_2d, p3_2d], color: color2, avgZ: avgZ2 });
      }
    }
  }
  
  // Painter's algorithm: sort triangles back to front
  triangles.sort((a, b) => a.avgZ - b.avgZ);
  
  // Draw the triangles
  for (const tri of triangles) {
    ctx.beginPath();
    ctx.moveTo(tri.points[0].x, tri.points[0].y);
    ctx.lineTo(tri.points[1].x, tri.points[1].y);
    ctx.lineTo(tri.points[2].x, tri.points[2].y);
    ctx.closePath();
    ctx.fillStyle = tri.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.stroke();
  }
}

// Calculate an effective Y-rotation angle from the camera position.
// This is used in place of a manual Y rotation.
function calculateAngleFromCamera(camera) {
  const camX = camera.position.x;
  const camZ = camera.position.z;
  return Math.atan2(camX, camZ) * (100 / Math.PI);
}

// Add a toggle button to switch between manual and orbital camera modes.
const toggleButton = document.createElement('button');
toggleButton.textContent = 'Toggle Camera Mode';
// Apply inline styles directly:
toggleButton.style.position = 'absolute';
toggleButton.style.top = '10px';
toggleButton.style.right = '10px'; // or 'left: 10px'
toggleButton.style.zIndex = '101'; // higher than canvas and other elements
document.body.appendChild(toggleButton);
toggleButton.addEventListener('click', () => {
  if (camera.mode === 'manual') {
    // Start following the orbital path (20 seconds per orbit by default)
    camera.startPath(orbitalPath, rotationPath, 20000);
  } else {
    camera.stopPath();
  }
});

// Add preset selector dropdown
const presetSelector = document.createElement('select');
presetSelector.style.position = 'absolute';
presetSelector.style.top = '50px';
presetSelector.style.right = '10px';
presetSelector.style.zIndex = '101';

// Add preset options
for (const presetKey in presetConfigurations) {
  const option = document.createElement('option');
  option.value = presetKey;
  option.textContent = presetConfigurations[presetKey].name;
  presetSelector.appendChild(option);
}

// Handle preset selection change
presetSelector.addEventListener('change', () => {
  const selectedPreset = presetConfigurations[presetSelector.value];
  shapeDeformer.applyPreset(selectedPreset);
  
  // Update all slider values to match preset
  for (let i = 0; i < shapeDeformer.modes.length; i++) {
    if (modeSliders[i]) {
      modeSliders[i].value = shapeDeformer.modes[i].amplitude;
      modeValues[i].textContent = modeSliders[i].value;
    }
  }
});

document.body.appendChild(presetSelector);

// Add reset button to set all deformation modes to zero
const resetButton = document.createElement('button');
resetButton.textContent = 'Reset Deformations';
resetButton.style.position = 'absolute';
resetButton.style.top = '90px';
resetButton.style.right = '10px';
resetButton.style.zIndex = '101';
resetButton.addEventListener('click', () => {
  for (let i = 0; i < shapeDeformer.modes.length; i++) {
    shapeDeformer.setAmplitude(i, 0);
    if (modeSliders[i]) {
      modeSliders[i].value = 0;
      modeValues[i].textContent = '0';
    }
  }
});
document.body.appendChild(resetButton);

// Animation loop
let lastTime = performance.now();
function animate() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Update the camera and controller.
  cameraController.update(deltaTime / 1000); // Controller expects deltaTime in seconds
  camera.update(deltaTime);
  
  // Compute the effective rotation: use manual X slider and camera-derived Y angle.
  const rotX = parseFloat(rotXSlider.value);
  const camAngle = calculateAngleFromCamera(camera);
  const depth = parseFloat(depthSlider.value);
  
  drawShape(rotX, camAngle, depth);
  
  requestAnimationFrame(animate);
}

animate();