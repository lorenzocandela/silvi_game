// Add to main.js or create a new file called joystick-controls.js

document.addEventListener('DOMContentLoaded', function() {
    // Make sure we have access to the game's controls
    window.buttonPressed = window.buttonPressed || {
        up: false,
        down: false,
        left: false,
        right: false,
        interact: false
    };

    // Expose handleInteraction globally if it's not already exposed
    if (typeof window.handleInteraction !== 'function') {
        window.handleInteraction = function() {
            if (window.isPlayerNearChest && typeof window.isPlayerNearChest === 'function') {
                const near = window.isPlayerNearChest();
                if (near && !window.questionBoxVisible) {
                    console.log("Player is near chest, attempting interaction");
                    // Simulate pressing the spacebar
                    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
                    document.dispatchEvent(spaceEvent);
                    // Release after a short delay
                    setTimeout(() => {
                        document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
                    }, 100);
                }
            }
        };
    }

    // Remove the existing controls
    const oldControls = document.querySelector('.controls');
    if (oldControls) {
        oldControls.remove();
    }

    // Create joystick and X button container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'game-controls-container';
    document.body.appendChild(controlsContainer);

    // Create joystick
    const joystickContainer = document.createElement('div');
    joystickContainer.className = 'joystick-container';
    controlsContainer.appendChild(joystickContainer);

    const joystickBase = document.createElement('div');
    joystickBase.className = 'joystick-base';
    joystickContainer.appendChild(joystickBase);

    const joystickHandle = document.createElement('div');
    joystickHandle.className = 'joystick-handle';
    joystickBase.appendChild(joystickHandle);

    // Create X button
    const xButtonContainer = document.createElement('div');
    xButtonContainer.className = 'x-button-container';
    controlsContainer.appendChild(xButtonContainer);

    const xButton = document.createElement('button');
    xButton.className = 'x-button';
    xButton.textContent = 'A';
    xButtonContainer.appendChild(xButton);

    // Joystick variables
    let isDragging = false;
    let joystickBaseRect = joystickBase.getBoundingClientRect();
    const baseRadius = joystickBaseRect.width / 2;
    const handleRadius = joystickHandle.offsetWidth / 2;
    let currentDirection = { x: 0, y: 0 };

    // Initial joystick position
    const resetJoystick = () => {
        joystickHandle.style.transform = 'translate(-50%, -50%)';
    };

    resetJoystick();

    // Handle joystick events
    const handleJoystickStart = (e) => {
        isDragging = true;
        joystickBaseRect = joystickBase.getBoundingClientRect();
        handleJoystickMove(e);
    };

    const handleJoystickMove = (e) => {
        if (!isDragging) return;

        // Get touch/mouse position
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        // Calculate position relative to joystick base
        const centerX = joystickBaseRect.left + baseRadius;
        const centerY = joystickBaseRect.top + baseRadius;
        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;

        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Limit to circle
        if (distance > (baseRadius - handleRadius)) {
            const angle = Math.atan2(deltaY, deltaX);
            deltaX = Math.cos(angle) * (baseRadius - handleRadius);
            deltaY = Math.sin(angle) * (baseRadius - handleRadius);
        }

        // Update joystick handle position
        joystickHandle.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

        // Determine direction
        const deadZone = 0.4; // Increased dead zone (40% of radius)
        const maxRadius = baseRadius - handleRadius;
        const normalizedX = Math.abs(deltaX) < deadZone * maxRadius ? 0 : deltaX / maxRadius;
        const normalizedY = Math.abs(deltaY) < deadZone * maxRadius ? 0 : deltaY / maxRadius;

        // Stop all directions first
        if (window.stopMove) {
            window.stopMove();
        }

        // Determine direction to move player - only activate one direction at a time
        currentDirection = { x: normalizedX, y: normalizedY };
        
        // Use a threshold to determine which direction to move
        // First prioritize the direction with the largest input
        if (Math.abs(normalizedY) > Math.abs(normalizedX)) {
            // Vertical movement dominates
            if (normalizedY < -deadZone) window.move('up');
            else if (normalizedY > deadZone) window.move('down');
        } else {
            // Horizontal movement dominates
            if (normalizedX < -deadZone) window.move('left');
            else if (normalizedX > deadZone) window.move('right');
        }
        
        // Add a small delay to prevent too rapid movement updates
        e.preventDefault(); // Prevent scrolling on mobile
    };

    const handleJoystickEnd = () => {
        isDragging = false;
        resetJoystick();
        currentDirection = { x: 0, y: 0 };
        
        // Stop all movements
        if (window.stopMove) {
            window.stopMove();
        }
    };

    // Handle X button events
    const handleXButtonPress = (e) => {
        e.preventDefault();
        
        // Try both methods to ensure interaction works
        // Method 1: Direct space key simulation
        const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
        document.dispatchEvent(spaceEvent);
        
        // Method 2: Try to use window.handleInteraction if available
        if (typeof window.handleInteraction === 'function') {
            window.handleInteraction();
        }
        
        // Method 3: Set buttonPressed.interact
        if (window.buttonPressed) {
            window.buttonPressed.interact = true;
        }
        
        // Visual feedback for button press
        xButton.classList.add('pressed');
    };

    const handleXButtonRelease = (e) => {
        e.preventDefault();
        
        // Release space key
        const spaceEvent = new KeyboardEvent('keyup', { key: ' ' });
        document.dispatchEvent(spaceEvent);
        
        // Reset buttonPressed state
        if (window.buttonPressed) {
            window.buttonPressed.interact = false;
        }
        
        // Remove visual feedback
        xButton.classList.remove('pressed');
    };

    // Touch events for joystick
    joystickBase.addEventListener('touchstart', handleJoystickStart, { passive: false });
    document.addEventListener('touchmove', handleJoystickMove, { passive: false });
    document.addEventListener('touchend', handleJoystickEnd);
    document.addEventListener('touchcancel', handleJoystickEnd);

    // Mouse events for joystick (for testing)
    joystickBase.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);

    // Prevent default touch behavior to avoid scrolling
    joystickBase.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // X button events
    xButton.addEventListener('touchstart', handleXButtonPress);
    xButton.addEventListener('touchend', handleXButtonRelease);
    xButton.addEventListener('mousedown', handleXButtonPress);
    xButton.addEventListener('mouseup', handleXButtonRelease);
});