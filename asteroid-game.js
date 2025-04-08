// Asteroid Dodger Game
// A Three.js game where the player navigates a spaceship through an asteroid field

// Game variables
let scene, camera, renderer, ship, gameActive = false;
let asteroids = [], score = 0, lives = 3, paused = false;
let clock = new THREE.Clock();
let shipSpeed = 0.1, maxSpeed = 0.2;
let shipVelocity = new THREE.Vector3(0, 0, 0);
let keys = {};
let boostEnergy = 100, boostRecoveryRate = 0.5, boostConsumptionRate = 2;
let boosting = false;
let isGameOver = false;
let gameOverlay, gameMenu, gamePause, gameOver;
let highScore = localStorage.getItem('asteroidDodgerHighScore') || 0;
let canvasContainer;

// Initialize the game
function init() {
    // Get DOM elements
    gameOverlay = document.getElementById('game-overlay');
    gameMenu = document.querySelector('.game-menu');
    gamePause = document.querySelector('.game-pause');
    gameOver = document.querySelector('.game-over');
    canvasContainer = document.getElementById('game-canvas');
    
    document.getElementById('high-score').textContent = highScore;
    
    // Setup event listeners
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('resume-game').addEventListener('click', resumeGame);
    document.getElementById('restart-game').addEventListener('click', restartGame);
    document.getElementById('play-again').addEventListener('click', restartGame);
    document.getElementById('return-home').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Setup keyboard controls
    setupControls();
    
    // Create the scene
    createScene();
}

// Setup keyboard controls
function setupControls() {
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        // ESC key to pause/resume
        if (e.key === 'Escape' && gameActive) {
            togglePause();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
}

// Create the 3D scene
function createScene() {
    // Create Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000015);
    
    // Create fog for depth effect
    scene.fog = new THREE.FogExp2(0x000015, 0.01);
    
    // Create Camera
    camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;
    camera.rotation.x = -0.3;
    
    // Create Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    canvasContainer.innerHTML = ''; // Clear any existing content
    canvasContainer.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Add starfield background
    createStarfield();
    
    // Create player ship
    createShip();
    
    // Handle window resizing
    window.addEventListener('resize', onWindowResize);
}

// Create starfield background
function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        sizeAttenuation: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

// Create player ship
function createShip() {
    // Create a group to hold all ship parts
    ship = new THREE.Group();
    ship.position.set(0, 0, 0);
    
    // ---- Ship Body ----
    const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.7, 8);
    bodyGeometry.rotateX(Math.PI / 2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3377ff,
        emissive: 0x112244,
        shininess: 100,
        flatShading: true
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    ship.add(body);
    
    // ---- Wings ----
    const wingGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.3);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2266cc,
        emissive: 0x112233,
        flatShading: true
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = -0.1;
    wings.position.z = 0.1;
    ship.add(wings);
    
    // ---- Wing Tips ----
    const wingTipMaterial = new THREE.MeshPhongMaterial({
        color: 0xff3300,
        emissive: 0x441100,
        flatShading: true
    });
    
    // Left Wing Tip
    const leftTipGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.05);
    const leftTip = new THREE.Mesh(leftTipGeometry, wingTipMaterial);
    leftTip.position.set(-0.4, -0.1, 0.2);
    ship.add(leftTip);
    
    // Right Wing Tip
    const rightTip = new THREE.Mesh(leftTipGeometry.clone(), wingTipMaterial);
    rightTip.position.set(0.4, -0.1, 0.2);
    ship.add(rightTip);
    
    // ---- Cockpit ----
    const cockpitGeometry = new THREE.SphereGeometry(0.12, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    cockpitGeometry.rotateX(Math.PI);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x88aaff, 
        transparent: true,
        opacity: 0.7,
        shininess: 100
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.12, -0.15);
    ship.add(cockpit);
    
    // ---- Engines ----
    const engineGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.2, 8);
    const engineMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x111111,
        flatShading: true
    });
    
    // Left Engine
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-0.2, -0.05, 0.3);
    leftEngine.rotation.x = Math.PI / 2;
    ship.add(leftEngine);
    
    // Right Engine
    const rightEngine = new THREE.Mesh(engineGeometry.clone(), engineMaterial);
    rightEngine.position.set(0.2, -0.05, 0.3);
    rightEngine.rotation.x = Math.PI / 2;
    ship.add(rightEngine);
    
    // ---- Engine Glow ----
    
    // Left Engine Glow
    const leftEngineGlow = new THREE.PointLight(0x00ffff, 1, 0.5);
    leftEngineGlow.position.set(0, 0, 0.1);
    leftEngine.add(leftEngineGlow);
    
    // Right Engine Glow
    const rightEngineGlow = new THREE.PointLight(0x00ffff, 1, 0.5);
    rightEngineGlow.position.set(0, 0, 0.1);
    rightEngine.add(rightEngineGlow);
    
    // Add collision geometry (invisible for collision detection)
    ship.userData.collisionRadius = 0.3;
    
    scene.add(ship);
}

