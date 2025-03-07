//MAIN.js
document.addEventListener('DOMContentLoaded', function() {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const playerSprite = new Image();
    playerSprite.src = '/assets/player_sprites.png';
    const doorImage = new Image();
    doorImage.src = '/assets/door.png';
    const lockedDoorImage = new Image();
    lockedDoorImage.src = '/assets/door-locked.png';
    const chestImage = new Image();
    chestImage.src = '/assets/chest.png';
    const floorImage = new Image();
    floorImage.src = '/assets/floor.png';
    
    window.canvas = canvas;
    window.ctx = ctx;
    window.playerSprite = playerSprite;
    window.lockedDoorImage = lockedDoorImage;
    window.doorImage = doorImage;
    window.chestImage = chestImage;
    window.floorImage = floorImage;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    const gameContainer = document.getElementById('gameCanvas').parentElement;
    gameContainer.style.position = 'relative';
    gameContainer.style.overflow = 'hidden';
    gameContainer.style.borderRadius = '20px';
    gameContainer.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.6)';
    gameContainer.style.backgroundColor = '#111';
    gameContainer.style.padding = '15px';

    const floorImages = {
        // 1: '/assets/floor1.png',
        // 2: '/assets/floor2.png',
        // Altre stanze...
    };

    const crtStyle = document.createElement('style');
    crtStyle.textContent = `
        #gameCanvas {
            position: relative;
            border-radius: 20px;
            transform: scale(0.98); /* Slight scale for curved effect */
            filter: 
                brightness(1.1)
                contrast(1.2)
                sepia(0.2)
                hue-rotate(40deg) /* Gives that green phosphor look */
                saturate(1.5);
            box-shadow: 
                inset 0 0 10px rgba(0, 255, 0, 0.3),
                0 0 7px rgba(0, 255, 0, 0.7);
        }
    
        #crtOverlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                rgba(18, 16, 16, 0) 50%, 
                rgba(0, 0, 0, 0.1) 50%
            );
            background-size: 100% 4px;
            z-index: 1000;
            pointer-events: none;
            border-radius: 20px;
            opacity: 0.3;
        }
        
        #crtGlow {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            box-shadow: 
                inset 0 0 50px rgba(0, 255, 0, 0.2),
                inset 0 0 20px rgba(0, 255, 0, 0.3),
                inset 0 0 10px rgba(0, 255, 0, 0.4);
            z-index: 1001;
            pointer-events: none;
            border-radius: 20px;
        }
        
        #crtVignette {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(
                circle at center,
                transparent 50%,
                rgba(0, 0, 0, 0.5) 100%
            );
            z-index: 999;
            pointer-events: none;
            border-radius: 20px;
        }
    
        /* TV frame */
        #tvFrame {
            position: absolute;
            top: -20px;
            left: -20px;
            right: -20px;
            bottom: -20px;
            border-radius: 30px;
            background-color: #222;
            z-index: -1;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
        }
        
        /* Green pixels effect */
        #pixelOverlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2r9//38gYGKAAGMBIMAACnIDEoYj15QAAAAASUVORK5CYII=');
            background-repeat: repeat;
            opacity: 0.1;
            z-index: 998;
            pointer-events: none;
            border-radius: 20px;
        }
    `;
    document.head.appendChild(crtStyle);
    
    // Random flicker effect
    function randomFlicker() {
        if (Math.random() > 0.97) {
            canvas.style.opacity = '0.87';
            canvas.style.filter = 'brightness(1.1) contrast(1.2) sepia(0.2) hue-rotate(40deg) saturate(1.5) blur(1px)';
            setTimeout(() => {
                canvas.style.opacity = '1';
                canvas.style.filter = 'brightness(1.1) contrast(1.2) sepia(0.2) hue-rotate(40deg) saturate(1.5)';
            }, 50 + Math.random() * 50);
        }
        
        requestAnimationFrame(randomFlicker);
    }
    randomFlicker();
    
    const originalRenderGame = window.renderGame;
    window.renderGame = function() {
        // Save the current context state
        ctx.save();
        
        // Clear the canvas with a dark background
        ctx.fillStyle = '#001100';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Call the original render function
        originalRenderGame();
        
        // Restore the context state
        ctx.restore();
    }; 

    // Add random noise occasionally
    function addRandomNoise() {
        if (Math.random() > 0.98) {
            ctx.save();
            ctx.globalAlpha = 0.03;
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const width = Math.random() * 5 + 1;
                const height = Math.random() * 2 + 1;
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(x, y, width, height);
            }
            ctx.restore();
        }
        
        setTimeout(addRandomNoise, 200);
    }
    addRandomNoise();

