/**
 * direct-fix.js - Model selection and 3D model display script
 */

// Global variables for 3D functionality
let scene, camera, renderer, controls;
let activeModel = null;
let isWireframe = false;
let isRotating = true;
let lights = [];

// Model paths
const modelPaths = {
    laptop: 'models/soda_can_crush.glb',
    controller: 'models/soda_can_crush.glb',
    phone: 'models/soda_can_opening.glb',
    coke: 'models/soda_can_crush.glb'
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DIRECT FIX SCRIPT RUNNING');
    
    // Function to show model specs
    window.showModelSpecs = function(modelType) {
        console.log('Show specs for:', modelType);
        
        // First hide all specs
        document.querySelectorAll('[id$="-specs"]').forEach(function(el) {
            el.style.display = 'none';
        });
        
        // Then show the selected model specs
        const specsElement = document.getElementById(modelType + '-specs');
        if (specsElement) {
            console.log('Showing specs for:', modelType);
            specsElement.style.display = 'flex';
        } else {
            console.error('Specs element not found for:', modelType);
        }
        
        // Update active state on buttons
        document.querySelectorAll('.list-group-item').forEach(function(btn) {
            if (btn.getAttribute('data-model') === modelType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update title and description
        const modelInfo = {
            laptop: {
                title: "Lenovo Legion 5",
                description: "A powerful gaming laptop featuring AMD Ryzen processors and NVIDIA GeForce GTX graphics."
            },
            controller: {
                title: "Xbox Controller",
                description: "The latest Xbox wireless controller with enhanced ergonomics and improved button mapping."
            },
            phone: {
                title: "iPhone 15",
                description: "Apple's flagship smartphone featuring the A16 Bionic chip and advanced camera system."
            },
            coke: {
                title: "Coke Bottle",
                description: "The iconic Coca-Cola bottle design, a timeless companion for your gaming sessions."
            }
        };
        
        // Update title and description
        if (modelInfo[modelType]) {
            document.getElementById('model-title').textContent = modelInfo[modelType].title;
            document.getElementById('model-description').textContent = modelInfo[modelType].description;
        }
        
        // Load the 3D model
        loadModel(modelType);
    };
    
    // Find buttons and directly replace their onclick handlers
    const buttons = document.querySelectorAll('.list-group-item[data-model]');
    console.log('Found buttons:', buttons.length);
    
    buttons.forEach(function(btn) {
        const modelType = btn.getAttribute('data-model');
        console.log('Setting up button for:', modelType);
        
        // Remove all existing event listeners by cloning and replacing the element
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add direct inline onclick attribute
        newBtn.setAttribute('onclick', `window.showModelSpecs('${modelType}'); return false;`);
    });
    
    // Setup controls for the 3D renderer
    setupControlButtons();
    
    // Initialize the 3D scene
    initScene();
    
    // Load the default model (laptop)
    loadModel('laptop');
    
    console.log('DIRECT FIX COMPLETE - Model selection and 3D view initialized');
});

/**
 * Initialize the 3D scene
 */
function initScene() {
    console.log('Initializing 3D scene');
    
    // Get container element
    const container = document.getElementById('3dCanvas');
    if (!container) {
        console.error('3D Canvas element not found!');
        return;
    }
    
    // Set dimensions
    const width = container.clientWidth;
    const height = 500; // Fixed height for consistent display
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1, 5);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear container and add renderer
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading 3D Model...</p>
    `;
    container.appendChild(loadingIndicator);
    
    // Add renderer to container
    container.appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    
    // Setup lighting
    setupLighting();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

/**
 * Setup scene lighting
 */
function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);
    lights.push(mainLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-5, 3, 0);
    scene.add(fillLight);
    lights.push(fillLight);
    
    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, -2, -5);
    scene.add(rimLight);
    lights.push(rimLight);
    
    // Ground for shadows
    const groundPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.ShadowMaterial({ opacity: 0.2 })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    if (controls) controls.update();
    
    if (isRotating && activeModel) {
        activeModel.rotation.y += 0.005;
    }
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

/**
 * Handle window resize
 */
function onWindowResize() {
    const container = document.getElementById('3dCanvas');
    if (!container || !camera || !renderer) return;
    
    const width = container.clientWidth;
    const height = 500; // Keep fixed height
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

/**
 * Load 3D model
 */
function loadModel(modelType) {
    if (!modelType || !modelPaths[modelType]) {
        console.error(`Invalid model type: ${modelType}`);
        return;
    }
    
    console.log(`Loading 3D model: ${modelType}`);
    
    // Show loading indicator
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    // Remove previous model
    if (activeModel) {
        scene.remove(activeModel);
        activeModel = null;
    }
    
    // Load new model
    const loader = new THREE.GLTFLoader();
    loader.load(
        modelPaths[modelType],
        (gltf) => {
            // Success callback
            activeModel = gltf.scene;
            
            // Position and scale
            activeModel.position.set(0, 0, 0);
            activeModel.scale.set(2, 2, 2);
            activeModel.position.y = -1;
            
            // Apply shadows and materials
            activeModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    node.material.wireframe = isWireframe;
                }
            });
            
            // Add to scene
            scene.add(activeModel);
            
            // Hide loading indicator
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            console.log(`Model loaded successfully: ${modelType}`);
        },
        (xhr) => {
            // Progress callback
            const percent = (xhr.loaded / xhr.total * 100).toFixed(2);
            console.log(`Loading progress: ${percent}%`);
        },
        (error) => {
            // Error callback
            console.error('Error loading model:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    );
}

/**
 * Setup control buttons
 */
function setupControlButtons() {
    // Wireframe toggle
    const wireframeBtn = document.getElementById('toggle-wireframe');
    if (wireframeBtn) {
        wireframeBtn.onclick = function() {
            isWireframe = !isWireframe;
            if (activeModel) {
                activeModel.traverse((node) => {
                    if (node.isMesh) {
                        node.material.wireframe = isWireframe;
                    }
                });
            }
        };
    }
    
    // Rotation toggle
    const rotationBtn = document.getElementById('toggle-rotation');
    if (rotationBtn) {
        rotationBtn.onclick = function() {
            isRotating = !isRotating;
        };
    }
    
    // Camera reset
    const resetBtn = document.getElementById('reset-camera');
    if (resetBtn) {
        resetBtn.onclick = function() {
            camera.position.set(0, 1, 5);
            controls.target.set(0, 0, 0);
            controls.update();
        };
    }
    
    // Light intensity slider
    const intensitySlider = document.getElementById('light-intensity');
    if (intensitySlider) {
        intensitySlider.oninput = function() {
            const intensity = parseFloat(this.value);
            lights.forEach(light => {
                if (light) light.intensity = intensity;
            });
            
            const intensityValueEl = document.getElementById('intensity-value');
            if (intensityValueEl) {
                intensityValueEl.textContent = intensity.toFixed(1);
            }
        };
    }
    
    // Light color buttons
    const colorButtons = document.querySelectorAll('.light-color');
    colorButtons.forEach(btn => {
        btn.onclick = function() {
            const color = this.getAttribute('data-color');
            if (color) {
                lights.forEach(light => {
                    if (light) light.color.set(color);
                });
                
                colorButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }
        };
    });
} 