// Create asteroid
function createAsteroid() {
    // Random size
    const size = Math.random() * 0.5 + 0.2;
    
    // Random shape using icosahedron geometry with noise
    const asteroidGeometry = new THREE.IcosahedronGeometry(size, 1);
    
    // Apply random "bumpiness" to vertices
    const positions = asteroidGeometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        const noise = (Math.random() - 0.5) * 0.2;
        positions.setXYZ(
            i,
            x * (1 + noise),
            y * (1 + noise),
            z * (1 + noise)
        );
    }
    
    // Random gray color
    const grayScale = Math.random() * 0.5 + 0.2;
    const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(grayScale, grayScale, grayScale),
        roughness: 1,
        metalness: 0.3
    });
    
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    
    // Random position at distance from player
    const angle = Math.random() * Math.PI * 2;
    const distance = 20;
    asteroid.position.x = Math.sin(angle) * distance * (Math.random() * 0.5 + 0.5);
    asteroid.position.y = (Math.random() - 0.5) * 6;
    asteroid.position.z = -distance;
    
    // Random rotation
    asteroid.rotation.x = Math.random() * Math.PI;
    asteroid.rotation.y = Math.random() * Math.PI;
    asteroid.rotation.z = Math.random() * Math.PI;
    
    // Random velocity
    asteroid.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05,
        (Math.random() * 0.3) + 0.1
    );
    
    // Random rotation velocity
    asteroid.rotationVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
    );
    
    asteroid.size = size;
    
    scene.add(asteroid);
    asteroids.push(asteroid);
}

// Start the game
function startGame() {
    gameActive = true;
    isGameOver = false;
    score = 0;
    lives = 3;
    boostEnergy = 100;
    updateHUD();
    
    // Hide menu, show game
    gameOverlay.style.display = 'none';
    
    // Reset the clock to prevent large delta on first frame
    clock.start();
    
    // Start the game loop
    animate();
    
    // Start spawning asteroids
    spawnAsteroids();
    
    // Update boost bar initial state
    updateBoostBar();
    
    console.log("Game started"); // Debug log
}

// Toggle pause state
function togglePause() {
    paused = !paused;
    
    if (paused) {
        gameOverlay.style.display = 'flex';
        gameMenu.classList.add('hidden');
        gamePause.classList.remove('hidden');
        gameOver.classList.add('hidden');
    } else {
        gameOverlay.style.display = 'none';
    }
}

// Resume game
function resumeGame() {
    paused = false;
    gameOverlay.style.display = 'none';
    
    // Reset the clock to prevent large delta on resume
    clock.start();
}

// Restart game
function restartGame() {
    // Remove all asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        scene.remove(asteroids[i]);
    }
    asteroids = [];
    
    // Reset ship position
    ship.position.set(0, 0, 0);
    shipVelocity.set(0, 0, 0);
    
    // Start the game
    startGame();
}

// Game Over
function handleGameOver() {
    gameActive = false;
    isGameOver = true;
    
    document.getElementById('final-score').textContent = score;
    
    // Check for high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('asteroidDodgerHighScore', highScore);
        document.getElementById('high-score').textContent = highScore;
    }
    
    gameOverlay.style.display = 'flex';
    gameMenu.classList.add('hidden');
    gamePause.classList.add('hidden');
    gameOver.classList.remove('hidden');
}

// Spawn asteroids periodically
function spawnAsteroids() {
    if (!gameActive) return;
    
    createAsteroid();
    
    // Spawn rate increases with score
    const baseDelay = 2000;
    const minDelay = 200;
    const spawnRate = Math.max(minDelay, baseDelay - (score * 10));
    
    setTimeout(spawnAsteroids, spawnRate);
}

// Update game elements
function update() {
    if (!gameActive || paused) return;
    
    const delta = Math.min(clock.getDelta(), 0.1); // Cap delta time to prevent large jumps
    
    // Update ship position based on controls
    updateShipControls(delta);
    
    // Move asteroids
    updateAsteroids(delta);
    
    // Check for collisions
    checkCollisions();
    
    // Increase score with time
    score += Math.floor(delta * 10);
    updateHUD();
    
    // Regenerate boost energy
    if (!boosting && boostEnergy < 100) {
        boostEnergy = Math.min(100, boostEnergy + boostRecoveryRate);
        updateBoostBar();
    }
}

