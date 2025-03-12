// shapeDeformer.js - A modular system for 3D shape deformations

export class DeformationMode {
    constructor(name, description, defaultAmplitude = 0) {
      this.name = name;
      this.description = description;
      this.defaultAmplitude = defaultAmplitude;
      this.amplitude = defaultAmplitude;
    }
  
    // Apply this specific deformation to the given point
    // theta: angle around equator (0 to 2π)
    // phi: angle from pole to pole (0 to π)
    // Returns the radial deformation value
    applyDeformation(theta, phi) {
      // Base class doesn't deform - override in subclasses
      return 0;
    }
  
    // Reset amplitude to default value
    reset() {
      this.amplitude = this.defaultAmplitude;
    }
  }
  
  // Basic harmonic modes (original modes from the application)
  export class HarmonicMode extends DeformationMode {
    constructor(name, description, thetaFreq, phiFreq, defaultAmplitude = 0) {
      super(name, description, defaultAmplitude);
      this.thetaFreq = thetaFreq;  // Frequency around equator
      this.phiFreq = phiFreq;      // Frequency from pole to pole
    }
  
    applyDeformation(theta, phi) {
      return this.amplitude * Math.sin(this.thetaFreq * theta) * Math.sin(this.phiFreq * phi);
    }
  }
  
  // Variants for different harmonic patterns
  export class CosineHarmonicMode extends HarmonicMode {
    applyDeformation(theta, phi) {
      return this.amplitude * Math.cos(this.thetaFreq * theta) * Math.sin(this.phiFreq * phi);
    }
  }
  
  export class MixedHarmonicMode extends DeformationMode {
    constructor(name, description, defaultAmplitude = 0) {
      super(name, description, defaultAmplitude);
    }
  
    applyDeformation(theta, phi) {
      return this.amplitude * Math.sin(theta + 3 * phi) * Math.cos(2 * theta);
    }
  }
  
  // Noise-based deformation
  export class NoiseDeformation extends DeformationMode {
    constructor(name, description, defaultAmplitude = 0, scale = 1) {
      super(name, description, defaultAmplitude);
      this.scale = scale;
    }
  
    // Simple noise function (for better results, use a proper noise library)
    noise3D(x, y, z) {
      return Math.sin(x * 0.1 * this.scale) * 
             Math.cos(y * 0.1 * this.scale) * 
             Math.sin(z * 0.1 * this.scale);
    }
  
    applyDeformation(theta, phi, basePoint) {
      if (!basePoint) return 0;
      
      const {x, y, z} = basePoint;
      const noiseValue = this.noise3D(x * 10, y * 10, z * 10);
      
      return this.amplitude * noiseValue;
    }
  }
  
  // Main shape deformer class that manages all deformation modes
  export class ShapeDeformer {
    constructor(baseRadius) {
      this.baseRadius = baseRadius;
      this.modes = [];
      this.setupDefaultModes();
    }
  
    // Initialize with the standard deformation modes
    setupDefaultModes() {
      // Original three modes
      this.addMode(new HarmonicMode("Mode 1", "3 waves around equator, 2 waves pole-to-pole", 3, 2));
      this.addMode(new HarmonicMode("Mode 2", "5 waves around equator, 3 waves pole-to-pole", 5, 3));
      this.addMode(new HarmonicMode("Mode 3", "7 waves around equator, 1 wave pole-to-pole", 7, 1));
  
      // Add new modes
      this.addMode(new CosineHarmonicMode("Pinch", "Pinching effect along longitude lines", 4, 4));
      this.addMode(new HarmonicMode("Ripple", "Radial ripple effect from poles", 0, 3));
      this.addMode(new MixedHarmonicMode("Twisted", "Twisted torus-like deformation"));
      this.addMode(new NoiseDeformation("Noise", "Organic, natural-looking irregularities"));
    }
  
    // Add a new deformation mode
    addMode(mode) {
      this.modes.push(mode);
      return this.modes.length - 1; // Return index of the newly added mode
    }
  
    // Remove a mode by index
    removeMode(index) {
      if (index >= 0 && index < this.modes.length) {
        this.modes.splice(index, 1);
        return true;
      }
      return false;
    }
  
    // Set amplitude for a specific mode
    setAmplitude(index, value) {
      if (index >= 0 && index < this.modes.length) {
        this.modes[index].amplitude = value;
        return true;
      }
      return false;
    }
  
    // Apply all deformations to create a deformed sphere
    createDeformedSphere(numPointsTheta, numPointsPhi) {
      const points = [];
      
      for (let j = 0; j <= numPointsPhi; j++) {
        const phi = j * Math.PI / numPointsPhi;
        const row = [];
        
        for (let i = 0; i <= numPointsTheta; i++) {
          const theta = i * 2 * Math.PI / numPointsTheta;
          
          // Generate the base point coordinates (normalized)
          const baseX = Math.sin(phi) * Math.cos(theta);
          const baseY = Math.sin(phi) * Math.sin(theta);
          const baseZ = Math.cos(phi);
          const basePoint = { x: baseX, y: baseY, z: baseZ };
          
          // Apply deformation from all active modes
          let totalDeformation = 0;
          for (const mode of this.modes) {
            totalDeformation += mode.applyDeformation(theta, phi, basePoint);
          }
          
          // Calculate final radius and position
          const r = this.baseRadius + totalDeformation;
          const x = r * baseX;
          const y = r * baseY;
          const z = r * baseZ;
          
          row.push({ x, y, z });
        }
        points.push(row);
      }
      
      return points;
    }
  
    // Get array of all mode names for UI
    getModeNames() {
      return this.modes.map(mode => mode.name);
    }
  
    // Get more detailed mode info for UI display
    getModeInfo() {
      return this.modes.map(mode => ({
        name: mode.name,
        description: mode.description,
        amplitude: mode.amplitude,
        defaultAmplitude: mode.defaultAmplitude
      }));
    }
  
    // Apply a preset configuration
    applyPreset(presetConfig) {
      for (let i = 0; i < this.modes.length && i < presetConfig.amplitudes.length; i++) {
        this.modes[i].amplitude = presetConfig.amplitudes[i];
      }
    }
  
    // Get current configuration as a preset
    getCurrentPreset(name = "Custom") {
      return {
        name: name,
        amplitudes: this.modes.map(mode => mode.amplitude)
      };
    }
  }
  
  // Preset configurations for standard shapes
  export const presetConfigurations = {
    'sphere': {
      name: 'Sphere',
      amplitudes: [0, 0, 0, 0, 0, 0, 0]
    },
    'star': {
      name: 'Star',
      amplitudes: [30, 0, 0, 0, 0, 0, 0]
    },
    'rippled': {
      name: 'Rippled',
      amplitudes: [0, 20, 10, 0, 0, 0, 0]
    },
    'twisted': {
      name: 'Twisted',
      amplitudes: [0, 0, 0, 0, 0, 5, 0]
    },
    'noisy': {
      name: 'Noisy',
      amplitudes: [0, 0, 0, 0, 0, 0, 8]
    }
  };