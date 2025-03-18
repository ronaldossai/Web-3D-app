const setup2DSHeroModel = () => {
    // Find the hero section
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Create container for the 3D model
    const modelContainer = document.createElement('div');
    modelContainer.id = '2ds-model-container';
    modelContainer.style.position = 'absolute';
    modelContainer.style.width = '600px';
    modelContainer.style.height = '600px';
    modelContainer.style.top = '50%';
    modelContainer.style.left = '50%';
    modelContainer.style.transform = 'translate(-50%, -60%)'; // Offset slightly upwards
    modelContainer.style.zIndex = '10';
    
    // Insert the container at the top of the hero section (before hero-overlay)
    const heroOverlay = heroSection.querySelector('.hero-overlay');
    if (heroOverlay) {
      heroSection.insertBefore(modelContainer, heroOverlay);
    } else {
      heroSection.appendChild(modelContainer);
    }
    
    // Initialize Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 8);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(modelContainer.offsetWidth, modelContainer.offsetHeight);
    renderer.setClearColor(0x000000, 0);
    modelContainer.appendChild(renderer.domElement);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Create 2DS model
    const modelGroup = new THREE.Group();
    modelGroup.scale.set(0.8, 0.8, 0.8); // Scale down the entire model
    scene.add(modelGroup);
    
    // Main body - EXPANDED to make space for controls on sides
    const bodyGeometry = new THREE.BoxGeometry(7, 3, 0.3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x222222,
      shininess: 40
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    modelGroup.add(body);
    
    // Screen with shader - same size, centered in the wider body
    const screenGeometry = new THREE.PlaneGeometry(4, 2.3);
    const screenMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(512, 256) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        varying vec2 vUv;
        
        void main() {
          // Grid background
          vec2 grid = fract(vUv * vec2(20.0, 10.0) - vec2(time * 0.1, 0.0));
          float line = min(grid.x, grid.y);
          line = smoothstep(0.0, 0.05, line);
          
          // Create "CTRL+LIFE" text glow effect in center
          // Calculate distance to center area where logo would be
          vec2 center = vUv - vec2(0.5, 0.5);
          float distToCenter = length(center / vec2(0.25, 0.17));
          float logoGlow = smoothstep(1.0, 0.5, distToCenter) * 0.6;
          
          // Color scheme similar to your branding
          vec3 gridColor = mix(
            vec3(0.1, 0.1, 0.2),
            vec3(0.4, 0.2, 0.6),
            0.5 + 0.5 * sin(time)
          );
          
          // Logo colors 
          vec3 logoColor = mix(
            vec3(0.8, 0.3, 0.8), // Purple tint
            vec3(0.3, 0.6, 0.9), // Blue tint
            0.5 + 0.5 * sin(time * 2.0)
          );
          
          // Combine grid and logo glow
          vec3 finalColor = mix(gridColor * line, logoColor, logoGlow);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
    
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.z = 0.16;
    modelGroup.add(screen);
    
    // Screen bezel
    const bezelGeometry = new THREE.BoxGeometry(4.2, 2.5, 0.1);
    const bezelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
    bezel.position.z = 0.08;
    modelGroup.add(bezel);
    
    // Create D-pad - Traditional Cross Shape (3D)
    const dpadGroup = new THREE.Group();
    dpadGroup.position.set(-2.7, 0, 0.18); // Positioned on left side
    modelGroup.add(dpadGroup);

    // D-pad center (raised slightly)
    const dpadCenter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16),
    new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    dpadCenter.rotation.x = Math.PI / 2;
    dpadCenter.position.z = 0.03; // Slight elevation
    dpadGroup.add(dpadCenter);

    // D-pad cross arms
    const dpadArmGeometry = new THREE.BoxGeometry(0.75, 0.15, 0.05);
    const dpadMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

    // Horizontal arm (left-right)
    const dpadHorizontal = new THREE.Mesh(dpadArmGeometry, dpadMaterial);
    dpadGroup.add(dpadHorizontal);

    // Vertical arm (up-down)
    const dpadVertical = new THREE.Mesh(dpadArmGeometry, dpadMaterial);
    dpadVertical.rotation.z = Math.PI / 2; // Rotate to be vertical
    dpadGroup.add(dpadVertical);

    
    // ABXY buttons - MOVED to right side bezel and made 3D
    const buttonGroup = new THREE.Group();
    buttonGroup.position.set(2.7, 0.3, 0.18); // Positioned on right side
    modelGroup.add(buttonGroup);
    
    // Tangible 3D buttons with raised shapes
    const buttonData = [
      { name: 'A', color: 0xFF0000, position: [0.3, -0.3, 0] },
      { name: 'B', color: 0x00FF00, position: [0, -0.6, 0] },
      { name: 'X', color: 0x0000FF, position: [0, 0, 0] },
      { name: 'Y', color: 0xFFFF00, position: [-0.3, -0.3, 0] }
    ];
    
    buttonData.forEach(data => {
      // Create 3D button
      const button = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshPhongMaterial({ 
          color: data.color,
          shininess: 70
        })
      );
      
      // Only the top half of sphere shows above the surface
      button.position.set(data.position[0], data.position[1], data.position[2] - 0.08);
      buttonGroup.add(button);
      
      // Add button labels
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.name, 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
      });
      const labelGeometry = new THREE.PlaneGeometry(0.2, 0.2);
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(data.position[0], data.position[1], data.position[2] + 0.1);
      label.rotation.x = -Math.PI / 2;
      buttonGroup.add(label);
    });
    
    // Add shoulder buttons at the top
    [-3, 3].forEach((xPos, index) => {
        const shoulderGeometry = new THREE.BoxGeometry(1, 0.25, 0.15);
        const shoulderMaterial = new THREE.MeshPhongMaterial({
          color: 0x444444,
          shininess: 30
        });
        const shoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        shoulder.position.set(xPos, 1.5, 0.05);
        shoulder.rotation.x = -0.2;
        modelGroup.add(shoulder);
      });
    
    // Start/Select buttons
    [-0.6, 0.6].forEach((xPos, index) => {
      const btnGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
      const btnMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
      const btn = new THREE.Mesh(btnGeometry, btnMaterial);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(xPos, -1.33, 0.18);
      modelGroup.add(btn);
      
      // Label
      const labelText = index === 0 ? "SELECT" : "START";
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, 64, 16);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
      });
      const labelGeometry = new THREE.PlaneGeometry(0.4, 0.1);
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(xPos, -1.4, 0.18);
      label.rotation.x = -Math.PI / 2;
      modelGroup.add(label);
    });
    
    // Add text to display as a separate canvas texture
    const canvasSize = 512;
    const textCanvas = document.createElement('canvas');
    textCanvas.width = canvasSize;
    textCanvas.height = canvasSize / 2;
    const ctx = textCanvas.getContext('2d');
    
    // Function to draw text onto canvas - Fixed text positioning
    const updateCanvasTexture = () => {
      ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      
      // Background
      ctx.fillStyle = 'rgba(20, 20, 40, 0.3)';
      ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
      
      // Draw CTRL+ text
      ctx.font = 'bold 50px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // CTRL in white - moved further left
      ctx.fillStyle = 'white';
      ctx.fillText('CTRL', textCanvas.width / 2 - 110, textCanvas.height / 2);

      // Draw "+"" text
      ctx.fillStyle = 'white';
      ctx.fillText(' +', textCanvas.width / 2 - 20, textCanvas.height / 2);
      
      // Draw LIFE with different colored letters
      const letters = ['L', 'I', 'F', 'E'];
      const colors = ['#FF5C5C', '#5CFF5C', '#5C5CFF', '#FFFF5C'];
      
      // Increased starting offset to prevent overlap
      let xOffset = 60;
      letters.forEach((letter, i) => {
        ctx.fillStyle = colors[i];
        ctx.fillText(letter, textCanvas.width / 2 + xOffset, textCanvas.height / 2);
        xOffset += 50;
      });
      
      // Press Start text
      ctx.font = '20px "Press Start 2P", monospace';
      ctx.fillStyle = Date.now() % 1000 < 500 ? 'white' : 'rgba(255,255,255,0.2)'; // Blinking
      ctx.fillText('PRESS START', textCanvas.width / 2, textCanvas.height / 2 + 70);
      
      // Update the texture
      if (logoTexture) {
        logoTexture.needsUpdate = true;
      }
    };
    
    // Create a texture from the canvas and apply to a plane
    const logoTexture = new THREE.CanvasTexture(textCanvas);
    const logoMaterial = new THREE.MeshBasicMaterial({ 
      map: logoTexture,
      transparent: true
    });
    
    const logoGeometry = new THREE.PlaneGeometry(3.8, 2.1);
    const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
    logoMesh.position.z = 0.17;
    modelGroup.add(logoMesh);
    
    // Make the screen clickable to navigate to models page
    renderer.domElement.addEventListener('click', function(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(x, y);
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(logoMesh);
      
      if (intersects.length > 0) {
        window.location.href = 'items.html';
      }
    });
    
    // Make the model rotate based on mouse position
    document.addEventListener('mousemove', (event) => {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = (event.clientY / window.innerHeight) * 2 - 1;
      
      modelGroup.rotation.y = mouseX * 0.3;
      modelGroup.rotation.x = mouseY * 0.2;
    });
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Update shader uniforms
      screenMaterial.uniforms.time.value += 0.01;
      
      // Update canvas texture every few frames for the blinking effect
      if (Math.floor(Date.now() / 100) % 5 === 0) {
        updateCanvasTexture();
      }
      
      renderer.render(scene, camera);
    }
    
    // Initial texture update
    updateCanvasTexture();
    
    // Start animation
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      const width = modelContainer.offsetWidth;
      const height = modelContainer.offsetHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
};

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', setup2DSHeroModel);