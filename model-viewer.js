/**
 * model-viewer.js - 3D model viewer with specification display
 */

// Global variables for 3D functionality
let scene, camera, renderer, controls;
let activeModel = null;
let isWireframe = false;
let isRotating = true;
let lights = [];
let canvasHeight = 800; // Default height for desktop
let backgroundScene, backgroundCamera, backgroundMesh;
let clock = new THREE.Clock();
let isModelLoading = false; // Flag to track if a model is currently loading
let pendingModelType = null; // Store pending model load request

// Interactive feature variables
let isExploded = false; // Track if model is in exploded view
let isAnimating = false; // Track if model is animating
let originalPositions = []; // Store original positions for explode view
let modelParts = []; // Store model parts for interaction
let currentEnvironment = 'studio'; // Current environment setting
let animationMixers = []; // Animation mixers for model animations

// Model paths
const modelPaths = {
    laptop: 'models/acer_nitro.glb',
    controller: 'models/retro_game_controller.glb',
    phone: 'models/iphone_15_white.glb',
    coke: 'models/cola-bottle.glb'
};

// Model-specific settings for proper positioning and scaling
const modelSettings = {
    laptop: { scale: 0.05, positionY: -1 },
    controller: { scale: 0.1, positionY: 0 },  // Reduced scale and centered for controller
    phone: { scale: 0.5, positionY: 1.5 },
    coke: { scale: 3, positionY: 1.5 }
};

// Model information
const modelInfo = {
    laptop: {
        title: "Acer Nitro 5",
        description: "A powerful gaming laptop featuring AMD Ryzen processors and NVIDIA GeForce GTX graphics. This bad boy not only eases his way through all of my computer science demands but is capable of delivering a smooth gaming experience. This is the machine that has guided me through my degree."
    },
    controller: {
        title: "Retro Game Controller",
        description: "We like our games oldschool, game controller with traditional D-pads and buttons. I have always been a key enjoyer of early low-poly games. As developers had to try their best to deliver the most killer immersion possible with limited hardware."
    },
    phone: {
        title: "iPhone 15",
        description: "Apple's flagship smartphone featuring the A16 Bionic chip and advanced camera system. A truly reliable companion for any gamer, developer or person in general. My trusty sidekick who was used extensively testing the sites perfomance on mobile devices."
    },
    coke: {
        title: "Coke Bottle",
        description: "The iconic Coca-Cola bottle design, a timeless companion for your gaming sessions. One of the worlds most popular soft drinks. It only made sense to add a coke model because why not."
    }
};

// Background shader uniforms
const backgroundUniforms = {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing 3D Model Viewer');
    
    // Set canvas height based on device
    setResponsiveHeight();
    
    // Create global function for model selection
    window.showModelSpecs = function(modelType) {
        console.log('Selecting model:', modelType);
        
        // Update specifications display
        updateSpecsDisplay(modelType);
        
        // Load the 3D model
        loadModel(modelType);
    };
    
    // Initialize 3D scene
    initScene();
    
    // Setup control buttons
    setupControls();
    
    // Load default model
    loadModel('laptop');
});

/**
 * Set responsive height based on device
 */
function setResponsiveHeight() {
    // Check if mobile device
    const isMobile = window.innerWidth < 768;
    
    // Adjust height accordingly
    if (isMobile) {
        canvasHeight = 400; // Smaller height for mobile
    } else if (window.innerWidth < 1200) {
        canvasHeight = 600; // Medium height for tablets/small screens
    } else {
        canvasHeight = 800; // Full height for desktops
    }
    
    // Set the height on the container
    const container = document.getElementById('3dCanvas');
    if (container) {
        container.style.height = canvasHeight + 'px';
    }
}

/**
 * Update the specifications display
 */