// Change the colors of everything to green-ish
function convertToGreenPhosphor() {
    // Update player sprite colors
    if (window.player && window.player.color) {
        window.player.color = '#00ff00';
    }
    
    // Update chest colors
    for (const roomId in chests) {
        if (chests[roomId].color) {
            chests[roomId].color = '#00aa00';
        }
    }
    
    // Update text colors
    const textElements = document.querySelectorAll('.puzzle-solved, .puzzle-unsolved, #roomName, #timer');
    textElements.forEach(el => {
        el.style.color = '#00ff00';
        el.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.7)';
    });
    
    // Update game UI
    document.body.style.backgroundColor = '#111';
    const controlsDiv = document.querySelector('.controls');
    if (controlsDiv) {
        controlsDiv.style.backgroundColor = '#222';
        controlsDiv.querySelectorAll('button').forEach(btn => {
            btn.style.backgroundColor = '#004400';
            btn.style.color = '#00ff00';
            btn.style.borderColor = '#00aa00';
        });
    }
}
setTimeout(convertToGreenPhosphor, 100);

    const floorImagesLoaded = {};

    const spriteWidth = 64; 
    const spriteHeight = 96; 
    const columns = 4; 

    window.spriteWidth = spriteWidth;
    window.spriteHeight = spriteHeight;

    let player = {
        x: 140,
        y: 140,
        width: spriteWidth * 0.5,
        height: spriteHeight * 0.5,
        speed: 4
    };

    window.player = player;

    const roomSystem = {
        connections: {

            1: [2, 5, 6], 
            2: [1, 3, 7], 
            3: [2, 4, 8], 
            4: [3], 

            5: [1, 9, 10], 
            6: [1, 11], 
            7: [2, 12, 13], 
            8: [3, 14], 

            9: [5, 15], 
            10: [5], 
            11: [6, 16, 17], 
            12: [7], 

            13: [7, 18], 
            14: [8, 19], 
            15: [9, 20], 
            16: [11], 
            17: [11, 21], 
            18: [13, 22], 
            19: [14, 22], 
            20: [15, 23], 
            21: [17, 23], 

            22: [18, 19, 24], 
            23: [20, 21, 24], 

            24: [22, 23] 
        },
        currentRoom: 1,
        roomNames: {

            1: "Entrance Hall",
            2: "Main Corridor",
            3: "Dusty Passage",
            4: "Abandoned Storeroom", 

            5: "Eastern Hallway",
            6: "Western Corridor",
            7: "Grand Staircase",
            8: "Forgotten Library",
            9: "Armory",
            10: "Empty Guard Room", 
            11: "Dining Hall",
            12: "Collapsed Passage", 

            13: "Upper Balcony",
            14: "Secret Study",
            15: "Knight's Chamber",
            16: "Kitchen Ruins", 
            17: "Wine Cellar",
            18: "Observatory",
            19: "Alchemy Lab",
            20: "Throne Room",
            21: "Hidden Tunnel",

            22: "Northern Gateway",
            23: "Southern Gateway",

            24: "Treasure Chamber"
        },

        doorPositions: {},

        doorColors: {},

        doors: {}
    };

    window.roomSystem = roomSystem;

    let chests = {};
    let isPopupOpen = false;
    let popupText = "";
    let interactionCooldown = 0;

    let currentDirection = 0; 
    let frameIndex = 0;
    let animationTimer = 0;
    const ANIMATION_SPEED = 100; 

    window.currentDirection = currentDirection;
    window.frameIndex = frameIndex;

    let lastTime = 0;
    let isRoomTransitioning = false;

    let transitionAlpha = 0;
    let transitionDirection = 'in'; 
    let transitionNewRoomId = null;

    let keysPressed = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        ' ': false, 
        'e': false 
    };

    let buttonPressed = {
        up: false,
        down: false,
        left: false,
        right: false,
        interact: false 
    };

    function getFloorImageForRoom(roomId) {

        if (floorImages[roomId] && floorImagesLoaded[roomId]) {
            return floorImagesLoaded[roomId];
        }

        return floorImage;
    }

    function loadFloorImages() {

        floorImage.onload = () => {
            //console.log("Immagine del pavimento di default caricata");
        };

        for (const roomId in floorImages) {
            const img = new Image();
            img.src = floorImages[roomId];
            img.onload = () => {
                //console.log(`Immagine del pavimento per la stanza ${roomId} caricata`);
                floorImagesLoaded[roomId] = img;
            };
        }
    }

    function initializeChests() {
        for (let roomId = 1; roomId <= 24; roomId++) {
            chests[roomId] = {
                x: canvas.width / 2 - Math.random() * 50,
                y: canvas.height / 2 - Math.random() * 50,
                width: 35,
                height: 35,
                content: `You found a secret message in ${roomSystem.roomNames[roomId] || "Room " + roomId}!`,
                opened: false,
                solved: false 
            };
        }

        chests[1].content = "Welcome to your adventure! Explore all rooms to discover the secrets.";
        chests[1].solved = true;
        chests[13].content = "You found the treasure vault! But the real treasure is the knowledge you gained along the way.";
        chests[14].content = "This hidden sanctuary contains ancient wisdom: 'The journey matters more than the destination.'";
        chests[15].content = "15!";
    }

    function initializeDoorAttributes() {
        for (const roomId in roomSystem.connections) {
            roomSystem.doorPositions[roomId] = {};
            roomSystem.doorColors[roomId] = {};
    
            const connectedRooms = roomSystem.connections[roomId];
            const positions = ["left", "right", "top", "bottom"];            
            for (let i = positions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [positions[i], positions[j]] = [positions[j], positions[i]];
            }
    
            connectedRooms.forEach((targetRoom, index) => {
                const position = positions[index % positions.length];
                if (!roomSystem.doorPositions[roomId][targetRoom]) {
                    roomSystem.doorPositions[roomId][targetRoom] = position;
                    const hue = Math.floor(Math.random() * 360);
                    roomSystem.doorColors[roomId][targetRoom] = `hsl(${hue}, 70%, 60%)`;
                }
            });
        }
    }

    function addDeadEndsAndModifyConnections() {
        // Create a copy of the original connections to use as reference
        const originalConnections = JSON.parse(JSON.stringify(roomSystem.connections));
        
        // Add some dead-end rooms (rooms that lead nowhere)
        const deadEndRooms = [9, 10, 12, 16, 19, 21];
        // Remove some two-way connections and make them one-way
        const oneWayConnections = [
            {from: 2, to: 7},  // Can go from 2 to 7, but not back
            {from: 3, to: 8},  // Can go from 3 to 8, but not back
            {from: 5, to: 10}, // Can go from 5 to 10, but not back
            {from: 11, to: 16} // Can go from 11 to 16, but not back
        ];
        
        oneWayConnections.forEach(conn => {
            const backConnections = roomSystem.connections[conn.to];
            if (backConnections) {
                roomSystem.connections[conn.to] = backConnections.filter(room => room !== conn.from);
            }
        });
        
        const additionalConnections = [
            {from: 1, to: 8},   // Connect entrance to a later room
            {from: 4, to: 10},  // Connect dead-end to another room
            {from: 14, to: 17}, // Create a shortcut
            {from: 9, to: 12}   // Create an additional path
        ];
        
        additionalConnections.forEach(conn => {
            if (!roomSystem.connections[conn.from].includes(conn.to)) {
                roomSystem.connections[conn.from].push(conn.to);
            }
            if (!roomSystem.connections[conn.to].includes(conn.from)) {
                roomSystem.connections[conn.to].push(conn.from);
            }
        });
        
        const pathToFinal = [
            {from: 22, to: 24},
            {from: 23, to: 24},
            {from: 18, to: 22},
            {from: 19, to: 22},
            {from: 20, to: 23},
            {from: 21, to: 23}
        ];
        
        pathToFinal.forEach(conn => {
            if (!roomSystem.connections[conn.from].includes(conn.to)) {
                roomSystem.connections[conn.from].push(conn.to);
            }
            if (!roomSystem.connections[conn.to].includes(conn.from)) {
                roomSystem.connections[conn.to].push(conn.from);
            }
        });
        
        //console.log("Room connections modified to add complexity");
    }

    function generateDoors() {

        if (Object.keys(roomSystem.doorPositions).length === 0) {
            initializeDoorAttributes();
        }

        for (const roomId in roomSystem.connections) {
            const connectedRooms = roomSystem.connections[roomId];
            roomSystem.doors[roomId] = [];

            connectedRooms.forEach((targetRoom) => {
                const position = roomSystem.doorPositions[roomId][targetRoom] || "left";
                const doorColor = roomSystem.doorColors[roomId][targetRoom] || "#FF5722";

                const offsetSeed = parseInt(roomId) * 100 + parseInt(targetRoom);
                const pseudoRandom = (offsetSeed * 9301 + 49297) % 233280 / 233280;
                const offset = 0.3 + pseudoRandom * 0.4; 

                roomSystem.doors[roomId].push({
                    toRoom: targetRoom,
                    position: position,
                    offset: offset,
                    color: doorColor
                });
            });
        }
    }

    function drawSprite() {
        if (!playerSprite.complete) return;

        ctx.drawImage(
            playerSprite,
            frameIndex * spriteWidth, currentDirection * spriteHeight, 
            spriteWidth, spriteHeight, 
            player.x, player.y, 
            player.width, player.height 
        );

        if (window.isMultiplayer) {
            ctx.fillStyle = "green";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("You", player.x + player.width / 2, player.y - 10);
        }
    }

    function drawChest() {
        const currentChest = chests[roomSystem.currentRoom];
        if (!currentChest) return;

        if (chestImage.complete) {

            ctx.drawImage(chestImage, currentChest.x, currentChest.y, currentChest.width, currentChest.height);
        } else {

            ctx.fillStyle = "#8B4513"; 
            ctx.fillRect(currentChest.x, currentChest.y, currentChest.width, currentChest.height);
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.strokeRect(currentChest.x, currentChest.y, currentChest.width, currentChest.height);

            ctx.fillStyle = "#FFD700"; 
            ctx.fillRect(currentChest.x + 15, currentChest.y + 20, 20, 5); 
        }
    }

    function drawRoom() {
        const currentFloorImage = getFloorImageForRoom(roomSystem.currentRoom);
        if (currentFloorImage.complete) {
            ctx.drawImage(currentFloorImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#f0e0c0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        const roomNameElement = document.getElementById('roomName');
        if (roomNameElement) {
            roomNameElement.textContent = `${roomSystem.currentRoom}: ${roomSystem.roomNames[roomSystem.currentRoom] || "Unknown Room"}`;
        }
        ctx.strokeStyle = "#8B4513";
        ctx.lineWidth = 8;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        if (roomSystem.doors[roomSystem.currentRoom]) {
            drawDoors(roomSystem.doors[roomSystem.currentRoom]);
        }
    }

    function drawDoors(doors) {
        doors.forEach(door => {
            let x = 0;
            let y = 0;
            let width = 50;
            let height = 70;

            switch (door.position) {
                case "top":
                    x = canvas.width * door.offset - width / 2;
                    y = 0;
                    break;
                case "right":
                    x = canvas.width - width;
                    y = canvas.height * door.offset - height / 2;
                    break;
                case "bottom":
                    x = canvas.width * door.offset - width / 2;
                    y = canvas.height - height;
                    break;
                case "left":
                    x = 0;
                    y = canvas.height * door.offset - height / 2;
                    break;
            }

            const doorLocked = !chests[roomSystem.currentRoom].solved;

            if (doorImage.complete) {
                if (doorLocked) {
                    ctx.drawImage(doorImage, x, y, width, height);
                    ctx.beginPath();
                } else {
                    ctx.drawImage(doorImage, x, y, width, height);
                }
            } else {

                ctx.fillStyle = doorLocked ? "#FF0000" : (door.color || "#FF5722");
                ctx.fillRect(x, y, width, height);

                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, width, height);

                ctx.fillStyle = doorLocked ? "#FF6666" : (door.color || "#FFB74D");
                const panelPadding = 10;
                ctx.fillRect(x + panelPadding, y + panelPadding,
                    width - panelPadding * 2, height - panelPadding * 2);

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
            }
        });
    }

    function drawPopup() {
        if (!isPopupOpen) return;

        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const popupWidth = 240;
        const popupHeight = 160;
        const popupX = (canvas.width - popupWidth) / 2;
        const popupY = (canvas.height - popupHeight) / 2;

        ctx.fillStyle = "#F5F5DC"; 
        ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
        ctx.strokeStyle = "#8B4513"; 
        ctx.lineWidth = 4;
        ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);

        ctx.fillStyle = "#000000";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const maxWidth = popupWidth - 20;
        const lines = wrapText(popupText, maxWidth);

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], canvas.width / 2, popupY + 50 + i * 20);
        }

        ctx.fillStyle = "#8B4513";
        ctx.fillRect(popupX + popupWidth / 2 - 40, popupY + popupHeight - 30, 80, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("Chiudi", popupX + popupWidth / 2, popupY + popupHeight - 20);

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }

    function drawTransition() {
        if (!isRoomTransitioning) return;

        ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function updateAnimation(deltaTime, isMoving) {
        if (isMoving) {
            animationTimer += deltaTime;

            if (animationTimer >= ANIMATION_SPEED) {
                frameIndex = (frameIndex + 1) % 4;
                window.frameIndex = frameIndex; 
                animationTimer = 0;
            }
        } else {

            frameIndex = 0;
            window.frameIndex = frameIndex; 
        }
    }

    function updateTransition(deltaTime) {
        if (!isRoomTransitioning) return;

        const fadeSpeed = 0.003; 

        if (transitionDirection === 'in') {

            transitionAlpha += fadeSpeed * deltaTime;

            if (transitionAlpha >= 1) {
                transitionAlpha = 1;
                transitionDirection = 'out';

                changeRoom(transitionNewRoomId);
            }
        } else {

            transitionAlpha -= fadeSpeed * deltaTime;

            if (transitionAlpha <= 0) {
                transitionAlpha = 0;
                isRoomTransitioning = false;
                transitionNewRoomId = null;
            }
        }
    }

    function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 &&
            x1 + w1 > x2 &&
            y1 < y2 + h2 &&
            y1 + h1 > y2;
    }

    function updateMovement() {

        if (isRoomTransitioning || isPopupOpen) return false;

        let moving = false;

        const moveUp = keysPressed.ArrowUp || buttonPressed.up;
        const moveDown = keysPressed.ArrowDown || buttonPressed.down;
        const moveLeft = keysPressed.ArrowLeft || buttonPressed.left;
        const moveRight = keysPressed.ArrowRight || buttonPressed.right;
        const interact = keysPressed[' '] || keysPressed['e'] || buttonPressed.interact;

        if (moveUp) {
            currentDirection = 3;
            window.currentDirection = currentDirection; 
            if (player.y > 0) player.y -= player.speed;
            moving = true;
        }
        if (moveDown) {
            currentDirection = 0;
            window.currentDirection = currentDirection; 
            if (player.y + player.height < canvas.height) player.y += player.speed;
            moving = true;
        }
        if (moveLeft) {
            currentDirection = 1;
            window.currentDirection = currentDirection; 
            if (player.x > 0) player.x -= player.speed;
            moving = true;
        }
        if (moveRight) {
            currentDirection = 2;
            window.currentDirection = currentDirection; 
            if (player.x + player.width < canvas.width) player.x += player.speed;
            moving = true;
        }

        if (interact) {
            handleInteraction();
        }

        if (moving) {
            checkDoorCollision();
        }

        if (interactionCooldown > 0) {
            interactionCooldown -= 16; 
            if (interactionCooldown < 0) interactionCooldown = 0;
        }

        return moving;
    }

    function renderGame() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawRoom();

        drawChest();

        drawSprite();

        drawPopup();
    }

    window.renderGame = renderGame;

    function showRoomTransition(newRoomId) {

        if (isRoomTransitioning) return;

        isRoomTransitioning = true;
        transitionDirection = 'in';
        transitionAlpha = 0;
        transitionNewRoomId = newRoomId;
    }

    function checkDoorCollision() {
        if (isRoomTransitioning) return;
        if (!chests[roomSystem.currentRoom].solved) {
            return;
        }

        const doors = roomSystem.doors[roomSystem.currentRoom] || [];

        for (const door of doors) {
            let x = 0;
            let y = 0;
            let width = 50;
            let height = 70;
            switch (door.position) {
                case "top":
                    x = canvas.width * door.offset - width / 2;
                    y = 0;
                    break;
                case "right":
                    x = canvas.width - width;
                    y = canvas.height * door.offset - height / 2;
                    break;
                case "bottom":
                    x = canvas.width * door.offset - width / 2;
                    y = canvas.height - height;
                    break;
                case "left":
                    x = 0;
                    y = canvas.height * door.offset - height / 2;
                    break;
            }
            if (player.x < x + width &&
                player.x + player.width > x &&
                player.y < y + height &&
                player.y + player.height > y) {
                showRoomTransition(door.toRoom);
                break;
            }
        }
    }

    function changeRoom(newRoomId) {
        roomSystem.currentRoom = newRoomId;
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height / 2 - player.height / 2;
        const roomNameElement = document.getElementById('roomName');
        if (roomNameElement) {
            roomNameElement.textContent = `${roomSystem.currentRoom}: ${roomSystem.roomNames[roomSystem.currentRoom] || "Unknown Room"}`;
        }

        updatePuzzleStatus();

        if (window.isMultiplayer && window.socket) {
            window.socket.emit('roomTransition', {
                gameCode: window.gameCode,
                newRoomId: newRoomId
            });
        }

        if (parseInt(newRoomId) === 15 && !window.isMultiplayer) {
            showVictoryMessage();
        }
    }

    function showVictoryMessage() {
        const victoryElement = document.createElement('div');
        victoryElement.className = 'victory-overlay';
        victoryElement.innerHTML = `
        <div class="victory-content">
            <h1>CONGRATULATIONS!</h1>
            <p>You reached the Treasure Chamber!</p>
            <p>But the true adventure is playing with a friend!</p>
            <button id="restartButton">Play Again</button>
        </div>
    `;
        document.body.appendChild(victoryElement);
        document.getElementById('restartButton').addEventListener('click', () => {
            document.body.removeChild(victoryElement);
            roomSystem.currentRoom = 1;
            player.x = canvas.width / 2 - player.width / 2;
            player.y = canvas.height / 2 - player.height / 2;
        });
    }

    function isPlayerNearChest() {
        const currentChest = chests[roomSystem.currentRoom];
        if (!currentChest) return false;

        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const chestCenterX = currentChest.x + currentChest.width / 2;
        const chestCenterY = currentChest.y + currentChest.height / 2;

        const distanceX = Math.abs(playerCenterX - chestCenterX);
        const distanceY = Math.abs(playerCenterY - chestCenterY);

        return distanceX < 40 && distanceY < 40;
    }

    function handleInteraction() {
        if (isRoomTransitioning || isPopupOpen) return;
        if (interactionCooldown > 0) return;
        interactionCooldown = 500; 
        if (isPlayerNearChest()) {
            const currentChest = chests[roomSystem.currentRoom];
            currentChest.opened = true;
            currentChest.solved = true;
            isPopupOpen = true;
            popupText = currentChest.content;
            updatePuzzleStatus();
        }
    }

    function updatePuzzleStatus() {
        const statusElement = document.getElementById('puzzleStatus');
        if (statusElement) {
            const isSolved = chests[roomSystem.currentRoom] && chests[roomSystem.currentRoom].solved;
            statusElement.textContent = isSolved ? "Puzzle Solved! Doors Unlocked" : "Find and solve the chest puzzle to unlock doors";
            statusElement.className = isSolved ? "puzzle-solved" : "puzzle-unsolved";
        }
    }

    function wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        ctx.font = "16px Arial";

        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && i > 0) {
                lines.push(currentLine);
                currentLine = words[i] + ' ';
            } else {
                currentLine = testLine;
            }
        }

        lines.push(currentLine);
        return lines;
    }

    function handlePopupClick(e) {
        if (!isPopupOpen) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const popupWidth = 240;
        const popupHeight = 160;
        const popupX = (canvas.width - popupWidth) / 2;
        const popupY = (canvas.height - popupHeight) / 2;
        const buttonX = popupX + popupWidth / 2 - 40;
        const buttonY = popupY + popupHeight - 30;
        const buttonWidth = 80;
        const buttonHeight = 20;

        if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
            clickY >= buttonY && clickY <= buttonY + buttonHeight) {
            isPopupOpen = false;
        }
    }

    function gameLoop(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        const isMoving = updateMovement();
        updateAnimation(deltaTime, isMoving);
        updateTransition(deltaTime);

        if (!timerPaused) {
            updateTimerDisplay();
        }

        renderGame();
        drawTransition();

        if (window.isMultiplayer && typeof window.drawOtherPlayer === 'function') {
            window.drawOtherPlayer();
        }

        requestAnimationFrame(gameLoop);
    }

    let gameTime = 30 * 60 * 1000; 
    let timerStartTime = 0;
    let timerPaused = true;

    function initTimer() {
        timerStartTime = Date.now();
        timerPaused = false;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        if (!timerElement) return;
        const remainingTime = Math.max(0, gameTime - (Date.now() - timerStartTime));
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (remainingTime <= 0 && !timerPaused) {
            timeUp();
        }
    }

    function timeUp() {
        timerPaused = true;
        const timeUpElement = document.createElement('div');
        timeUpElement.className = 'victory-overlay';
        timeUpElement.innerHTML = `
<div class="victory-content time-up">
<h1>TIME'S UP!</h1>
<p>You ran out of time. Try again!</p>
<button id="restartButton">Restart Game</button>
</div>
`;
        document.body.appendChild(timeUpElement);
        document.getElementById('restartButton').addEventListener('click', () => {
            document.body.removeChild(timeUpElement);
            resetGame();
        });
    }

    function resetGame() {
        roomSystem.currentRoom = 1;
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height / 2 - player.height / 2;
        for (let roomId = 2; roomId <= 15; roomId++) {
            if (chests[roomId]) {
                chests[roomId].opened = false;
                chests[roomId].solved = false;
            }
        }
        initTimer();
        updatePuzzleStatus();
    }

    function move(direction) {
        buttonPressed[direction] = true;

        if (direction === 'up') currentDirection = 3;
        if (direction === 'down') currentDirection = 0;
        if (direction === 'left') currentDirection = 1;
        if (direction === 'right') currentDirection = 2;

        window.currentDirection = currentDirection;
    }

    window.move = move;

    function stopMove(direction) {
        if (direction) {
            buttonPressed[direction] = false;
        } else {

            buttonPressed.up = false;
            buttonPressed.down = false;
            buttonPressed.left = false;
            buttonPressed.right = false;
        }
    }

    window.stopMove = stopMove;

    function initGame() {
        //console.log("Initializing game...");

        loadFloorImages();

        initializeChests();

        addDeadEndsAndModifyConnections();

        generateDoors();

        ////console.log("Doors generated for rooms:", Object.keys(roomSystem.doors));
        ////console.log("Current room:", roomSystem.currentRoom);
        //console.log("Doors in current room:", roomSystem.doors[roomSystem.currentRoom]);

        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height / 2 - player.height / 2;

        canvas.addEventListener('click', handlePopupClick);

        initTimer();

        updatePuzzleStatus();

        renderGame();

        lastTime = 0;
        requestAnimationFrame(gameLoop);
    }

    window.initGame = initGame;

    document.addEventListener('keydown', (event) => {
        if (event.key in keysPressed) {
            keysPressed[event.key] = true;
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key in keysPressed) {
            keysPressed[event.key] = false;
        }
    });

    const buttons = document.querySelectorAll('.controls button');
    buttons.forEach(button => {

        button.addEventListener('mousedown', () => {
            const direction = button.getAttribute('data-direction');
            if (direction) {
                move(direction);
            }
        });

        button.addEventListener('mouseup', () => {
            const direction = button.getAttribute('data-direction');
            if (direction) {
                stopMove(direction);
            }
        });

        button.addEventListener('mouseleave', () => {
            const direction = button.getAttribute('data-direction');
            if (direction) {
                stopMove(direction);
            }
        });

        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const direction = button.getAttribute('data-direction');
            if (direction) {
                move(direction);
            }
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            const direction = button.getAttribute('data-direction');
            if (direction) {
                stopMove(direction);
            }
        });
    });

    const controlsDiv = document.querySelector('.controls');
    if (controlsDiv) {
        const interactButton = document.createElement('button');
        interactButton.textContent = 'Interagisci';
        interactButton.className = 'interact-button';

        interactButton.addEventListener('mousedown', function() {
            buttonPressed.interact = true;
        });

        interactButton.addEventListener('mouseup', function() {
            buttonPressed.interact = false;
        });

        interactButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            buttonPressed.interact = true;
        });

        interactButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            buttonPressed.interact = false;
        });

        controlsDiv.appendChild(interactButton);
    }

    window.debugRoom = function() {
        //console.log("Debug: Forcing room display");
        renderGame();
    };

    if (typeof window.skipMainInit === 'undefined' || !window.skipMainInit) {
        //console.log("Initializing single player game");

        if (playerSprite.complete) {
            initGame();
        } else {
            playerSprite.onload = () => {
                //console.log("Sprite loaded!");
                initGame();
            };
        }
    } else {
        //console.log("Waiting for multiplayer initialization");
    }
});