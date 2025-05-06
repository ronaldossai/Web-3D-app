/**
 * simple-test.js - Bare minimum script for model switching
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing simple-test.js');
    
    // Direct button click handlers - as simple as possible
    const laptopBtn = document.querySelector('.list-group-item[data-model="laptop"]');
    const controllerBtn = document.querySelector('.list-group-item[data-model="controller"]');
    const phoneBtn = document.querySelector('.list-group-item[data-model="phone"]');
    const cokeBtn = document.querySelector('.list-group-item[data-model="coke"]');
    
    // Log what we found
    console.log('Found buttons:', {
        laptop: !!laptopBtn,
        controller: !!controllerBtn,
        phone: !!phoneBtn,
        coke: !!cokeBtn
    });
    
    // Get references to all spec divs
    const laptopSpecs = document.getElementById('laptop-specs');
    const controllerSpecs = document.getElementById('controller-specs');
    const phoneSpecs = document.getElementById('phone-specs');
    const cokeSpecs = document.getElementById('coke-specs');
    
    // Log what we found
    console.log('Found spec divs:', {
        laptop: !!laptopSpecs,
        controller: !!controllerSpecs,
        phone: !!phoneSpecs,
        coke: !!cokeSpecs
    });
    
    // Function to show specs for a specific model
    function showSpecs(modelType) {
        console.log('Showing specs for:', modelType);
        
        // Hide all specs first
        if (laptopSpecs) laptopSpecs.style.display = 'none';
        if (controllerSpecs) controllerSpecs.style.display = 'none';
        if (phoneSpecs) phoneSpecs.style.display = 'none';
        if (cokeSpecs) cokeSpecs.style.display = 'none';
        
        // Show the selected model's specs
        switch(modelType) {
            case 'laptop':
                if (laptopSpecs) laptopSpecs.style.display = 'flex';
                break;
            case 'controller':
                if (controllerSpecs) controllerSpecs.style.display = 'flex';
                break;
            case 'phone':
                if (phoneSpecs) phoneSpecs.style.display = 'flex';
                break;
            case 'coke':
                if (cokeSpecs) cokeSpecs.style.display = 'flex';
                break;
        }
        
        // Update the active class on buttons
        if (laptopBtn) laptopBtn.classList.remove('active');
        if (controllerBtn) controllerBtn.classList.remove('active');
        if (phoneBtn) phoneBtn.classList.remove('active');
        if (cokeBtn) cokeBtn.classList.remove('active');
        
        // Add active class to selected button
        switch(modelType) {
            case 'laptop':
                if (laptopBtn) laptopBtn.classList.add('active');
                break;
            case 'controller':
                if (controllerBtn) controllerBtn.classList.add('active');
                break;
            case 'phone':
                if (phoneBtn) phoneBtn.classList.add('active');
                break;
            case 'coke':
                if (cokeBtn) cokeBtn.classList.add('active');
                break;
        }
    }
    
    // Attach click handlers to buttons
    if (laptopBtn) {
        laptopBtn.onclick = function(e) {
            e.preventDefault();
            console.log('Laptop button clicked');
            showSpecs('laptop');
        };
    }
    
    if (controllerBtn) {
        controllerBtn.onclick = function(e) {
            e.preventDefault();
            console.log('Controller button clicked');
            showSpecs('controller');
        };
    }
    
    if (phoneBtn) {
        phoneBtn.onclick = function(e) {
            e.preventDefault();
            console.log('Phone button clicked');
            showSpecs('phone');
        };
    }
    
    if (cokeBtn) {
        cokeBtn.onclick = function(e) {
            e.preventDefault();
            console.log('Coke button clicked');
            showSpecs('coke');
        };
    }
    
    // Make global helper function available in console
    window.changeModel = function(modelType) {
        console.log(`Manual switch to ${modelType}`);
        showSpecs(modelType);
    };
    
    console.log('Setup complete. You can use changeModel("laptop"), changeModel("controller"), etc. in console.');
}); 