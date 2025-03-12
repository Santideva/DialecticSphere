// Renderer module for handling all 3D rendering operations
export class Renderer {
    constructor(canvas, shapeDeformer, config = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.shapeDeformer = shapeDeformer;
      
      // Configure light direction with defaults
      this.lightDir = config.lightDir || { x: 0.5, y: -0.5, z: 0.7 };
      this.normalizeLightDirection();
      
      // Bind context for methods that might be called externally
      this.resizeCanvas = this.resizeCanvas.bind(this);
      
      // Set up the resize listener if auto-resize is enabled (default true)
      if (config.autoResize !== false) {
        window.addEventListener('resize', this.resizeCanvas);
        this.resizeCanvas();
      }
    }
    
    // Resize the canvas to match the window dimensions
    resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    
    // Normalize the light direction vector
    normalizeLightDirection() {
      const lightLength = Math.sqrt(
        this.lightDir.x ** 2 + 
        this.lightDir.y ** 2 + 
        this.lightDir.z ** 2
      );
      
      this.lightDir.x /= lightLength;
      this.lightDir.y /= lightLength;
      this.lightDir.z /= lightLength;
    }
    
    // Update light direction with a new vector
    setLightDirection(x, y, z) {
      this.lightDir = { x, y, z };
      this.normalizeLightDirection();
    }
    
    // Rotate a 3D point around X and Y axes
    rotatePoint(point, angleX, angleY) {
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
    
    // Project a 3D point onto the 2D canvas with perspective
    projectPoint(point, depth) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const depthFactor = depth / 1000;
      const scale = 1 + point.z * depthFactor;
      const x2d = centerX + point.x / scale;
      const y2d = centerY + point.y / scale;
      return { x: x2d, y: y2d, z: point.z };
    }
    
    // Calculate the normal vector for a triangle
    calculateNormal(p1, p2, p3) {
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
    
    // Calculate lighting color based on normal and light direction
    calculateLighting(normal) {
      const dot = normal.x * this.lightDir.x + normal.y * this.lightDir.y + normal.z * this.lightDir.z;
      const intensity = Math.max(0.1, dot);
      const blue = Math.floor(120 + 135 * intensity);
      const green = Math.floor(120 * intensity);
      const red = Math.floor(40 * intensity);
      return `rgb(${red}, ${green}, ${blue})`;
    }
    
    // Main drawing function to render the shape
    draw(rotX, camAngle, depth, numPointsTheta, numPointsPhi) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Use the ShapeDeformer to create sphere points
      const spherePoints = this.shapeDeformer.createDeformedSphere(numPointsTheta, numPointsPhi);
      const triangles = [];
      
      // Build triangles from the grid of sphere points
      for (let j = 0; j < spherePoints.length - 1; j++) {
        for (let i = 0; i < spherePoints[j].length - 1; i++) {
          const p1 = this.rotatePoint(spherePoints[j][i], rotX, camAngle);
          const p2 = this.rotatePoint(spherePoints[j][i + 1], rotX, camAngle);
          const p3 = this.rotatePoint(spherePoints[j + 1][i], rotX, camAngle);
          const p4 = this.rotatePoint(spherePoints[j + 1][i + 1], rotX, camAngle);
          
          const p1_2d = this.projectPoint(p1, depth);
          const p2_2d = this.projectPoint(p2, depth);
          const p3_2d = this.projectPoint(p3, depth);
          const p4_2d = this.projectPoint(p4, depth);
          
          const normal1 = this.calculateNormal(p1, p2, p3);
          const normal2 = this.calculateNormal(p2, p4, p3);
          
          // Backface culling: only draw triangles facing the camera
          if (normal1.z < 0) {
            const color1 = this.calculateLighting(normal1);
            const avgZ1 = (p1.z + p2.z + p3.z) / 3;
            triangles.push({ points: [p1_2d, p2_2d, p3_2d], color: color1, avgZ: avgZ1 });
          }
          if (normal2.z < 0) {
            const color2 = this.calculateLighting(normal2);
            const avgZ2 = (p2.z + p3.z + p4.z) / 3;
            triangles.push({ points: [p2_2d, p4_2d, p3_2d], color: color2, avgZ: avgZ2 });
          }
        }
      }
      
      // Painter's algorithm: sort triangles back to front
      triangles.sort((a, b) => a.avgZ - b.avgZ);
      
      // Draw the triangles
      for (const tri of triangles) {
        this.ctx.beginPath();
        this.ctx.moveTo(tri.points[0].x, tri.points[0].y);
        this.ctx.lineTo(tri.points[1].x, tri.points[1].y);
        this.ctx.lineTo(tri.points[2].x, tri.points[2].y);
        this.ctx.closePath();
        this.ctx.fillStyle = tri.color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();
      }
    }
    
    // Clean up method to remove event listeners
    dispose() {
      window.removeEventListener('resize', this.resizeCanvas);
    }
  }