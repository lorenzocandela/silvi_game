document.addEventListener('DOMContentLoaded', function() {

    window.buttonPressed = window.buttonPressed || {
        up: false,
        down: false,
        left: false,
        right: false,
        interact: false
    };

    if (typeof window.handleInteraction !== 'function') {
        window.handleInteraction = function() {
            if (window.isPlayerNearChest && typeof window.isPlayerNearChest === 'function') {
                const near = window.isPlayerNearChest();
                if (near && !window.questionBoxVisible) {
                    console.log("Player is near chest, attempting interaction");

                    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
                    document.dispatchEvent(spaceEvent);

                    setTimeout(() => {
                        document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
                    }, 100);
                }
            }
        };
    }

    const oldControls = document.querySelector('.controls');
    if (oldControls) {
        oldControls.remove();
    }

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'game-controls-container';
    document.body.appendChild(controlsContainer);

    const joystickContainer = document.createElement('div');
    joystickContainer.className = 'joystick-container';
    controlsContainer.appendChild(joystickContainer);

    const joystickBase = document.createElement('div');
    joystickBase.className = 'joystick-base';
    joystickContainer.appendChild(joystickBase);

    const joystickHandle = document.createElement('div');
    joystickHandle.className = 'joystick-handle';
    joystickBase.appendChild(joystickHandle);

    const xButtonContainer = document.createElement('div');
    xButtonContainer.className = 'x-button-container';
    controlsContainer.appendChild(xButtonContainer);

    const xButton = document.createElement('button');
    xButton.className = 'x-button';
    const xButtonSpan = document.createElement('span');
    const xButtonImg = document.createElement('img');
    xButtonImg.src = '/assets/interagisci.png';
    xButtonImg.style.marginTop = '3px';
    xButtonImg.style.marginRight = '2px';
    xButtonImg.style.width = '34px';
    xButtonSpan.appendChild(xButtonImg);
    xButton.appendChild(xButtonSpan);
    xButtonContainer.appendChild(xButton);

    let isDragging = false;
    let joystickBaseRect = joystickBase.getBoundingClientRect();
    const baseRadius = joystickBaseRect.width / 2;
    const handleRadius = joystickHandle.offsetWidth / 2;
    let currentDirection = { x: 0, y: 0 };

    const resetJoystick = () => {
        joystickHandle.style.transform = 'translate(-50%, -50%)';
    };

    resetJoystick();

    const handleJoystickStart = (e) => {
        isDragging = true;
        joystickBaseRect = joystickBase.getBoundingClientRect();
        handleJoystickMove(e);
    };

    const handleJoystickMove = (e) => {
        if (!isDragging) return;

        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        const centerX = joystickBaseRect.left + baseRadius;
        const centerY = joystickBaseRect.top + baseRadius;
        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > (baseRadius - handleRadius)) {
            const angle = Math.atan2(deltaY, deltaX);
            deltaX = Math.cos(angle) * (baseRadius - handleRadius);
            deltaY = Math.sin(angle) * (baseRadius - handleRadius);
        }

        joystickHandle.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

        const deadZone = 0.4; 
        const maxRadius = baseRadius - handleRadius;
        const normalizedX = Math.abs(deltaX) < deadZone * maxRadius ? 0 : deltaX / maxRadius;
        const normalizedY = Math.abs(deltaY) < deadZone * maxRadius ? 0 : deltaY / maxRadius;

        if (window.stopMove) {
            window.stopMove();
        }

        currentDirection = { x: normalizedX, y: normalizedY };

        if (Math.abs(normalizedY) > Math.abs(normalizedX)) {

            if (normalizedY < -deadZone) window.move('up');
            else if (normalizedY > deadZone) window.move('down');
        } else {

            if (normalizedX < -deadZone) window.move('left');
            else if (normalizedX > deadZone) window.move('right');
        }

        e.preventDefault(); 
    };

    const handleJoystickEnd = () => {
        isDragging = false;
        resetJoystick();
        currentDirection = { x: 0, y: 0 };

        if (window.stopMove) {
            window.stopMove();
        }
    };

    const handleXButtonPress = (e) => {
        e.preventDefault();

        const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
        document.dispatchEvent(spaceEvent);

        if (typeof window.handleInteraction === 'function') {
            window.handleInteraction();
        }

        if (window.buttonPressed) {
            window.buttonPressed.interact = true;
        }

        xButton.classList.add('pressed');
    };

    const handleXButtonRelease = (e) => {
        e.preventDefault();

        const spaceEvent = new KeyboardEvent('keyup', { key: ' ' });
        document.dispatchEvent(spaceEvent);

        if (window.buttonPressed) {
            window.buttonPressed.interact = false;
        }

        xButton.classList.remove('pressed');
    };

    joystickBase.addEventListener('touchstart', handleJoystickStart, { passive: false });
    document.addEventListener('touchmove', handleJoystickMove, { passive: false });
    document.addEventListener('touchend', handleJoystickEnd);
    document.addEventListener('touchcancel', handleJoystickEnd);

    joystickBase.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);

    joystickBase.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    xButton.addEventListener('touchstart', handleXButtonPress);
    xButton.addEventListener('touchend', handleXButtonRelease);
    xButton.addEventListener('mousedown', handleXButtonPress);
    xButton.addEventListener('mouseup', handleXButtonRelease);
});