// Update ship controls
function updateShipControls(delta) {
    // Apply friction/drag
    shipVelocity.multiplyScalar(0.95);
    
    // Determine if boost is active
    boosting = keys['u'] && boostEnergy > 0;
    
    // Set the current max speed based on boost state
    let currentMaxSpeed = shipSpeed;
    if (boosting) {
        currentMaxSpeed = maxSpeed;
        boostEnergy = Math.max(0, boostEnergy - boostConsumptionRate);
        updateBoostBar();
        
        // Add engine flame/light effect - find engine lights in our ship model
        // Look for engine parts which are at index 7 and 8 in our ship model
        if (ship.children && ship.children.length >= 9) {
            // Boost the engine lights
            const leftEngine = ship.children[7]; // Left engine
            const rightEngine = ship.children[8]; // Right engine
            
            if (leftEngine && leftEngine.children[0]) {
                leftEngine.children[0].intensity = 2.5; // Left engine glow
            }
            
            if (rightEngine && rightEngine.children[0]) {
                rightEngine.children[0].intensity = 2.5; // Right engine glow
            }
            
            // Change engine color to indicate boosting
            const boostColor = new THREE.Color(0x00ffaa);
            if (leftEngine.children[0]) leftEngine.children[0].color = boostColor;
            if (rightEngine.children[0]) rightEngine.children[0].color = boostColor;
        }
    } else {
        // Return engine lights to normal
        if (ship.children && ship.children.length >= 9) {
            const leftEngine = ship.children[7];
            const rightEngine = ship.children[8];
            
            if (leftEngine && leftEngine.children[0]) {
                leftEngine.children[0].intensity = 1.0;
            }
            
            if (rightEngine && rightEngine.children[0]) {
                rightEngine.children[0].intensity = 1.0;
            }
            
            // Return to normal color
            const normalColor = new THREE.Color(0x00ffff);
            if (leftEngine.children[0]) leftEngine.children[0].color = normalColor;
            if (rightEngine.children[0]) rightEngine.children[0].color = normalColor;
        }
    }
    
    // Handle movement - supports both WASD and arrow keys
    if ((keys['w'] || keys['arrowup']) && shipVelocity.y < currentMaxSpeed) {
        shipVelocity.y += currentMaxSpeed * delta * 5;
    }
    
    if ((keys['s'] || keys['arrowdown']) && shipVelocity.y > -currentMaxSpeed) {
        shipVelocity.y -= currentMaxSpeed * delta * 5;
    }
    
    if ((keys['a'] || keys['arrowleft']) && shipVelocity.x > -currentMaxSpeed) {
        shipVelocity.x -= currentMaxSpeed * delta * 5;
        ship.rotation.z = Math.min(ship.rotation.z + 0.1, 0.3);
    } else if ((keys['d'] || keys['arrowright']) && shipVelocity.x < currentMaxSpeed) {
        shipVelocity.x += currentMaxSpeed * delta * 5;
        ship.rotation.z = Math.max(ship.rotation.z - 0.1, -0.3);
    } else {
        // Return to normal rotation when not turning
        ship.rotation.z *= 0.9;
    }
    
    // Update ship position
    ship.position.add(shipVelocity);
    
    // Keep ship in bounds
    ship.position.x = THREE.MathUtils.clamp(ship.position.x, -5, 5);
    ship.position.y = THREE.MathUtils.clamp(ship.position.y, -3, 3);
}

// Update asteroids
function updateAsteroids(delta) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        
        // Move asteroid
        asteroid.position.add(asteroid.velocity);
        
        // Rotate asteroid
        asteroid.rotation.x += asteroid.rotationVelocity.x;
        asteroid.rotation.y += asteroid.rotationVelocity.y;
        asteroid.rotation.z += asteroid.rotationVelocity.z;
        
        // Remove asteroids that are behind the player
        if (asteroid.position.z > 5) {
            scene.remove(asteroid);
            asteroids.splice(i, 1);
        }
    }
}

// Check for collisions
function checkCollisions() {
    // Use the custom collision radius we defined in the ship model, or fall back to 0.3 if not available
    const collisionRadius = ship.userData.collisionRadius || 0.3;
    const shipBoundingSphere = new THREE.Sphere(ship.position, collisionRadius);
    
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        const asteroidBoundingSphere = new THREE.Sphere(asteroid.position, asteroid.size);
        
        if (shipBoundingSphere.intersectsSphere(asteroidBoundingSphere)) {
            // Collision detected!
            handleCollision(asteroid, i);
            break; // Only handle one collision per frame
        }
    }
}

// Handle collision
function handleCollision(asteroid, index) {
    // Play sound
    playSound('hit-sound');
    
    // Remove the asteroid
    scene.remove(asteroid);
    asteroids.splice(index, 1);
    
    // Reduce lives
    lives--;
    updateHUD();
    
    // Flash the ship to indicate damage
    ship.material.emissive.setRGB(1, 0, 0);
    setTimeout(() => {
        ship.material.emissive.setRGB(0, 0.5, 0);
    }, 200);
    
    // Check for game over
    if (lives <= 0) {
        playSound('explosion-sound');
        handleGameOver();
    }
}

// Update HUD
function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
}

// Update boost bar
function updateBoostBar() {
    document.getElementById('boost-fill').style.width = `${boostEnergy}%`;
}

// Play sound
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => {
            console.log("Audio play failed:", e);
            // Most browsers require user interaction before playing audio
        });
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
}

// Animation loop
function animate() {
    if (!isGameOver) {
        requestAnimationFrame(animate);
    }
    
    update();
    renderer.render(scene, camera);
}

// Initialize when the page loads
window.addEventListener('DOMContentLoaded', init);