function updateSpecsDisplay(modelType) {
    // Hide all specification panels
    document.querySelectorAll('[id$="-specs"]').forEach(function(panel) {
        panel.style.display = 'none';
    });
    
    // Show the selected model's specifications
    const specsPanel = document.getElementById(modelType + '-specs');
    if (specsPanel) {
        specsPanel.style.display = 'flex';
    }
    
    // Update active class on model selection buttons
    document.querySelectorAll('.list-group-item').forEach(function(btn) {
        if (btn.getAttribute('data-model') === modelType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update title and description
    if (modelInfo[modelType]) {
        document.getElementById('model-title').textContent = modelInfo[modelType].title;
        document.getElementById('model-description').textContent = modelInfo[modelType].description;
    }
    
    // Hide parts selector when switching models
    const partsSelector = document.getElementById('parts-selector');
    if (partsSelector) {
        partsSelector.style.display = 'none';
    }
    
    // Reset model interaction states
    isExploded = false;
    isAnimating = false;
    
    // Reset button texts
    const explodeBtn = document.getElementById('explode-view');
    if (explodeBtn) explodeBtn.textContent = 'Explode View';
    
    const animateBtn = document.getElementById('toggle-animation');
    if (animateBtn) animateBtn.textContent = 'Animate';
}

/**
 * Create animated background with shader
 */
function createShaderBackground() {
    // Create a separate scene for the background
    backgroundScene = new THREE.Scene();
    backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Update resolution uniform
    const container = document.getElementById('3dCanvas');
    backgroundUniforms.resolution.value.x = container.clientWidth;
    backgroundUniforms.resolution.value.y = canvasHeight;
    
    // Create shader material with lower opacity to see models
    const backgroundMaterial = new THREE.ShaderMaterial({
        uniforms: backgroundUniforms,
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec2 resolution;
            varying vec2 vUv;
            
            // Function to create a smooth gradient
            vec3 gradient(vec2 uv, float time) {
                // Dark tech theme colors
                vec3 color1 = vec3(0.05, 0.05, 0.1);  // Dark blue
                vec3 color2 = vec3(0.12, 0.12, 0.2);  // Medium blue
                vec3 color3 = vec3(0.1, 0.05, 0.15);  // Dark purple
                
                // Moving gradients
                float noise1 = sin(uv.x * 2.0 + time * 0.2) * sin(uv.y * 2.0 + time * 0.3) * 0.5 + 0.5;
                float noise2 = sin(uv.x * 3.0 - time * 0.1) * sin(uv.y * 3.0 + time * 0.2) * 0.5 + 0.5;
                
                // Mix colors based on noise and position
                vec3 mixedColor = mix(color1, color2, noise1);
                mixedColor = mix(mixedColor, color3, noise2 * uv.y);
                
                // Add subtle vignette effect
                float vignette = 1.0 - length(uv * 2.0 - 1.0);
                vignette = smoothstep(0.0, 0.5, vignette);
                
                return mixedColor * (0.8 + vignette * 0.2);
            }
            
            // Function to create subtle moving highlights
            float highlights(vec2 uv, float time) {
                float pattern = 0.0;
                
                // Create a grid pattern with time-based movement
                for (int i = 0; i < 2; i++) {
                    float t = time * (0.05 + float(i) * 0.01);
                    vec2 pos = uv * (3.0 + float(i) * 2.0);
                    pos.x += sin(time * 0.2) * 0.5;
                    pos.y += cos(time * 0.1) * 0.5;
                    pattern += sin(pos.x + t) * sin(pos.y + t) * 0.25;
                }
                
                return clamp(pattern, 0.0, 1.0) * 0.15; // Subtle effect
            }
            
            void main() {
                // Center and scale UV coordinates
                vec2 uv = vUv;
                
                // Calculate base gradient
                vec3 color = gradient(uv, time);
                
                // Add subtle highlights
                float highlight = highlights(uv, time);
                color += vec3(highlight);
                
                gl_FragColor = vec4(color, 0.95); // Slightly transparent background
            }
        `,
        transparent: true // Enable transparency
    });
    
    // Create a full-screen quad
    backgroundMesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2, 2),
        backgroundMaterial
    );
    backgroundScene.add(backgroundMesh);
}

/**
 * Initialize the 3D scene
 */
function initScene() {
    // Get container element
    const container = document.getElementById('3dCanvas');
    if (!container) {
        console.error('3D Canvas container not found');
        return;
    }
    
    // Set dimensions
    const width = container.clientWidth;
    const height = canvasHeight;
    
    // Create renderer first (with proper alpha settings)
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false; // Important for rendering background
    renderer.setClearColor(0x000000, 0); // Transparent clear color
    
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1, 10); // Positioned farther back
    
    // Clear container
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
    
    // Create shader background
    createShaderBackground();
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 100; 
    
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
    
    // Ground plane for shadows
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
    
    // Get delta time for animations
    const delta = clock.getDelta();
    
    // Update shader background
    const elapsedTime = clock.getElapsedTime();
    backgroundUniforms.time.value = elapsedTime;
    
    // Rotate model if enabled
    if (isRotating && activeModel) {
        activeModel.rotation.y += 0.005;
    }
    
    // Update model animations
    updateAnimations(delta);
    
    // Update controls
    if (controls) controls.update();
    
    // Render both scenes
    renderer.autoClear = false;
    renderer.clear();
    
    // First render background
    if (backgroundScene && backgroundCamera) {
        renderer.render(backgroundScene, backgroundCamera);
    }
    
    // Then render scene
    if (scene && camera) {
        renderer.clearDepth(); // Ensure 3D objects render over background
        renderer.render(scene, camera);
    }
}

/**
 * Handle window resize
 */
function onWindowResize() {
    // Update responsive height
    setResponsiveHeight();
    
    const container = document.getElementById('3dCanvas');
    if (!container || !camera || !renderer) return;
    
    const width = container.clientWidth;
    const height = canvasHeight;
    
    // Update camera
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    // Update renderer
    renderer.setSize(width, height);
    
    // Update background shader resolution
    if (backgroundUniforms && backgroundUniforms.resolution) {
        backgroundUniforms.resolution.value.x = width;
        backgroundUniforms.resolution.value.y = height;
    }
}

/**
 * Load 3D model
 */
function loadModel(modelType) {
    if (!modelType || !modelPaths[modelType]) {
        console.error(`Invalid model type: ${modelType}`);
        return;
    }
    
    // If a model is already loading, store this request and return
    if (isModelLoading) {
        console.log(`Model ${modelType} requested while another is loading. Queuing.`);
        pendingModelType = modelType;
        return;
    }
    
    // Set loading flag
    isModelLoading = true;
    
    console.log(`Loading 3D model: ${modelType} from path: ${modelPaths[modelType]}`);
    
    // Show loading indicator
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    // Properly dispose of previous model resources
    if (activeModel) {
        // First remove from scene
        scene.remove(activeModel);
        
        // Dispose of geometries and materials to prevent memory leaks
        activeModel.traverse(function(node) {
            if (node.isMesh) {
                if (node.geometry) node.geometry.dispose();
                
                if (node.material) {
                    // If material is an array, dispose each one
                    if (Array.isArray(node.material)) {
                        node.material.forEach(material => disposeMaterial(material));
                    } else {
                        disposeMaterial(node.material);
                    }
                }
            }
        });
        
        activeModel = null;
    }
    
    // Function to dispose material and its textures
    function disposeMaterial(material) {
        if (material.map) material.map.dispose();
        if (material.lightMap) material.lightMap.dispose();
        if (material.bumpMap) material.bumpMap.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.specularMap) material.specularMap.dispose();
        if (material.envMap) material.envMap.dispose();
        material.dispose();
    }
    
    // Reset interaction states
    isExploded = false;
    isAnimating = false;
    originalPositions = [];
    modelParts = [];
    
    // Clear parts buttons container
    const partsContainer = document.getElementById('parts-buttons');
    if (partsContainer) {
        partsContainer.innerHTML = '';
    }
    
    // Load new model
    try {
        const loader = new THREE.GLTFLoader();
        
        loader.load(
            modelPaths[modelType],
            function(gltf) {
                // Success callback
                activeModel = gltf.scene;
                
                // Position and scale with model-specific settings
                const settings = modelSettings[modelType] || { scale: 3, positionY: -1 };
                
                activeModel.position.set(0, 0, 0);
                activeModel.scale.set(settings.scale, settings.scale, settings.scale);
                activeModel.position.y = settings.positionY;
                
                // Apply shadows and materials
                activeModel.traverse(function(node) {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        node.material.wireframe = isWireframe;
                        
                        // Make sure materials are visible
                        if (node.material) {
                            // Ensure material has good settings for visibility
                            node.material.transparent = false;
                            node.material.opacity = 1.0;
                            node.material.side = THREE.DoubleSide;
                            node.material.depthTest = true;
                            node.material.depthWrite = true;
                        }
                    }
                });
                
                // Add to scene
                scene.add(activeModel);
                
                // Hide loading indicator
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                
                console.log(`Model loaded successfully: ${modelType}`);
                
                // Reset loading flag
                isModelLoading = false;
                
                // Check if there's a pending model to load
                if (pendingModelType && pendingModelType !== modelType) {
                    const nextModel = pendingModelType;
                    pendingModelType = null;
                    setTimeout(() => loadModel(nextModel), 50); // Small delay to ensure clean state
                }
            },
            function(xhr) {
                // Progress callback
                if (xhr.lengthComputable) {
                    const percent = (xhr.loaded / xhr.total * 100).toFixed(2);
                    console.log(`Loading progress: ${percent}%`);
                }
            },
            function(error) {
                // Error callback
                console.error('Error loading model:', error);
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                
                // Create a placeholder cube with bright color
                const geometry = new THREE.BoxGeometry(2, 2, 2);
                const material = new THREE.MeshStandardMaterial({ 
                    color: 0xff00ff,  // Bright pink to be sure it's visible
                    emissive: 0x440044 // Add some self-illumination
                });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.set(0, 0, 0);
                cube.castShadow = true;
                
                activeModel = cube;
                scene.add(activeModel);
                
                console.warn(`Failed to load model ${modelType}, displaying placeholder cube instead.`);
                
                // Reset loading flag
                isModelLoading = false;
                
                // Check if there's a pending model to load
                if (pendingModelType && pendingModelType !== modelType) {
                    const nextModel = pendingModelType;
                    pendingModelType = null;
                    setTimeout(() => loadModel(nextModel), 50);
                }
            }
        );
    } catch (e) {
        console.error('Exception while loading model:', e);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        // Create a fallback cube that's clearly visible
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, // Bright green
            emissive: 0x004400 // Add some self-illumination
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0, 0);
        cube.castShadow = true;
        
        activeModel = cube;
        scene.add(activeModel);
        
        // Reset loading flag
        isModelLoading = false;
        
        // Check if there's a pending model to load
        if (pendingModelType && pendingModelType !== modelType) {
            const nextModel = pendingModelType;
            pendingModelType = null;
            setTimeout(() => loadModel(nextModel), 50);
        }
    }
}

/**
 * Reset the current model to its original state
 */
function resetModel() {
    // Get the current model type
    let currentModelType = null;
    document.querySelectorAll('.list-group-item').forEach(function(btn) {
        if (btn.classList.contains('active')) {
            currentModelType = btn.getAttribute('data-model');
        }
    });
    
    if (currentModelType) {
        console.log('Resetting model:', currentModelType);
        
        // Reset interaction states
        isExploded = false;
        isAnimating = false;
        
        // Reset button texts
        const explodeBtn = document.getElementById('explode-view');
        if (explodeBtn) explodeBtn.textContent = 'Explode View';
        
        const animateBtn = document.getElementById('toggle-animation');
        if (animateBtn) animateBtn.textContent = 'Animate';
        
        // Hide parts selector
        const partsSelector = document.getElementById('parts-selector');
        if (partsSelector) {
            partsSelector.style.display = 'none';
        }
        
        // Reload the current model
        loadModel(currentModelType);
    }
}

/**
 * Setup control buttons
 */
function setupControls() {
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
            camera.position.set(0, 1, 10);
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
    
    // Explode view toggle
    const explodeBtn = document.getElementById('explode-view');
    if (explodeBtn) {
        explodeBtn.onclick = function() {
            toggleExplodeView();
        };
    }
    
    // Animation toggle
    const animationBtn = document.getElementById('toggle-animation');
    if (animationBtn) {
        animationBtn.onclick = function() {
            toggleAnimation();
        };
    }
    
    // Parts toggle
    const partsBtn = document.getElementById('toggle-parts');
    if (partsBtn) {
        partsBtn.onclick = function() {
            const partsSelector = document.getElementById('parts-selector');
            if (partsSelector) {
                if (partsSelector.style.display === 'none') {
                    identifyModelParts();
                    partsSelector.style.display = 'block';
                } else {
                    partsSelector.style.display = 'none';
                }
            }
        };
    }
    
    // Environment selector
    const environmentSelect = document.getElementById('environment-select');
    if (environmentSelect) {
        environmentSelect.onchange = function() {
            changeEnvironment(this.value);
        };
    }
    
    // Reset model button
    const resetModelBtn = document.getElementById('reset-model');
    if (resetModelBtn) {
        resetModelBtn.onclick = function() {
            resetModel();
        };
    }
}

/**
 * Toggle explode view of the model
 */
function toggleExplodeView() {
    if (!activeModel) return;
    
    if (!isExploded) {
        // Store original positions and explode the model
        originalPositions = [];
        let index = 0;
        
        activeModel.traverse((node) => {
            if (node.isMesh || (node.children && node.children.length > 0)) {
                // Skip the root node
                if (node === activeModel) return;
                
                // Store original position
                originalPositions.push({
                    object: node,
                    position: node.position.clone()
                });
                
                // Calculate explosion direction (away from center)
                const direction = new THREE.Vector3()
                    .subVectors(node.position, new THREE.Vector3(0, 0, 0))
                    .normalize()
                    .multiplyScalar(1); // Explosion factor
                
                // Animate to exploded position
                const targetPosition = node.position.clone().add(direction);
                animatePosition(node, targetPosition, 1000);
                
                index++;
            }
        });
        
        isExploded = true;
        document.getElementById('explode-view').textContent = 'Reset View';
    } else {
        // Restore original positions
        originalPositions.forEach((item) => {
            animatePosition(item.object, item.position, 1000);
        });
        
        isExploded = false;
        document.getElementById('explode-view').textContent = 'Explode View';
    }
}

/**
 * Animate object position
 */
function animatePosition(object, targetPosition, duration) {
    const startPosition = object.position.clone();
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease function (cubic ease out)
        const t = 1 - Math.pow(1 - progress, 3);
        
        object.position.lerpVectors(startPosition, targetPosition, t);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    update();
}

/**
 * Toggle model animation
 */
function toggleAnimation() {
    isAnimating = !isAnimating;
    
    if (isAnimating) {
        document.getElementById('toggle-animation').textContent = 'Stop Animation';
        
        // Create simple animation for model parts
        if (activeModel) {
            animationMixers = [];
            
            activeModel.traverse((node) => {
                if (node.isMesh && node !== activeModel) {
                    // Create a simple rotation or movement animation
                    const rotationSpeed = Math.random() * 0.01 - 0.005;
                    node.userData.animation = {
                        rotationY: rotationSpeed,
                        originalPosition: node.position.clone(),
                        hoverDistance: Math.random() * 0.1,
                        hoverSpeed: Math.random() * 0.002 + 0.001,
                        hoverOffset: Math.random() * Math.PI * 2
                    };
                }
            });
        }
    } else {
        document.getElementById('toggle-animation').textContent = 'Animate';
        
        // Reset positions if needed
        if (activeModel) {
            activeModel.traverse((node) => {
                if (node.userData.animation) {
                    node.position.copy(node.userData.animation.originalPosition);
                }
            });
        }
    }
}

/**
 * Update animations in the animation loop
 */
function updateAnimations(delta) {
    if (!isAnimating || !activeModel) return;
    
    const time = Date.now() * 0.001; // Current time in seconds
    
    activeModel.traverse((node) => {
        if (node.userData.animation) {
            // Apply rotation animation
            node.rotation.y += node.userData.animation.rotationY;
            
            // Apply hover animation (gentle up/down movement)
            const hoverAnimation = node.userData.animation;
            const hoverOffset = Math.sin(time * hoverAnimation.hoverSpeed + hoverAnimation.hoverOffset) * hoverAnimation.hoverDistance;
            
            node.position.y = hoverAnimation.originalPosition.y + hoverOffset;
        }
    });
    
    // Update any animation mixers
    animationMixers.forEach(mixer => mixer.update(delta));
}

/**
 * Identify and create interactive controls for model parts
 */
function identifyModelParts() {
    if (!activeModel) return;
    
    // Clear previous parts
    modelParts = [];
    const partsContainer = document.getElementById('parts-buttons');
    if (!partsContainer) return;
    
    partsContainer.innerHTML = '';
    
    // Find named parts in the model
    activeModel.traverse((node) => {
        // Only consider objects with names that aren't just numbers and have meshes
        if (node.name && !/^\d+$/.test(node.name) && node !== activeModel) {
            const hasMesh = node.type === 'Mesh' || (node.children && node.children.some(child => child.type === 'Mesh'));
            
            if (hasMesh) {
                modelParts.push(node);
                
                // Create button for this part
                const button = document.createElement('button');
                button.className = 'btn btn-sm btn-outline-primary m-1';
                button.textContent = formatPartName(node.name);
                button.setAttribute('data-part-index', modelParts.length - 1);
                button.onclick = function() {
                    highlightPart(parseInt(this.getAttribute('data-part-index')));
                };
                
                partsContainer.appendChild(button);
            }
        }
    });
    
    // If no named parts found, try to identify parts by mesh groups
    if (modelParts.length === 0) {
        // Group meshes by material or position proximity
        let meshGroups = [];
        let groupIndex = 0;
        
        activeModel.traverse((node) => {
            if (node.isMesh && node !== activeModel) {
                // Create artificial part groups
                if (groupIndex >= meshGroups.length) {
                    meshGroups.push([]);
                }
                
                meshGroups[groupIndex].push(node);
                groupIndex = (groupIndex + 1) % 5; // Create up to 5 groups
            }
        });
        
        // Create a button for each mesh group
        meshGroups.forEach((group, index) => {
            if (group.length > 0) {
                const partName = `Part ${index + 1}`;
                modelParts.push({
                    name: partName,
                    meshes: group,
                    isGroup: true
                });
                
                const button = document.createElement('button');
                button.className = 'btn btn-sm btn-outline-primary m-1';
                button.textContent = partName;
                button.setAttribute('data-part-index', modelParts.length - 1);
                button.onclick = function() {
                    highlightPart(parseInt(this.getAttribute('data-part-index')));
                };
                
                partsContainer.appendChild(button);
            }
        });
    }
    
    // If still no parts, show a message
    if (modelParts.length === 0) {
        partsContainer.innerHTML = '<p>No interactive parts detected in this model</p>';
    }
}

/**
 * Format part name for display
 */
function formatPartName(name) {
    // Convert camelCase or snake_case to Title Case with spaces
    return name
        .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
}

/**
 * Highlight a specific part of the model
 */
function highlightPart(partIndex) {
    if (!activeModel || partIndex >= modelParts.length) return;
    
    // Reset all materials first
    activeModel.traverse((node) => {
        if (node.isMesh && node.userData.originalMaterial) {
            node.material = node.userData.originalMaterial.clone();
        }
    });
    
    const part = modelParts[partIndex];
    
    // Focus camera on this part
    if (part) {
        // Create highlight material
        const highlightMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x003300,
            metalness: 0.8,
            roughness: 0.2
        });
        
        if (part.isGroup) {
            // Handle mesh groups
            part.meshes.forEach(mesh => {
                // Store original material if not already stored
                if (!mesh.userData.originalMaterial) {
                    mesh.userData.originalMaterial = mesh.material.clone();
                }
                
                // Apply highlight material
                mesh.material = highlightMaterial;
            });
            
            // Focus camera on the center of the group
            if (part.meshes.length > 0) {
                const center = new THREE.Vector3();
                part.meshes.forEach(mesh => {
                    center.add(mesh.position);
                });
                center.divideScalar(part.meshes.length);
                
                // Smoothly move camera to focus on this part
                const targetPosition = center.clone().add(new THREE.Vector3(0, 0, 3));
                animateCamera(targetPosition, center, 1000);
            }
        } else {
            // Handle single object parts
            part.traverse((node) => {
                if (node.isMesh) {
                    // Store original material if not already stored
                    if (!node.userData.originalMaterial) {
                        node.userData.originalMaterial = node.material.clone();
                    }
                    
                    // Apply highlight material
                    node.material = highlightMaterial;
                }
            });
            
            // Focus camera on this part
            const box = new THREE.Box3().setFromObject(part);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Calculate camera position to frame the part
            const targetPosition = center.clone().add(new THREE.Vector3(0, 0, maxDim * 2));
            
            // Smoothly move camera to focus on this part
            animateCamera(targetPosition, center, 1000);
        }
    }
}

/**
 * Animate camera movement
 */
function animateCamera(targetPosition, targetLookAt, duration) {
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease function (cubic ease out)
        const t = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(startPosition, targetPosition, t);
        controls.target.lerpVectors(startTarget, targetLookAt, t);
        controls.update();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    update();
}

/**
 * Change the environment lighting and background
 */
function changeEnvironment(environment) {
    if (currentEnvironment === environment) return;
    currentEnvironment = environment;
    
    // Clear existing lights
    lights.forEach(light => {
        if (light) scene.remove(light);
    });
    lights = [];
    
    // Setup new environment
    switch (environment) {
        case 'default':
            // Restore the initial shader background
            scene.background = null; // Remove solid color background
            
            // Add basic lighting
            const defaultAmbient = new THREE.AmbientLight(0x444444, 0.6);
            scene.add(defaultAmbient);
            lights.push(defaultAmbient);
            
            const defaultMain = new THREE.DirectionalLight(0xffffff, 0.8);
            defaultMain.position.set(1, 1, 1);
            defaultMain.castShadow = true; // Enable shadows
            
            // Configure shadow properties
            defaultMain.shadow.mapSize.width = 1024;
            defaultMain.shadow.mapSize.height = 1024;
            defaultMain.shadow.camera.near = 0.5;
            defaultMain.shadow.camera.far = 50;
            
            scene.add(defaultMain);
            lights.push(defaultMain);
            
            // Remove fog to show shader background
            scene.fog = null;
            break;
        case 'outdoor':
            // Bright directional light (sun) with blue-ish ambient
            scene.background = new THREE.Color(0x87CEEB); // Sky blue
            scene.fog = new THREE.FogExp2(0x87CEEB, 0.002);
            
            const sunLight = new THREE.DirectionalLight(0xFFFFAA, 1.5);
            sunLight.position.set(50, 50, 10);
            sunLight.castShadow = true;
            scene.add(sunLight);
            lights.push(sunLight);
            
            const ambientLight = new THREE.AmbientLight(0x6688AA, 0.7);
            scene.add(ambientLight);
            lights.push(ambientLight);
            break;
            
        case 'night':
            // Dark blue background with point lights
            scene.background = new THREE.Color(0x001122);
            scene.fog = new THREE.FogExp2(0x001122, 0.005);
            
            const moonLight = new THREE.DirectionalLight(0x8888FF, 0.5);
            moonLight.position.set(-10, 20, 10);
            moonLight.castShadow = true;
            scene.add(moonLight);
            lights.push(moonLight);
            
            const bluePointLight = new THREE.PointLight(0x3366FF, 1, 20);
            bluePointLight.position.set(5, 5, 5);
            scene.add(bluePointLight);
            lights.push(bluePointLight);
            
            const purplePointLight = new THREE.PointLight(0xFF33FF, 1, 20);
            purplePointLight.position.set(-5, 3, 5);
            scene.add(purplePointLight);
            lights.push(purplePointLight);
            
            const nightAmbient = new THREE.AmbientLight(0x222244, 0.3);
            scene.add(nightAmbient);
            lights.push(nightAmbient);
            break;
            
        case 'tech':
            // Dark background with neon-like lighting
            scene.background = new THREE.Color(0x111111);
            scene.fog = new THREE.FogExp2(0x111111, 0.005);
            
            const cyanLight = new THREE.SpotLight(0x00FFFF, 1.5);
            cyanLight.position.set(10, 10, 10);
            cyanLight.angle = Math.PI / 6;
            cyanLight.castShadow = true;
            scene.add(cyanLight);
            lights.push(cyanLight);
            
            const magentaLight = new THREE.SpotLight(0xFF00FF, 1.5);
            magentaLight.position.set(-10, 5, -5);
            magentaLight.angle = Math.PI / 6;
            magentaLight.castShadow = true;
            scene.add(magentaLight);
            lights.push(magentaLight);
            
            const techAmbient = new THREE.AmbientLight(0x222222, 0.5);
            scene.add(techAmbient);
            lights.push(techAmbient);
            break;
            
        case 'studio':
        default:
            // Default studio lighting
            scene.background = new THREE.Color(0x000015);
            scene.fog = new THREE.FogExp2(0x000015, 0.01);
            
            const ambLight = new THREE.AmbientLight(0x333333);
            scene.add(ambLight);
            lights.push(ambLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(0, 1, 1);
            scene.add(directionalLight);
            lights.push(directionalLight);
            
            const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
            fillLight.position.set(-1, 0.5, -0.5);
            scene.add(fillLight);
            lights.push(fillLight);
            break;
    }
    
    // Update light intensity slider value
    const intensitySlider = document.getElementById('light-intensity');
    if (intensitySlider) {
        intensitySlider.value = 1.0;
        document.getElementById('intensity-value').textContent = '1.0';
    }
} 