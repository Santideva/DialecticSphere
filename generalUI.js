// generalUI.js
// A module to handle general UI controls for the nuChladni application

/**
 * Sets up the preset selector UI
 * @param {Object} shapeDeformer - The ShapeDeformer instance
 * @param {Object} presetConfigurations - The preset configurations object
 * @param {HTMLElement} parentElement - The parent element to append the controls to
 * @param {Object} uiReferences - References to UI elements to update when presets change
 * @param {Function} updateCallback - Function to call to update UI when preset changes
 * @param {Object} options - Configuration options
 * @returns {HTMLElement} The created preset selector element
 */
export function setupPresetSelector(
    shapeDeformer, 
    presetConfigurations, 
    parentElement, 
    uiReferences, 
    updateCallback,
    options = {}
  ) {
    // Default options
    const defaultOptions = {
      position: { top: '50px', right: '10px' },
      zIndex: 101
    };
    
    // Merge options with defaults
    const config = { ...defaultOptions, ...options };
    
    // Create preset selector dropdown
    const presetSelector = document.createElement('select');
    presetSelector.style.position = 'absolute';
    presetSelector.style.top = config.position.top;
    presetSelector.style.right = config.position.right;
    presetSelector.style.zIndex = config.zIndex;
    
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
      
      // Call the update callback to update UI
      if (updateCallback) {
        updateCallback(shapeDeformer, uiReferences.modeSliders, uiReferences.modeValues);
      }
    });
    
    parentElement.appendChild(presetSelector);
    
    return presetSelector;
  }
  
  /**
   * Sets up a reset button for the deformation modes
   * @param {HTMLElement} parentElement - The parent element to append the button to
   * @param {Function} resetCallback - Function to call when reset button is clicked
   * @param {Object} callbackParams - Parameters to pass to the reset callback
   * @param {Object} options - Configuration options
   * @returns {HTMLElement} The created reset button element
   */
  export function setupResetButton(parentElement, resetCallback, callbackParams, options = {}) {
    // Default options
    const defaultOptions = {
      position: { top: '90px', right: '10px' },
      zIndex: 101,
      text: 'Reset Deformations'
    };
    
    // Merge options with defaults
    const config = { ...defaultOptions, ...options };
    
    // Create reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = config.text;
    resetButton.style.position = 'absolute';
    resetButton.style.top = config.position.top;
    resetButton.style.right = config.position.right;
    resetButton.style.zIndex = config.zIndex;
    
    // Add event listener
    resetButton.addEventListener('click', () => {
      if (resetCallback) {
        resetCallback(...callbackParams);
      }
    });
    
    parentElement.appendChild(resetButton);
    
    return resetButton;
  }