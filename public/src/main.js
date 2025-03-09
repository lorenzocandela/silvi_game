document.addEventListener('DOMContentLoaded', function() {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const doorFrames = [];
    const DOOR_FRAME_COUNT = 8;
    let doorFramesLoaded = 0;

    for (let i = 1; i < DOOR_FRAME_COUNT; i++) {
        const frameImg = new Image();
        frameImg.onload = () => {
            doorFramesLoaded++;
        };
        frameImg.onerror = () => {
            console.error(`Caso di errore door ${i}, path: ${frameImg.src}`);
            frameImg.isErrored = true;
        };
        frameImg.src = `/assets/doors-gif/door${i}.png`;
        doorFrames.push(frameImg);
    }

    let doorAnimFrame = 0;
    let doorAnimTimer = 0;
    const DOOR_ANIM_SPEED = 50; // vel frame

    const playerSprite = new Image();
    playerSprite.src = '/assets/player_sprites.png';
    const doorImage = new Image();
    doorImage.src = '/assets/door.gif';
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

    const gameContainer = document.getElementById('gameCanvas').parentElement;
    gameContainer.style.position = 'relative';
    gameContainer.style.overflow = 'hidden';
    gameContainer.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.6)';
    gameContainer.style.backgroundColor = '#111';
    gameContainer.style.padding = '15px';

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    const darknessCanvas = document.createElement('canvas');
    darknessCanvas.id = 'darknessOverlay';
    darknessCanvas.width = canvas.width;
    darknessCanvas.height = canvas.height;
    darknessCanvas.style.position = 'absolute';
    darknessCanvas.style.marginTop = '35px';
    gameContainer.appendChild(darknessCanvas);

    const darknessCtx = darknessCanvas.getContext('2d');

    const crtStyle = document.createElement('style');
    crtStyle.textContent = `
        #gameCanvas {
            position: relative;
            transform: scale(0.98); 
            filter: 
                brightness(1.1)
                contrast(1.2)
                sepia(0.2)
                hue-rotate(40deg) 
                saturate(1.5);
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

        #questionBox {
            position: absolute;
            top: 250px;
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
            align-items: center;
        }

        .answer-button {
            background-color: #004400;
            color: #00ff00;
            border: 2px solid #00aa00;
            width: 100%;
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

    const lightSettings = {
        radius: 80,
        softness: 30,
        intensity: 0.9,
        flicker: true,
        flickerRange: 0.1,
        color: 'rgba(0, 255, 0, 0.4)'
    };

    //TODO: Domande e risposte Enigmi/Canzoni
    const questions = {
        1: {
            question: "BENVUT* NEL LABIRINTO SILVI! DUE SEMPLICI REGOLE: 1. RISPONDI CORRETTAMENTE ALLE DOMANDE E SBLOCCHI I PORTALI 2. SE SBAGLI TOGLI UNA VITA AL/ALLA TU* COMPAGN*. SEI PRONT*?",
            answers: ["SI", "NO"],
            correctIndex: 0,
            explanation: ""
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
            question: "Come chiamiamo il barista dell'Alambicco?",
            answers: ["Gaspa", "Luca", "Povia", "Albi"],
            correctIndex: 2,
            explanation: ""
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
            question: "La prima volta che siamo andati al Castello di Moncalieri da soli, che anno era?",
            answers: ["2019", "2020", "2021", "2022"],
            correctIndex: 1,
            explanation: "E li mi hai skifato :/"
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

    //TODO: Aggiungere mappe nuove, magari non tutte capire bene
    const floorImages = {
        //1: '/assets/floors/test.png',
        1: '/assets/floors/floor1.png',
        2: '/assets/floors/floor2.png',
        3: '/assets/floor3.png',
        4: '/assets/floor1.png',
        5: '/assets/floor2.png',
        6: '/assets/floors/floor6.png',
        7: '/assets/floor1.png',
        8: '/assets/floors/floor8.png',
        9: '/assets/floor3.png',
        10: '/assets/floor1.png',
        11: '/assets/floor2.png',
        12: '/assets/floor3.png',
        13: '/assets/floor1.png',
        14: '/assets/floors/floor14.png',
        15: '/assets/floor3.png',
        16: '/assets/floor1.png',
        17: '/assets/floor2.png',
        18: '/assets/floors/floor18.png',
        19: '/assets/floor1.png',
        20: '/assets/floor2.png',
        21: '/assets/floor3.png',
        22: '/assets/floor1.png',
        23: '/assets/floors/floor23.png',
        24: '/assets/floor3.png',
    };

    const floorImagesLoaded = {};

    const spriteWidth = 29; // 87 / 3 = 29 px per frame
    const spriteHeight = 30.5; // 122 / 4 = 30.5 px x direzione (4 direzioni per ora)
    const columns = 3; // 3 colonne valutare quarta

    window.spriteWidth = spriteWidth;
    window.spriteHeight = spriteHeight;

    let player = {
        x: 140,
        y: 140,
        width: spriteWidth * 1.5, // 1.5 con nuove misure (prima era *.8)
        height: spriteHeight * 1.5, // 1.5 con nuove misure (prima era *.8)
        speed: 3,
    };

    window.player = player;

    //TODO: Controlla i vicoli cechi, ci sono stanze sbagliate
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
            16: [11, 1, 4],
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
            1: "Negozio",                       //suono -> MAIN
            2: "La Piadineria",                 //suono -> CUSTOM: The Less I Know The Better, Tame Impala
            3: "UGC Cinema",                    //suono -> MAIN
            4: "Lago di Viverone",              //suono -> CUSTOM: Chamber of Reflection, Mac DeMarco
            5: "Bar Noce",                      //suono -> MAIN 
            6: "Mondo Juve",                    //suono -> MAIN 
            7: "Follonica",                     //suono -> MAIN
            8: "Alambicco",                     //suono -> MAIN
            9: "Camping Thaiti",                //suono -> MAIN
            10: "Lago di Avigliana",            //suono -> CUSTOM: Friday I'm In Love, The Cure
            11: "Via Trento",                   //suono -> MAIN
            12: "Casa di Davide",               //suono -> MAIN
            13: "Casa di Formi",                //suono -> CUSTOM: I Don't Know How To Love, The Drums 
            14: "Castello di Monca",            //suono -> CUSTOM: The Line, 21 Pilots
            15: "Gasprin",                      //suono -> MAIN
            16: "Casa di Pepe",                 //suono -> MAIN
            17: "Roadhouse",                    //suono -> MAIN
            18: "Casa Dema",                    //suono -> MAIN
            19: "Genova",                       //suono -> CUSTOM: Silver Soul, Beach House
            20: "Bowling Playcity",             //suono -> MAIN
            21: "Castiglione della Pescaia",    //suono -> MAIN
            22: "Porco Rosso",                  //suono -> MAIN
            23: "Mondo di Miyazaki",            //suono -> CUSTOM: Bygone Days, Joe Hisaishi
            24: "Pecetto"                       //suono -> CUSTOM: Joe Hisaishi, 
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

    // Variabili portale 2 second sopra per ora
    let portalOverlapTimer = 0;
    let playerOverlappingDoor = null;
    const PORTAL_TRANSITION_TIME = 2000; // 2s

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
            // Callback quando l'immagine principale del pavimento è caricata
        };

        for (const roomId in floorImages) {
            const img = new Image();
            img.src = floorImages[roomId];
            img.onload = () => {
                floorImagesLoaded[roomId] = img;
            };
        }
    }

    function initializeChests() {
        for (let roomId = 1; roomId <= 24; roomId++) {
            const roomQuestion = questions[roomId] || questions[1];

            chests[roomId] = {
                x: canvas.width / 2 - Math.random() * 50,
                y: canvas.height / 2 - Math.random() * 50,
                width: 40,
                height: 32,
                question: roomQuestion.question,
                answers: roomQuestion.answers,
                correctIndex: roomQuestion.correctIndex,
                explanation: roomQuestion.explanation,
                opened: false,
                solved: false
            };
        }

        for (let i = 1; i <= 24; i++) {
            chests[i].solved = true; // solo per test toglier epoi
        }
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
        const originalConnections = JSON.parse(JSON.stringify(roomSystem.connections));

        const deadEndRooms = [9, 10, 12, 16, 19, 21];

        const oneWayConnections = [{
                from: 2,
                to: 7
            },
            {
                from: 3,
                to: 8
            },
            {
                from: 5,
                to: 10
            },
            {
                from: 11,
                to: 16
            }
        ];

        oneWayConnections.forEach(conn => {
            const backConnections = roomSystem.connections[conn.to];
            if (backConnections) {
                roomSystem.connections[conn.to] = backConnections.filter(room => room !== conn.from);
            }
        });

        const additionalConnections = [{
                from: 1,
                to: 8
            },
            {
                from: 4,
                to: 10
            },
            {
                from: 14,
                to: 17
            },
            {
                from: 9,
                to: 12
            }
        ];

        additionalConnections.forEach(conn => {
            if (!roomSystem.connections[conn.from].includes(conn.to)) {
                roomSystem.connections[conn.from].push(conn.to);
            }
            if (!roomSystem.connections[conn.to].includes(conn.from)) {
                roomSystem.connections[conn.to].push(conn.from);
            }
        });

        const pathToFinal = [{
                from: 22,
                to: 24
            },
            {
                from: 23,
                to: 24
            },
            {
                from: 18,
                to: 22
            },
            {
                from: 19,
                to: 22
            },
            {
                from: 20,
                to: 23
            },
            {
                from: 21,
                to: 23
            }
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

                // Imposta l'offset a 0.5 (metà) per tutti i portali
                const offset = 0.5;

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

    // ##
    function drawDoors(doors) {
        // Trova tutti i frame validi una sola volta per evitare calcoli ripetuti
        const validFrames = doorFrames.filter(img => img.complete && !img.isErrored);
        
        doors.forEach(door => {
            let x = 0;
            let y = 0;
            let width = 50;
            let height = 70;
            let rotation = 0;
    
            // Position calculation (keep your existing code)
            switch (door.position) {
                case "top":
                    x = (canvas.width / 2) - (width / 2);
                    y = 0;
                    rotation = 120;
                    break;
                case "right":
                    x = canvas.width - width;
                    y = (canvas.height / 2) - (height / 2);
                    rotation = 180;
                    break;
                case "bottom":
                    x = (canvas.width / 2) - (width / 2);
                    y = canvas.height - height;
                    rotation = -60;
                    break;
                case "left":
                    x = 0;
                    y = (canvas.height / 2) - (height / 2);
                    rotation = 0;
                    break;
            }
    
            const doorLocked = !chests[roomSystem.currentRoom].solved;
    
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(rotation * Math.PI / 180);
            
            if (doorLocked && lockedDoorImage.complete) {
                // Locked door - just draw the locked image
                ctx.drawImage(lockedDoorImage, -width / 2, -height / 2, width, height);
            } else if (!doorLocked && validFrames.length > 0) {
                // Qui usiamo l'indice corrente LIMITATO al numero di frame validi
                // così, anche se doorAnimFrame diventa troppo grande, lo conterremo nel range valido
                const currentFrameIndex = doorAnimFrame % validFrames.length;
                const frameToUse = validFrames[currentFrameIndex];
                
                // Animated door - draw the current valid frame
                ctx.drawImage(frameToUse, -width / 2, -height / 2, width, height);
            } else {
                // Fallback if no valid frames are available
                ctx.fillStyle = doorLocked ? "#FF0000" : "#8B4513";
                ctx.fillRect(-width / 2, -height / 2, width, height);
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 4;
                ctx.strokeRect(-width / 2, -height / 2, width, height);
                
                ctx.fillStyle = doorLocked ? "#FF6666" : "#A0522D";
                const panelPadding = 10;
                ctx.fillRect(-width / 2 + panelPadding, -height / 2 + panelPadding,
                    width - panelPadding * 2, height - panelPadding * 2);
            }
            
            ctx.restore();
            
            // Store door position info
            door.x = x;
            door.y = y;
            door.width = width;
            door.height = height;
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
        ctx.fillText("CHIUDI", popupX + popupWidth / 2, popupY + popupHeight - 20);

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }

    function drawTransition() {
        if (!isRoomTransitioning) return;

        ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawQuestionDarkness() {
        if (!questionBoxVisible) return;

        darknessCtx.clearRect(0, 0, darknessCanvas.width, darknessCanvas.height);
        darknessCtx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        darknessCtx.fillRect(0, 0, darknessCanvas.width, darknessCanvas.height);
    }

    function drawDarkness() {
        if (!window.player || questionBoxVisible) return;

        const playerCenterX = window.player.x + window.player.width / 2;
        const playerCenterY = window.player.y + window.player.height / 2;

        let lightRadius = lightSettings.radius;
        if (lightSettings.flicker) {
            const flicker = Math.random() * lightSettings.flickerRange * 2 - lightSettings.flickerRange;
            lightRadius += flicker * lightRadius;
        }

        darknessCtx.clearRect(0, 0, darknessCanvas.width, darknessCanvas.height);

        darknessCtx.save();

        darknessCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        darknessCtx.fillRect(0, 0, darknessCanvas.width, darknessCanvas.height);

        darknessCtx.globalCompositeOperation = 'destination-out';

        const gradient = darknessCtx.createRadialGradient(
            playerCenterX, playerCenterY, 0,
            playerCenterX, playerCenterY, lightRadius + lightSettings.softness
        );

        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(lightSettings.intensity, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        darknessCtx.fillStyle = gradient;
        darknessCtx.beginPath();
        darknessCtx.arc(playerCenterX, playerCenterY, lightRadius + lightSettings.softness, 0, Math.PI * 2);
        darknessCtx.fill();

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

    function convertToGreenPhosphor() {
        if (window.player && window.player.color) {
            window.player.color = '#00ff00';
        }

        for (const roomId in chests) {
            if (chests[roomId].color) {
                chests[roomId].color = '#00aa00';
            }
        }

        const textElements = document.querySelectorAll('.puzzle-solved, .puzzle-unsolved, #roomName, #timer');
        textElements.forEach(el => {
            el.style.color = '#00ff00';
            el.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.7)';
        });

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
                frameIndex = (frameIndex + 1) % 3; // 3 frame per colonna (4 direzioni)
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

        checkDoorCollision();

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

        if (playerOverlappingDoor !== null && portalOverlapTimer > 0) {
            drawPortalProgress(portalOverlapTimer / PORTAL_TRANSITION_TIME);
        }

        drawPopup();
    }

    window.renderGame = function() {
        ctx.save();
        ctx.fillStyle = '#001100';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderGame();
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
            playerOverlappingDoor = null;
            portalOverlapTimer = 0;
            return;
        }

        const doors = roomSystem.doors[roomSystem.currentRoom] || [];
        let isOverlapping = false;

        for (const door of doors) {
            const x = door.x;
            const y = door.y;
            const width = door.width;
            const height = door.height;

            if (player.x < x + width &&
                player.x + player.width > x &&
                player.y < y + height &&
                player.y + player.height > y) {

                isOverlapping = true;

                if (playerOverlappingDoor !== door.toRoom) {
                    playerOverlappingDoor = door.toRoom;
                    portalOverlapTimer = 0;
                }

                break;
            }
        }

        if (!isOverlapping) {
            portalOverlapTimer = 0;
            playerOverlappingDoor = null;
        }
    }

    function drawPortalProgress(progress) {
        if (progress <= 0) return;

        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const radius = Math.max(player.width, player.height) * 0.8;

        ctx.save();

        // cerchio esterno (bordo)
        /*
        ctx.beginPath();
        ctx.arc(playerCenterX, playerCenterY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.stroke();
        */
        // arco di progresso
        ctx.beginPath();
        ctx.arc(playerCenterX, playerCenterY, radius - 10, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.restore();
    }

    function updateDoorAnimation(deltaTime) {
        doorAnimTimer += deltaTime;
        if (doorAnimTimer >= DOOR_ANIM_SPEED) {
            const validFrames = doorFrames.filter(img => img.complete && !img.isErrored);
            if (validFrames.length > 0) {
                doorAnimFrame = (doorAnimFrame + 1) % validFrames.length;
            } else {
                doorAnimFrame = 0;
            }
            doorAnimTimer = 0;
        }
    }

    function gameLoop(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        const isMoving = updateMovement();
        updateAnimation(deltaTime, isMoving);
        updateTransition(deltaTime);
        
        updateDoorAnimation(deltaTime);

        if (playerOverlappingDoor !== null && !isRoomTransitioning && !isPopupOpen && !questionBoxVisible) {
            const doors = roomSystem.doors[roomSystem.currentRoom] || [];
            let stillOverlapping = false;

            for (const door of doors) {
                if (door.toRoom === playerOverlappingDoor) {
                    const x = door.x;
                    const y = door.y;
                    const width = door.width;
                    const height = door.height;

                    if (player.x < x + width &&
                        player.x + player.width > x &&
                        player.y < y + height &&
                        player.y + player.height > y) {
                        stillOverlapping = true;
                        break;
                    }
                }
            }

            if (stillOverlapping) {
                portalOverlapTimer += deltaTime;
                if (portalOverlapTimer >= PORTAL_TRANSITION_TIME) {
                    showRoomTransition(playerOverlappingDoor);
                    portalOverlapTimer = 0;
                    playerOverlappingDoor = null;
                }
            } else {
                portalOverlapTimer = 0;
                playerOverlappingDoor = null;
            }
        }

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
            <h1>CONGRATULAZIONI!</h1>
            <p>test!</p>
            <p>test!</p>
            <button id="restartButton">RIAVVIA</button>
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

    function showQuestionBox() {
        if (questionBoxVisible) return;

        const currentChest = chests[roomSystem.currentRoom];
        if (!currentChest) return;

        questionBoxVisible = true;

        const questionBox = document.createElement('div');
        questionBox.id = 'questionBox';

        questionBox.innerHTML = `
            <h2>${roomSystem.roomNames[roomSystem.currentRoom]}</h2>
            <p>${currentChest.question}</p>
            <div id="answerOptions"></div>
        `;

        document.body.appendChild(questionBox);

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

        canvas.focus();

        drawQuestionDarkness();
    }

    function handleAnswerClick(answerIndex) {
        const currentChest = chests[roomSystem.currentRoom];
        const answerButtons = document.querySelectorAll('.answer-button');

        answerButtons.forEach(button => {
            button.disabled = true;
        });

        answerButtons.forEach((button, index) => {
            if (index === currentChest.correctIndex) {
                button.classList.add('correct');
            } else if (index === answerIndex && answerIndex !== currentChest.correctIndex) {
                button.classList.add('incorrect');
            }
        });

        if (answerIndex === currentChest.correctIndex) {
            setTimeout(() => {
                const questionBox = document.getElementById('questionBox');
                questionBox.innerHTML += `
                    <p style="color: #00ff00; margin-top: 20px;">${currentChest.explanation}</p>
                    <button id="continueButton" class="answer-button" style="margin-top: 20px;">CONTINUA</button>
                `;

                document.getElementById('continueButton').addEventListener('click', function() {
                    closeQuestionBox(true);
                });
            }, 1000);
        } else {
            setTimeout(() => {
                const questionBox = document.getElementById('questionBox');
                questionBox.innerHTML += `
                    <p style="color: #ff6666; margin-top: 20px;">SBAGLIATO!</p>
                    <button id="tryAgainButton" class="answer-button" style="margin-top: 20px;">RIPROVA</button>
                `;

                document.getElementById('tryAgainButton').addEventListener('click', function() {
                    document.body.removeChild(questionBox);
                    questionBoxVisible = false;
                    showQuestionBox();
                });
            }, 1000);
        }
    }

    function closeQuestionBox(solved) {
        const questionBox = document.getElementById('questionBox');
        if (questionBox) {
            document.body.removeChild(questionBox);
        }

        questionBoxVisible = false;

        if (solved) {
            const currentChest = chests[roomSystem.currentRoom];
            currentChest.opened = true;
            currentChest.solved = true;

            updatePuzzleStatus();

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
                //
            } else {
                showQuestionBox();
            }
        }
    }

    function updatePuzzleStatus() {
        const statusElement = document.getElementById('puzzleStatus');
        if (statusElement) {
            const isSolved = chests[roomSystem.currentRoom] && chests[roomSystem.currentRoom].solved;
            statusElement.textContent = isSolved ? "RISOLTO! Portali sbloccati" : "Risolvi l'enigma per sbloccare i portali";
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
            <h1>TEMPO SCADUTO!</h1>
            <p>Hai perso, il tempo è fino, riprova!</p>
            <button id="restartButton">RIPROVA</button>
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

        chests[1].solved = true;

        initTimer();
        updatePuzzleStatus();

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

    window.updateQuestionData = function(roomId, questionData) {
        if (!roomId || !questionData) return false;

        questions[roomId] = {
            question: questionData.question || "Default",
            answers: questionData.answers || ["SI", "NO", "BOH", "NN LO SO"],
            correctIndex: questionData.correctIndex || 0,
            explanation: questionData.explanation || "CORRETTO!"
        };

        if (chests[roomId]) {
            chests[roomId].question = questions[roomId].question;
            chests[roomId].answers = questions[roomId].answers;
            chests[roomId].correctIndex = questions[roomId].correctIndex;
            chests[roomId].explanation = questions[roomId].explanation;
        }

        return true;
    };

    window.isPlayerNearChest = isPlayerNearChest;
    window.handleInteraction = handleInteraction;

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

        randomFlicker();
        addRandomNoise();
        setTimeout(convertToGreenPhosphor, 100);

        window.renderGame();

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
    window.debugRoom = function() {
        renderGame();
    };
    if (typeof window.skipMainInit === 'undefined' || !window.skipMainInit) {
        if (playerSprite.complete) {
            initGame();
        } else {
            playerSprite.onload = () => {
                initGame();
            };
        }
    }
});