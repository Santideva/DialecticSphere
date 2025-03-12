// cameraUI.js
// A module to handle the camera-related UI controls for the nuChladni application

/**
 * Sets up the camera UI controls
 * @param {Object} camera - The Camera instance
 * @param {Object} pathGen - The PathGenerator instance
 * @param {HTMLElement} parentElement - The parent element to append the controls to
 * @param {Object} options - Configuration options
 * @returns {Object} Object containing references to the created UI elements
 */
export function setupCameraUI(camera, pathGen, parentElement, options = {}) {
    // Default options
    const defaultOptions = {
      buttonPosition: { top: '10px', right: '10px' },
      dropdownPosition: { top: '50px', right: '10px' },
      zIndex: 101
    };
    
    // Merge options with defaults
    const config = { ...defaultOptions, ...options };
    
    // Create toggle button for camera mode
    const toggleButton = createToggleButton(camera, pathGen, config);
    parentElement.appendChild(toggleButton);
    
    return {
      toggleButton
    };
  }
  
  /**
   * Creates a toggle button to switch between manual and orbital camera modes
   * @param {Object} camera - The Camera instance
   * @param {Object} pathGen - The PathGenerator instance
   * @param {Object} config - Configuration options
   * @returns {HTMLElement} The created button element
   */
  function createToggleButton(camera, pathGen, config) {
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Camera Mode';
    
    // Apply styles
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = config.buttonPosition.top;
    toggleButton.style.right = config.buttonPosition.right;
    toggleButton.style.zIndex = config.zIndex;
    
    // Create orbital path
    const orbitalPath = pathGen.circularPath(500, { x: 0, y: 0, z: 0 }, 16);
    const rotationPath = pathGen.generateRotationPath(orbitalPath, true);
    
    // Add event listener
    toggleButton.addEventListener('click', () => {
      if (camera.mode === 'manual') {
        // Start following the orbital path (20 seconds per orbit by default)
        camera.startPath(orbitalPath, rotationPath, 20000);
      } else {
        camera.stopPath();
      }
    });
    
    return toggleButton;
  }
  
  /**
   * Sets up the orbit speed control using an existing slider
   * @param {Object} camera - The Camera instance
   * @param {HTMLElement} slider - The slider element
   * @param {HTMLElement} valueDisplay - The element to display the current value
   */
  export function setupOrbitSpeedControl(camera, slider, valueDisplay) {
    slider.addEventListener('input', () => {
      const speed = parseFloat(slider.value) / 50; // scale to a proper speed value
      if (speed > 0) {
        camera.pathDuration = 20000 / speed; // higher slider values mean faster orbit
      }
      valueDisplay.textContent = slider.value;
    });
  }