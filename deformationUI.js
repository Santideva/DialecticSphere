// deformationUI.js
// A module to handle the dynamic deformation mode UI for the nuChladni application

/**
 * Sets up the deformation mode UI for the ShapeDeformer
 * @param {Object} shapeDeformer - The ShapeDeformer instance
 * @param {HTMLElement} containerElement - The container element for the UI controls
 * @param {Object} options - Configuration options for the UI
 * @returns {Object} Object containing references to the created UI elements
 */
export function setupDeformationUI(shapeDeformer, containerElement, options = {}) {
    // Default options
    const defaultOptions = {
      controlType: 'slider',  // Future support for different control types
      maxValue: 50,
      minValue: 0,
      step: 1
    };
    
    // Merge options with defaults
    const config = { ...defaultOptions, ...options };
    
    // Arrays to store slider references
    const modeSliders = [];
    const modeValues = [];
    
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
      
      // Create control based on configuration
      const controlElements = createControl(
        mode, 
        i, 
        config, 
        (value) => {
          shapeDeformer.setAmplitude(i, parseFloat(value));
        }
      );
      
      // Store references
      modeSliders[i] = controlElements.control;
      modeValues[i] = controlElements.valueDisplay;
      
      // Find insertion point - this should be before the rotX slider container
      const rotXSlider = document.getElementById('rotX');
      const insertBefore = rotXSlider ? rotXSlider.parentElement : null;
      
      // Append elements to container
      if (insertBefore) {
        containerElement.insertBefore(controlElements.container, insertBefore);
      } else {
        containerElement.appendChild(controlElements.container);
      }
    }
    
    return {
      modeSliders,
      modeValues
    };
  }
  
  /**
   * Creates a control element based on the configuration
   * @param {Object} mode - The mode object from ShapeDeformer
   * @param {number} index - The index of the mode
   * @param {Object} config - Configuration options
   * @param {Function} onChangeCallback - Callback function when value changes
   * @returns {Object} Object containing the container, control, and value display elements
   */
  function createControl(mode, index, config, onChangeCallback) {
    // Create container
    const container = document.createElement('div');
    container.className = 'slider-container';
    
    // Create label
    const label = document.createElement('label');
    label.textContent = `${mode.name}:`;
    label.setAttribute('for', `mode${index+1}`);
    
    // Create value display
    const valueDisplay = document.createElement('span');
    valueDisplay.id = `mode${index+1}Value`;
    valueDisplay.className = 'value-display';
    valueDisplay.textContent = mode.amplitude;
    
    let control;
    
    // Create the appropriate control based on config.controlType
    if (config.controlType === 'slider') {
      control = createSliderControl(mode, index, config, valueDisplay, onChangeCallback);
    } else {
      // Default to slider if unsupported type
      control = createSliderControl(mode, index, config, valueDisplay, onChangeCallback);
    }
    
    // Append elements to container
    container.appendChild(label);
    container.appendChild(control);
    container.appendChild(valueDisplay);
    
    return {
      container,
      control,
      valueDisplay
    };
  }
  
  /**
   * Creates a slider control
   * @param {Object} mode - The mode object from ShapeDeformer
   * @param {number} index - The index of the mode
   * @param {Object} config - Configuration options
   * @param {HTMLElement} valueDisplay - The element to display the current value
   * @param {Function} onChangeCallback - Callback function when value changes
   * @returns {HTMLElement} The created slider element
   */
  function createSliderControl(mode, index, config, valueDisplay, onChangeCallback) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `mode${index+1}`;
    slider.min = config.minValue.toString();
    slider.max = config.maxValue.toString();
    slider.value = mode.amplitude;
    slider.step = config.step.toString();
    
    // Add event listener
    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
      onChangeCallback(slider.value);
    });
    
    return slider;
  }
  
  /**
   * Updates the UI to reflect the current state of the ShapeDeformer
   * @param {Object} shapeDeformer - The ShapeDeformer instance
   * @param {Array} modeSliders - Array of slider elements
   * @param {Array} modeValues - Array of value display elements
   */
  export function updateDeformationUI(shapeDeformer, modeSliders, modeValues) {
    for (let i = 0; i < shapeDeformer.modes.length; i++) {
      if (modeSliders[i]) {
        modeSliders[i].value = shapeDeformer.modes[i].amplitude;
        modeValues[i].textContent = modeSliders[i].value;
      }
    }
  }
  
  /**
   * Resets all deformation controls to zero
   * @param {Object} shapeDeformer - The ShapeDeformer instance
   * @param {Array} modeSliders - Array of slider elements
   * @param {Array} modeValues - Array of value display elements
   */
  export function resetDeformationUI(shapeDeformer, modeSliders, modeValues) {
    for (let i = 0; i < shapeDeformer.modes.length; i++) {
      shapeDeformer.setAmplitude(i, 0);
      if (modeSliders[i]) {
        modeSliders[i].value = 0;
        modeValues[i].textContent = '0';
      }
    }
  }