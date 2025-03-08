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

    // Set up game container for visual effects
    const gameContainer = document.getElementById('gameCanvas').parentElement;
    gameContainer.style.position = 'relative';
    gameContainer.style.overflow = 'hidden';
    gameContainer.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.6)';
    gameContainer.style.backgroundColor = '#111';
    gameContainer.style.padding = '15px';

    // Create offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // Create darkness overlay canvas
    const darknessCanvas = document.createElement('canvas');
    darknessCanvas.id = 'darknessOverlay';
    darknessCanvas.width = canvas.width;
    darknessCanvas.height = canvas.height;
    darknessCanvas.style.position = 'absolute';
    darknessCanvas.style.marginTop = '35px';
    gameContainer.appendChild(darknessCanvas);
    
    // Get the context for the darkness canvas
    const darknessCtx = darknessCanvas.getContext('2d');

    // Add CRT style
    const crtStyle = document.createElement('style');
    crtStyle.textContent = `
        #gameCanvas {
            position: relative;
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
        }
    
        /* TV frame */
        #tvFrame {
            position: absolute;
            top: -20px;
            left: -20px;
            right: -20px;
            bottom: -20px;
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
        }
        
        /* Question box styles */
        #questionBox {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 500px;
            background-color: #111;
            border: 4px solid #00aa00;
            border-radius: 8px;
            color: #00ff00;
            padding: 20px;
            font-family: 'Courier New', monospace;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
            z-index: 2000;
            text-align: center;
        }
        
        #questionBox h2 {
            font-size: 24px;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
        }
        
        #questionBox p {
            font-size: 18px;
            margin-bottom: 30px;
        }
        
        #answerOptions {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .answer-button {
            background-color: #004400;
            color: #00ff00;
            border: 2px solid #00aa00;
            border-radius: 4px;
            padding: 10px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
            font-family: 'Courier New', monospace;
        }
        
        .answer-button:hover {
            background-color: #006600;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }
        
        .answer-button.correct {
            background-color: #008800;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.8);
        }
        
        .answer-button.incorrect {
            background-color: #880000;
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
            border-color: #aa0000;
        }
    `;
    document.head.appendChild(crtStyle);

    // Light properties
    const lightSettings = {
        radius: 80,         // Size of the light circle
        softness: 30,       // Edge softness
        intensity: 0.9,     // Light intensity (1 = full bright, 0 = no light)
        flicker: true,      // Whether the light flickers
        flickerRange: 0.1,  // How much the light flickers
        color: 'rgba(0, 255, 0, 0.4)' // Light color with green tint
    };

    // Question system - configure questions and answers for each room
    const questions = {
        1: {
            question: "Welcome to the adventure! What's your favorite color?",
            answers: ["Green", "Blue", "Red", "Yellow"],
            correctIndex: 0, // Green is always correct for the first room
            explanation: "Green is the color of adventure! Welcome to your journey."
        },
        2: {
            question: "What is the capital of France?",
            answers: ["London", "Berlin", "Paris", "Madrid"],
            correctIndex: 2,
            explanation: "Paris is the capital of France."
        },
        3: {
            question: "What is 2 + 2?",
            answers: ["3", "4", "5", "22"],
            correctIndex: 1,
            explanation: "2 + 2 = 4"
        },
        4: {
            question: "Which planet is known as the Red Planet?",
            answers: ["Earth", "Venus", "Mars", "Jupiter"],
            correctIndex: 2,
            explanation: "Mars is known as the Red Planet due to its reddish appearance."
        },
        5: {
            question: "Who wrote 'Romeo and Juliet'?",
            answers: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
            correctIndex: 1,
            explanation: "William Shakespeare wrote 'Romeo and Juliet'."
        },
        6: {
            question: "What is the largest ocean on Earth?",
            answers: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
            correctIndex: 3,
            explanation: "The Pacific Ocean is the largest ocean on Earth."
        },
        7: {
            question: "Which element has the chemical symbol 'O'?",
            answers: ["Oxygen", "Gold", "Silver", "Osmium"],
            correctIndex: 0,
            explanation: "Oxygen has the chemical symbol 'O'."
        },
        8: {
            question: "How many sides does a hexagon have?",
            answers: ["5", "6", "7", "8"],
            correctIndex: 1,
            explanation: "A hexagon has 6 sides."
        },
        9: {
            question: "What is the closest star to Earth?",
            answers: ["Proxima Centauri", "Alpha Centauri", "Polaris", "The Sun"],
            correctIndex: 3,
            explanation: "The Sun is the closest star to Earth."
        },
        10: {
            question: "Which animal is known as the 'King of the Jungle'?",
            answers: ["Tiger", "Elephant", "Lion", "Giraffe"],
            correctIndex: 2,
            explanation: "The Lion is known as the 'King of the Jungle'."
        },
        11: {
            question: "What is the largest planet in our solar system?",
            answers: ["Earth", "Saturn", "Jupiter", "Neptune"],
            correctIndex: 2,
            explanation: "Jupiter is the largest planet in our solar system."
        },
        12: {
            question: "Which of these is NOT a programming language?",
            answers: ["Java", "Python", "Cobra", "HTML"],
            correctIndex: 3,
            explanation: "HTML is a markup language, not a programming language."
        },
        13: {
            question: "What is the capital of Japan?",
            answers: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
            correctIndex: 2,
            explanation: "Tokyo is the capital of Japan."
        },
        14: {
            question: "Which instrument has 88 keys?",
            answers: ["Guitar", "Violin", "Drums", "Piano"],
            correctIndex: 3,
            explanation: "A standard piano has 88 keys."
        },
        15: {
            question: "What is the hardest natural substance on Earth?",
            answers: ["Diamond", "Gold", "Iron", "Steel"],
            correctIndex: 0,
            explanation: "Diamond is the hardest natural substance on Earth."
        },
        16: {
            question: "How many continents are there on Earth?",
            answers: ["5", "6", "7", "8"],
            correctIndex: 2,
            explanation: "There are 7 continents on Earth."
        },
        17: {
            question: "Who painted the Mona Lisa?",
            answers: ["Van Gogh", "Da Vinci", "Picasso", "Michelangelo"],
            correctIndex: 1,
            explanation: "Leonardo Da Vinci painted the Mona Lisa."
        },
        18: {
            question: "What's the smallest prime number?",
            answers: ["0", "1", "2", "3"],
            correctIndex: 2,
            explanation: "2 is the smallest prime number."
        },
        19: {
            question: "Which of these is NOT a noble gas?",
            answers: ["Helium", "Neon", "Chlorine", "Argon"],
            correctIndex: 2,
            explanation: "Chlorine is a halogen, not a noble gas."
        },
        20: {
            question: "What's the capital of Australia?",
            answers: ["Sydney", "Melbourne", "Perth", "Canberra"],
            correctIndex: 3,
            explanation: "Canberra is the capital of Australia, not Sydney."
        },
        21: {
            question: "Which animal is known for its black and white stripes?",
            answers: ["Giraffe", "Zebra", "Tiger", "Panda"],
            correctIndex: 1,
            explanation: "Zebras are known for their distinctive black and white stripes."
        },
        22: {
            question: "What is the most spoken language in the world?",
            answers: ["English", "Spanish", "Hindi", "Mandarin"],
            correctIndex: 3,
            explanation: "Mandarin Chinese is the most spoken language in the world."
        },
        23: {
            question: "Which of these is NOT a primary color?",
            answers: ["Red", "Blue", "Green", "Yellow"],
            correctIndex: 3,
            explanation: "Yellow is a primary color in pigment but not in light (RGB)."
        },
        24: {
            question: "What is the final test. What lies beyond knowledge?",
            answers: ["Power", "Wisdom", "Truth", "Understanding"],
            correctIndex: 1,
            explanation: "With knowledge comes wisdom, the ultimate treasure."
        }
    };

    const floorImages = {
        1: '/assets/floor1.png',
        2: '/assets/floor2.png',
        3: '/assets/floor3.png',
        4: '/assets/floor1.png',
        5: '/assets/floor2.png',
        6: '/assets/floor3.png',
        7: '/assets/floor1.png',
        8: '/assets/floor2.png',
        9: '/assets/floor3.png',
        10: '/assets/floor1.png',
        11: '/assets/floor2.png',
        12: '/assets/floor3.png',
        13: '/assets/floor1.png',
        14: '/assets/floor2.png',
        15: '/assets/floor3.png',
        16: '/assets/floor1.png',
        17: '/assets/floor2.png',
        18: '/assets/floor3.png',
        19: '/assets/floor1.png',
        20: '/assets/floor2.png',
        21: '/assets/floor3.png',
        22: '/assets/floor1.png',
        23: '/assets/floor2.png',
        24: '/assets/floor3.png',
    };

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
    let questionBoxVisible = false;

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
            const roomQuestion = questions[roomId] || questions[1]; // Fallback to room 1 if no question defined
            
            chests[roomId] = {
                x: canvas.width / 2 - Math.random() * 50,
                y: canvas.height / 2 - Math.random() * 50,
                width: 35,
                height: 35,
                question: roomQuestion.question,
                answers: roomQuestion.answers,
                correctIndex: roomQuestion.correctIndex,
                explanation: roomQuestion.explanation,
                opened: false,
                solved: false 
            };
        }

        // Make the first chest pre-solved for easier start
        chests[1].solved = true;
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

            if (doorImage.complete && lockedDoorImage.complete) {
                if (doorLocked) {
                    // Draw locked door using the locked door image
                    ctx.drawImage(lockedDoorImage, x, y, width, height);
                } else {
                    // Draw unlocked door
                    ctx.drawImage(doorImage, x, y, width, height);
                }
            } else {
                // Fallback if door images aren't loaded
                ctx.fillStyle = doorLocked ? "#FF0000" : "#8B4513"; // Wood color for unlocked doors
                ctx.fillRect(x, y, width, height);

                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, width, height);

                // Draw door panel
                ctx.fillStyle = doorLocked ? "#FF6666" : "#A0522D"; // Darker wood color
                const panelPadding = 10;
                ctx.fillRect(x + panelPadding, y + panelPadding,
                    width - panelPadding * 2, height - panelPadding * 2);
            }
        });
    }

    function drawPopup() {
        if (!isPopupOpen || questionBoxVisible) return;

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

    // Function to draw the darkness when a question is active
    function drawQuestionDarkness() {
        if (!questionBoxVisible) return;
        
        // Create complete darkness
        darknessCtx.clearRect(0, 0, darknessCanvas.width, darknessCanvas.height);
        darknessCtx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        darknessCtx.fillRect(0, 0, darknessCanvas.width, darknessCanvas.height);
    }

    // Function to draw the darkness with a light around the player
    function drawDarkness() {
        if (!window.player || questionBoxVisible) return;
        
        // Get player center position
        const playerCenterX = window.player.x + window.player.width / 2;
        const playerCenterY = window.player.y + window.player.height / 2;
        
        // Calculate light radius with optional flicker
        let lightRadius = lightSettings.radius;
        if (lightSettings.flicker) {
            const flicker = Math.random() * lightSettings.flickerRange * 2 - lightSettings.flickerRange;
            lightRadius += flicker * lightRadius;
        }
        
        // Clear the previous frame
        darknessCtx.clearRect(0, 0, darknessCanvas.width, darknessCanvas.height);
        
        // Create a dark overlay with a hole for the light
        darknessCtx.save();
        
        // Create darkness
        darknessCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        darknessCtx.fillRect(0, 0, darknessCanvas.width, darknessCanvas.height);
        
        // Create light circle
        darknessCtx.globalCompositeOperation = 'destination-out';
        
        // Create gradient for soft edges
        const gradient = darknessCtx.createRadialGradient(
            playerCenterX, playerCenterY, 0,
            playerCenterX, playerCenterY, lightRadius + lightSettings.softness
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); // Full transparency at center
        gradient.addColorStop(lightSettings.intensity, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Full darkness at edge
        
        darknessCtx.fillStyle = gradient;
        darknessCtx.beginPath();
        darknessCtx.arc(playerCenterX, playerCenterY, lightRadius + lightSettings.softness, 0, Math.PI * 2);
        darknessCtx.fill();
        
        // Add a subtle colored glow for the light
        darknessCtx.globalCompositeOperation = 'source-over';
        const glowGradient = darknessCtx.createRadialGradient(
            playerCenterX, playerCenterY, 0,
            playerCenterX, playerCenterY, lightRadius
        );
        
        glowGradient.addColorStop(0, lightSettings.color);
        glowGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        
        darknessCtx.fillStyle = glowGradient;
        darknessCtx.beginPath();
        darknessCtx.arc(playerCenterX, playerCenterY, lightRadius, 0, Math.PI * 2);
        darknessCtx.fill();
        
        darknessCtx.restore();
        
        // Optional: Add some light particles for atmosphere
        if (Math.random() > 0.8) {
            const particleCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * lightRadius * 0.8;
                const particleX = playerCenterX + Math.cos(angle) * distance;
                const particleY = playerCenterY + Math.sin(angle) * distance;
                const size = Math.random() * 2 + 1;
                
                darknessCtx.fillStyle = 'rgba(100, 255, 100, 0.5)';
                darknessCtx.beginPath();
                darknessCtx.arc(particleX, particleY, size, 0, Math.PI * 2);
                darknessCtx.fill();
            }
        }
    }

    // Random flicker effect
    function randomFlicker() {
        if (Math.random() > 0.97) {
            canvas.style.opacity = '0.87';
            canvas.style.filter = 'brightness(1.1) contrast(1.2) sepia(0.2) hue-rotate(40deg) saturate(1.5) blur(1px)';
            canvas.style.marginTop = '35px';
            setTimeout(() => {
                canvas.style.opacity = '1';
                canvas.style.filter = 'brightness(1.1) contrast(1.2) sepia(0.2) hue-rotate(40deg) saturate(1.5)';
            }, 50 + Math.random() * 50);
        }
        
        requestAnimationFrame(randomFlicker);
    }
    
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
        if (isRoomTransitioning || isPopupOpen || questionBoxVisible) return false;

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

    window.renderGame = function() {
        // Save the current context state
        ctx.save();
        
        // Clear the canvas with a dark background
        ctx.fillStyle = '#001100';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Call the original render function
        renderGame();
        
        // Restore the context state
        ctx.restore();
    };

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

        if (parseInt(newRoomId) === 24 && !window.isMultiplayer) {
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

    // Function to show the question box
    function showQuestionBox() {
        if (questionBoxVisible) return;
        
        const currentChest = chests[roomSystem.currentRoom];
        if (!currentChest) return;
        
        questionBoxVisible = true;
        
        // Create question box
        const questionBox = document.createElement('div');
        questionBox.id = 'questionBox';
        
        // Room name and question
        questionBox.innerHTML = `
            <h2>${roomSystem.roomNames[roomSystem.currentRoom]}</h2>
            <p>${currentChest.question}</p>
            <div id="answerOptions"></div>
        `;
        
        document.body.appendChild(questionBox);
        
        // Add answer options
        const answerOptions = document.getElementById('answerOptions');
        
        currentChest.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-button';
            button.textContent = answer;
            button.dataset.index = index;
            
            button.addEventListener('click', function() {
                handleAnswerClick(parseInt(this.dataset.index));
            });
            
            answerOptions.appendChild(button);
        });
        
        // Make sure the canvas still has focus for keyboard events
        canvas.focus();
        
        // Update darkness for question mode
        drawQuestionDarkness();
    }

    // Function to handle answer clicks
    function handleAnswerClick(answerIndex) {
        const currentChest = chests[roomSystem.currentRoom];
        const answerButtons = document.querySelectorAll('.answer-button');
        
        // Disable all buttons to prevent multiple clicks
        answerButtons.forEach(button => {
            button.disabled = true;
        });
        
        // Highlight the correct and incorrect answers
        answerButtons.forEach((button, index) => {
            if (index === currentChest.correctIndex) {
                button.classList.add('correct');
            } else if (index === answerIndex && answerIndex !== currentChest.correctIndex) {
                button.classList.add('incorrect');
            }
        });
        
        if (answerIndex === currentChest.correctIndex) {
            // Correct answer
            setTimeout(() => {
                // Add explanation to the question box
                const questionBox = document.getElementById('questionBox');
                questionBox.innerHTML += `
                    <p style="color: #00ff00; margin-top: 20px;">${currentChest.explanation}</p>
                    <button id="continueButton" class="answer-button" style="margin-top: 20px;">Continue</button>
                `;
                
                document.getElementById('continueButton').addEventListener('click', function() {
                    closeQuestionBox(true);
                });
            }, 1000);
        } else {
            // Incorrect answer
            setTimeout(() => {
                // Add try again button
                const questionBox = document.getElementById('questionBox');
                questionBox.innerHTML += `
                    <p style="color: #ff6666; margin-top: 20px;">Incorrect. Try again!</p>
                    <button id="tryAgainButton" class="answer-button" style="margin-top: 20px;">Try Again</button>
                `;
                
                document.getElementById('tryAgainButton').addEventListener('click', function() {
                    // Recreate the question box
                    document.body.removeChild(questionBox);
                    questionBoxVisible = false;
                    showQuestionBox();
                });
            }, 1000);
        }
    }

    // Function to close the question box
    function closeQuestionBox(solved) {
        const questionBox = document.getElementById('questionBox');
        if (questionBox) {
            document.body.removeChild(questionBox);
        }
        
        questionBoxVisible = false;
        
        if (solved) {
            // Mark the chest as solved
            const currentChest = chests[roomSystem.currentRoom];
            currentChest.opened = true;
            currentChest.solved = true;
            
            // Show success message
            updatePuzzleStatus();
            
            // Increase light radius temporarily to celebrate
            const originalRadius = lightSettings.radius;
            lightSettings.radius = originalRadius * 2;
            
            setTimeout(() => {
                lightSettings.radius = originalRadius;
            }, 1500);
        }
    }

    function handleInteraction() {
        if (isRoomTransitioning || isPopupOpen || questionBoxVisible) return;
        if (interactionCooldown > 0) return;
        
        interactionCooldown = 500; 
        
        if (isPlayerNearChest()) {
            const currentChest = chests[roomSystem.currentRoom];
            
            if (currentChest.solved) {
                // If already solved, do nothing
            } else {
                // Show question
                showQuestionBox();
            }
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
        if (!isPopupOpen || questionBoxVisible) return;

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
        
        if (questionBoxVisible) {
            drawQuestionDarkness();
        } else {
            drawDarkness();
        }

        if (!timerPaused) {
            updateTimerDisplay();
        }

        window.renderGame();
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
        for (let roomId = 2; roomId <= 24; roomId++) {
            if (chests[roomId]) {
                chests[roomId].opened = false;
                chests[roomId].solved = false;
            }
        }
        // Make room 1 always solved
        chests[1].solved = true;
        
        initTimer();
        updatePuzzleStatus();
        
        // Close any open question box
        if (questionBoxVisible) {
            closeQuestionBox(false);
        }
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

    // Function to update questions and answers (for code modification)
    window.updateQuestionData = function(roomId, questionData) {
        if (!roomId || !questionData) return false;
        
        // Update the questions object
        questions[roomId] = {
            question: questionData.question || "Default question?",
            answers: questionData.answers || ["Yes", "No", "Maybe", "I don't know"],
            correctIndex: questionData.correctIndex || 0,
            explanation: questionData.explanation || "That's correct!"
        };
        
        // Update chest if already initialized
        if (chests[roomId]) {
            chests[roomId].question = questions[roomId].question;
            chests[roomId].answers = questions[roomId].answers;
            chests[roomId].correctIndex = questions[roomId].correctIndex;
            chests[roomId].explanation = questions[roomId].explanation;
        }
        
        return true;
    };

    function initGame() {
        loadFloorImages();
        initializeChests();
        addDeadEndsAndModifyConnections();
        generateDoors();

        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height / 2 - player.height / 2;

        canvas.addEventListener('click', handlePopupClick);
        initTimer();
        updatePuzzleStatus();
        
        // Start visual effects
        randomFlicker();
        addRandomNoise();
        setTimeout(convertToGreenPhosphor, 100);
        
        // Render initial game state
        window.renderGame();

        // Start game loop
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