// Scene, camera, and renderer
let scene, camera, renderer, controls;
let activeModel = null;
let isWireframe = false;
let isRotating = true;
let lights = [];
let currentModelType = 'laptop'; // Track the currently selected model type

// Model paths updated to match what's actually available
const modelPaths = {
    laptop: 'models/soda_can_crush.glb',  // For now, we'll use the soda can for all models
    controller: 'models/soda_can_crush.glb',
    phone: 'models/soda_can_opening.glb',
    coke: 'models/soda_can_crush.glb'
};

// Model information
const modelInfo = {
    laptop: {
        title: "Lenovo Legion 5",
        description: "A powerful gaming laptop featuring AMD Ryzen processors and NVIDIA GeForce RTX graphics."
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

// Initialize the 3D scene
function init() {
    // Get the container element and its dimensions
    const container = document.getElementById('3dCanvas');
    if (!container) {
        console.error("3D Canvas container not found!");
        return;
    }
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || 500; // Fallback height if element has no height

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear existing content before appending the renderer
    container.innerHTML = '';
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.style.display = 'none';
    loadingIndicator.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading 3D Model...</p>
    `;
    container.appendChild(loadingIndicator);
    
    // Append the renderer
    container.appendChild(renderer.domElement);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;

    // Set up lighting
    setupLighting();

    // Load the default model (laptop)
    loadModel('laptop');

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

// Set up scene lighting
function setupLighting() {
    // Clear any existing lights
    lights.forEach(light => {
        if (light && scene) {
            scene.remove(light);
        }
    });
    lights = [];

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
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

    // Ground plane for shadows
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    plane.receiveShadow = true;
    scene.add(plane);
}

// Update model information in the UI
function updateModelInfo(modelType) {
    console.log('Updating model info for:', modelType);
    
    const titleElement = document.getElementById('model-title');
    const descriptionElement = document.getElementById('model-description');
    
    if (titleElement && modelInfo[modelType]) {
        titleElement.textContent = modelInfo[modelType].title;
    }
    
    if (descriptionElement && modelInfo[modelType]) {
        descriptionElement.textContent = modelInfo[modelType].description;
    }
}

// Load 3D model
function loadModel(modelType) {
    console.log('Loading model:', modelType);
    
    if (!modelType || !modelPaths[modelType]) {
        console.error(`Invalid model type: ${modelType}`);
        return;
    }

    // Update the current model type
    currentModelType = modelType;
    
    // Update model title and description
    updateModelInfo(modelType);
    
    // Show loading indicator
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }

    // Clear previous model if it exists
    if (activeModel) {
        scene.remove(activeModel);
        activeModel = null;
    }

    // GLTF loader
    const loader = new THREE.GLTFLoader();
    const modelPath = modelPaths[modelType];

    // Load the model
    loader.load(
        modelPath,
        function (gltf) {
            // Model loaded successfully
            activeModel = gltf.scene;

            // Position and scale model appropriately
            activeModel.position.set(0, 0, 0);
            activeModel.scale.set(2, 2, 2);
            activeModel.position.y = -1;

            // Apply shadows to all meshes
            activeModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;

                    // Store original material for wireframe toggle
                    node.userData.originalMaterial = node.material.clone();

                    // Apply wireframe if it's enabled
                    if (isWireframe) {
                        node.material.wireframe = true;
                    }
                }
            });

            // Add model to scene
            scene.add(activeModel);

            // Reset camera position
            resetCamera();

            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            console.log('Model loaded successfully:', modelType);
        },
        function (xhr) {
            // Loading progress
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            // Error loading model
            console.error('Error loading model:', error);
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    );
}

// Reset camera to default position
function resetCamera() {
    if (!camera || !controls) return;
    
    camera.position.set(0, 1, 5);
    controls.target.set(0, 0, 0);
    controls.update();
}

// Handle window resize
function onWindowResize() {
    if (!camera || !renderer) return;
    
    const container = document.getElementById('3dCanvas');
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || 500;

    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight);
}

// Toggle wireframe mode
function toggleWireframe() {
    isWireframe = !isWireframe;

    if (activeModel) {
        activeModel.traverse((node) => {
            if (node.isMesh) {
                node.material.wireframe = isWireframe;
            }
        });
    }
}

// Toggle model rotation
function toggleRotation() {
    isRotating = !isRotating;
}

// Set light intensity
function setLightIntensity(intensity) {
    const intensityValue = parseFloat(intensity);
    
    lights.forEach(light => {
        if (light) {
            light.intensity = intensityValue;
        }
    });

    const intensityValueElement = document.getElementById('intensity-value');
    if (intensityValueElement) {
        intensityValueElement.textContent = intensityValue.toFixed(1);
    }
}

// Set light color
function setLightColor(color) {
    lights.forEach(light => {
        if (light) {
            light.color.set(color);
        }
    });

    // Update active state on buttons
    document.querySelectorAll('.light-color').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeColorButton = document.querySelector(`.light-color[data-color="${color}"]`);
    if (activeColorButton) {
        activeColorButton.classList.add('active');
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update controls
    if (controls) {
        controls.update();
    }

    // Rotate model if rotation is enabled
    if (isRotating && activeModel) {
        activeModel.rotation.y += 0.005;
    }

    // Render scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Document ready - Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing 3D Models Page');
    
    // Initialize 3D scene if we are on the items page
    if (document.getElementById('3dCanvas')) {
        console.log('3D Canvas found - initializing scene');
        init();
        
        // Set up model selection buttons directly
        setupModelButtons();
        
        // Set up other controls
        setupControls();
        
        // Set default light color button as active
        const defaultLightColorBtn = document.querySelector('.light-color[data-color="#ffffff"]');
        if (defaultLightColorBtn) {
            defaultLightColorBtn.classList.add('active');
        }
    }
});

// Set up model selection buttons
function setupModelButtons() {
    const modelButtons = document.querySelectorAll('.list-group-item');
    console.log('Found model buttons:', modelButtons.length);
    
    modelButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modelType = this.getAttribute('data-model');
            console.log('Model button clicked:', modelType);
            
            // Update active class
            modelButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Load the model
            if (modelType) {
                loadModel(modelType);
                
                // Update specs visibility
                updateModelSpecs(modelType);
            }
        });
    });
}

// Set up other controls (wireframe, rotation, camera, lights)
function setupControls() {
    // Wireframe toggle
    const toggleWireframeBtn = document.getElementById('toggle-wireframe');
    if (toggleWireframeBtn) {
        toggleWireframeBtn.addEventListener('click', toggleWireframe);
    }

    // Rotation toggle
    const toggleRotationBtn = document.getElementById('toggle-rotation');
    if (toggleRotationBtn) {
        toggleRotationBtn.addEventListener('click', toggleRotation);
    }

    // Camera reset
    const resetCameraBtn = document.getElementById('reset-camera');
    if (resetCameraBtn) {
        resetCameraBtn.addEventListener('click', resetCamera);
    }

    // Light intensity slider
    const lightIntensitySlider = document.getElementById('light-intensity');
    if (lightIntensitySlider) {
        lightIntensitySlider.addEventListener('input', function() {
            setLightIntensity(this.value);
        });
    }

    // Light color buttons
    document.querySelectorAll('.light-color[data-color]').forEach(btn => {
        btn.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            if (color) {
                setLightColor(color);
            }
        });
    });
}

// Update model specifications visibility
function updateModelSpecs(modelType) {
    console.log('Updating specs for model:', modelType);
    
    // Hide all specs sections
    document.querySelectorAll('[id$="-specs"]').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show current model specs
    const specsElement = document.getElementById(modelType + '-specs');
    if (specsElement) {
        console.log('Showing specs for:', modelType);
        specsElement.style.display = 'flex';
    } else {
        console.warn('Specs element not found for:', modelType);
    }
}