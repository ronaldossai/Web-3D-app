// Scene, camera, and renderer
let scene, camera, renderer, controls;
let activeModel = null;
let isWireframe = false;
let isRotating = true;
let lights = [];

// Model paths (you'll need to create these models)
const modelPaths = {
    laptop: 'models/lenovo_legion5.glb',
    controller: 'models/xbox_controller.glb',
    phone: 'models/iphone15.glb',
    coke: 'models/coke_bottle.glb'
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
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

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

// Load 3D model
function loadModel(modelType) {
    // Clear previous model if it exists
    if (activeModel) {
        scene.remove(activeModel);
        activeModel = null;
    }

    // Show loading indicator (could be implemented as a spinner)
    console.log('Loading model: ' + modelType);

    // Update model info
    document.getElementById('model-title').textContent = modelInfo[modelType].title;
    document.getElementById('model-description').textContent = modelInfo[modelType].description;

    // Hide all specs
    document.querySelectorAll('[id$="-specs"]').forEach(el => el.style.display = 'none');
    // Show the current model specs
    document.getElementById(modelType + '-specs').style.display = 'flex';

    // GLTF loader
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        modelPaths[modelType],
        function (gltf) {
            // Model loaded successfully
            activeModel = gltf.scene;
            
            // Position and scale model appropriately
            activeModel.position.set(0, 0, 0);
            
            // Apply appropriate scaling based on model type
            if (modelType === 'laptop') {
                activeModel.scale.set(1, 1, 1);
                activeModel.position.y = -1;
            } else if (modelType === 'controller') {
                activeModel.scale.set(2, 2, 2);
            } else if (modelType === 'phone') {
                activeModel.scale.set(1.5, 1.5, 1.5);
                activeModel.position.y = -0.5;
            } else if (modelType === 'coke') {
                activeModel.scale.set(1.2, 1.2, 1.2);
                activeModel.position.y = -1.5;
            }

            // Apply shadows to all meshes
            activeModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    // Store original material for wireframe toggle
                    node.userData.originalMaterial = node.material.clone();
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
            
            console.log('Model loaded successfully');
        },
        function (xhr) {
            // Loading progress
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            // Error loading model
            console.error('Error loading model:', error);
        }
    );
}

// Reset camera to default position
function resetCamera() {
    camera.position.set(0, 1, 5);
    controls.target.set(0, 0, 0);
    controls.update();
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('3dCanvas');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
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
    lights.forEach(light => {
        light.intensity = intensity;
    });
    
    document.getElementById('intensity-value').textContent = intensity.toFixed(1);
}

// Set light color
function setLightColor(color) {
    lights.forEach(light => {
        light.color.set(color);
    });
    
    // Update active state on buttons
    document.querySelectorAll('.light-color').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`.light-color[data-color="${color}"]`).classList.add('active');
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Rotate model if rotation is enabled
    if (isRotating && activeModel) {
        activeModel.rotation.y += 0.005;
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Navigation between pages
function showPage(pageName) {
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show hero section only for home page
    document.getElementById('home-page').style.display = pageName === 'home' ? 'flex' : 'none';
    
    // Show selected content section
    if (pageName !== 'home') {
        document.getElementById(pageName + '-page').style.display = 'block';
    }
    
    // Update active navigation link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelector(`.nav-link[data-page="${pageName}"]`).classList.add('active');
}

// Document ready - Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    // Initialize 3D scene
    init();
    
    // Event listener for model selection
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.list-group-item').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Load selected model
            loadModel(this.getAttribute('data-model'));
        });
    });
    
    // Event listener for wireframe toggle
    document.getElementById('toggle-wireframe').addEventListener('click', toggleWireframe);
    
    // Event listener for rotation toggle
    document.getElementById('toggle-rotation').addEventListener('click', toggleRotation);
    
    // Event listener for camera reset
    document.getElementById('reset-camera').addEventListener('click', resetCamera);
    
    // Event listener for light intensity slider
    document.getElementById('light-intensity').addEventListener('input', function() {
        setLightIntensity(parseFloat(this.value));
    });
    
    // Event listeners for light color buttons
    document.querySelectorAll('.light-color').forEach(btn => {
        btn.addEventListener('click', function() {
            setLightColor(this.getAttribute('data-color'));
        });
    });
    
    // Event listener for navigation
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(this.getAttribute('data-page'));
        });
    });
    
    // Event listener for Explore Models button
    document.getElementById('explore-models').addEventListener('click', function() {
        showPage('models');
    });
    
    // Set default light color button as active
    document.querySelector('.light-color[data-color="#ffffff"]').classList.add('active');
});