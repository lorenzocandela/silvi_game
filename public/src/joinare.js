let isMultiplayer = false;
let isHost = false;
let gameCode = '';
let connectedPlayers = [];
let otherPlayerData = null;
let socket = null;
let gameInit = false;
let discoveredRooms = new Set([1]); 

window.drawOtherPlayer = function() {
    if (!isMultiplayer || !otherPlayerData) {
        return;
    }

    if (otherPlayerData.roomId !== window.roomSystem.currentRoom) {
        return;
    }

    if (window.player2Sprite && window.player2Sprite.complete) {
        try {
            window.ctx.drawImage(
                window.player2Sprite,
                otherPlayerData.frameIndex * window.spriteWidth,
                otherPlayerData.direction * window.spriteHeight,
                window.spriteWidth, window.spriteHeight,
                otherPlayerData.x, otherPlayerData.y,
                window.player.width, window.player.height
            );
        } catch (error) {
            console.error("Error drawing other player sprite:", error);
            drawPlayerFallback();
        }
    } else {
        drawPlayerFallback();
    }

    window.ctx.fillStyle = "white";
    window.ctx.font = "12px Arial";
    window.ctx.textAlign = "center";
    window.ctx.fillText("Player 2", otherPlayerData.x + window.player.width / 2, otherPlayerData.y - 10);
};

function drawPlayerFallback() {
    window.ctx.fillStyle = "purple";
    window.ctx.fillRect(
        otherPlayerData.x,
        otherPlayerData.y,
        window.player.width,
        window.player.height
    );
}

function checkVictoryCondition() {
    if (isMultiplayer && window.roomSystem.currentRoom === 24 && otherPlayerData && otherPlayerData.roomId === 24) {
        showMultiplayerVictory();
    }
}

function showMultiplayerVictory() {
    if (document.getElementById('victoryBanner')) {
        return;
    }
    const victoryBanner = document.createElement('div');
    victoryBanner.id = 'victoryBanner';
    victoryBanner.className = 'victory-banner';
    victoryBanner.innerHTML = `
        <div class="banner-content">
            <h2>CONGRATULATIONS!</h2>
            <p>Both players reached the Treasure Chamber!</p>
            <div class="banner-buttons">
                <button id="restartButton">Restart Game</button>
                <button id="stayButton">Continue Playing</button>
            </div>
        </div>
    `;
    document.body.appendChild(victoryBanner);
    const style = document.createElement('style');
    style.textContent = `
        .victory-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 1000;
            border-bottom: 3px solid gold;
        }

        .banner-content {
            max-width: 600px;
            margin: 0 auto;
        }

        .banner-content h2 {
            color: gold;
            margin: 5px 0;
        }

        .banner-buttons {
            margin: 10px 0;
        }

        .banner-buttons button {
            margin: 0 10px;
            padding: 5px 15px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .banner-buttons button:hover {
            background-color: #45a049;
        }
    `;
    document.head.appendChild(style);
    document.getElementById('restartButton').addEventListener('click', () => {
        document.body.removeChild(victoryBanner);
        window.roomSystem.currentRoom = 1; 
        window.player.x = window.canvas.width / 2 - window.player.width / 2;
        window.player.y = window.canvas.height / 2 - window.player.height / 2;
        if (socket) {
            socket.emit('roomTransition', {
                gameCode: gameCode,
                newRoomId: 1
            });
        }
    });

    document.getElementById('stayButton').addEventListener('click', () => {
        document.body.removeChild(victoryBanner);
    });
}

function updateGlobalMultiplayerState() {
    window.isMultiplayer = isMultiplayer;
    window.otherPlayerData = otherPlayerData;
}

function initMultiplayer() {

    try {
        socket = io();

        socket.on('connect', () => {

        });

        socket.on('gameCreated', (data) => {
            gameCode = data.gameCode;
            isHost = true;
            isMultiplayer = true;
            updateGlobalMultiplayerState();
            showGameCode(gameCode);

        });

        socket.on('joinSuccess', (data) => {
            gameCode = data.gameCode;
            isMultiplayer = true;
            isHost = false;
            updateGlobalMultiplayerState();
            hideJoinUI();
            showConnectedMessage(data.hostId);

        });

        socket.on('playerJoined', (data) => {
            connectedPlayers.push(data.playerId);
            showPlayerJoinedMessage(data.playerId);

        });

        socket.on('gameStarted', () => {

            hideMenuAndStartGame();
        });

        socket.on('updateGameState', (data) => {
            otherPlayerData = data;
            updateGlobalMultiplayerState();

            checkVictoryCondition();
        });

        socket.on('roomTransition', (data) => {
            const {
                newRoomId
            } = data;

            if (parseInt(newRoomId) === 24 && window.roomSystem.currentRoom === 24) {
                showMultiplayerVictory();
            }
        });

        socket.on('gameError', (data) => {
            showErrorMessage(data.message);
            console.error('Game error:', data.message);
        });
    } catch (error) {
        console.error("Error initializing socket:", error);
    }

    createMainMenuUI();
}

const player2Sprite = new Image();
player2Sprite.src = '/assets/player2_sprites.png'; 
window.player2Sprite = player2Sprite;

function createGame() {
    socket.emit('createGame');
}

function joinGame(code) {
    if (!code || code.length !== 4) {
        showErrorMessage("Please enter a valid 4-character game code");
        return;
    }

    socket.emit('joinGame', {
        gameCode: code
    });
}

function sendGameStateUpdate() {
    if (!isMultiplayer || !socket) return;

    try {
        const gameState = {
            playerId: socket.id,
            gameCode: gameCode,
            x: window.player.x,
            y: window.player.y,
            roomId: window.roomSystem.currentRoom,
            direction: window.currentDirection,
            frameIndex: window.frameIndex
        };

        socket.emit('updateGameState', gameState);
    } catch (e) {
        console.error("Error sending game state:", e);
    }
}

function setupGameExtensions() {

    if (typeof window.renderGame === 'function') {

        const originalRenderGame = window.renderGame;

        window.renderGame = function() {

            originalRenderGame();

            if (isMultiplayer) {

                window.drawOtherPlayer();
            }
        };

    } else {
        console.error("Could not find renderGame function to extend - window.renderGame:", window.renderGame);
    }
}

function markRoomDiscovered(roomId) {
    discoveredRooms.add(parseInt(roomId));

    const progressElement = document.getElementById('explorationProgress');
    if (progressElement) {
        progressElement.textContent = `Exploration: ${discoveredRooms.size}/24 rooms`;
    }
}

function createMainMenuUI() {

    const menuContainer = document.createElement('div');
    menuContainer.id = 'menuContainer';
    menuContainer.className = 'menu-container';

    menuContainer.innerHTML = `
        <div class="menu-content">
            <h1>SILVI - Pixel Game</h1>
            <div class="menu-buttons">
                <button id="singlePlayerBtn">Single Player</button>
                <button id="createGameBtn">Create Multiplayer Game</button>
                <button id="joinGameBtn">Join Multiplayer Game</button>
            </div>
            <div id="joinGameForm" class="join-form" style="display: none;">
                <input id="gameCodeInput" type="text" maxlength="4" placeholder="Enter 4-letter game code">
                <button id="submitJoinBtn">Join</button>
                <button id="cancelJoinBtn">Cancel</button>
            </div>
            <div id="gameCodeDisplay" class="game-code-display" style="display: none;">
                <h3>Your Game Code</h3>
                <div id="gameCodeValue" class="game-code-value"></div>
                <p>Share this code with another player to join your game</p>
                <button id="startGameBtn">Start Game</button>
            </div>
            <div id="errorMessage" class="error-message"></div>
        </div>
    `;

    document.body.appendChild(menuContainer);

    document.getElementById('singlePlayerBtn').addEventListener('click', startSinglePlayerGame);
    document.getElementById('createGameBtn').addEventListener('click', createGame);
    document.getElementById('joinGameBtn').addEventListener('click', showJoinGameForm);
    document.getElementById('submitJoinBtn').addEventListener('click', () => {
        const code = document.getElementById('gameCodeInput').value.toUpperCase();
        joinGame(code);
    });
    document.getElementById('cancelJoinBtn').addEventListener('click', hideJoinGameForm);
    document.getElementById('startGameBtn').addEventListener('click', startMultiplayerGame);

    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.style.display = 'none';

    const controls = document.querySelector('.controls');
    if (controls) controls.style.display = 'none';

    const roomNameContainer = document.getElementById('roomNameContainer');
    if (roomNameContainer) roomNameContainer.style.display = 'none';

    const timerContainer = document.getElementById('timerContainer');
    if (timerContainer) timerContainer.style.display = 'none';

    const puzzleStatus = document.getElementById('puzzleStatus');
    if (puzzleStatus) puzzleStatus.style.display = 'none';
}

function showJoinGameForm() {
    document.getElementById('joinGameForm').style.display = 'block';
    document.querySelector('.menu-buttons').style.display = 'none';
}

function hideJoinGameForm() {
    document.getElementById('joinGameForm').style.display = 'none';
    document.querySelector('.menu-buttons').style.display = 'block';
}

function showGameCode(code) {
    document.getElementById('gameCodeValue').textContent = code;
    document.getElementById('gameCodeDisplay').style.display = 'block';
    document.querySelector('.menu-buttons').style.display = 'none';
}

function showErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

function showConnectedMessage(hostId) {
    const menuContainer = document.getElementById('menuContainer');
    menuContainer.innerHTML = `
        <div class="menu-content">
            <h2>Connected to Game!</h2>
            <p>You have successfully joined the game.</p>
            <p>Waiting for host to start the game...</p>
        </div>
    `;
}

function showPlayerJoinedMessage(playerId) {
    const startButton = document.getElementById('startGameBtn');
    if (startButton) {
        startButton.disabled = false;
        startButton.textContent = 'Start Game (Player Joined)';
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = 'Player has joined your game!';
    document.body.appendChild(notification);

    setTimeout(() => {
        try {
            document.body.removeChild(notification);
        } catch (e) {
            console.error("Error removing notification:", e);
        }
    }, 3000);
}

function startSinglePlayerGame() {

    isMultiplayer = false;
    hideMenuAndStartGame();
}

function startMultiplayerGame() {

    if (!isHost) return;

    socket.emit('startGame', {
        gameCode
    });
    hideMenuAndStartGame();
}

function hideMenuAndStartGame() {
    const menuContainer = document.getElementById('menuContainer');
    if (menuContainer) {
        document.body.removeChild(menuContainer);
    }

    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.style.display = 'block';

    const controls = document.querySelector('.controls');
    if (controls) controls.style.display = 'block';

    const roomNameContainer = document.getElementById('roomNameContainer');
    if (roomNameContainer) roomNameContainer.style.display = 'block';

    const timerContainer = document.getElementById('timerContainer');
    if (timerContainer) timerContainer.style.display = 'block';

    const puzzleStatus = document.getElementById('puzzleStatus');
    if (puzzleStatus) puzzleStatus.style.display = 'block';

    if (!gameInit) {

        updateGlobalMultiplayerState();

        if (typeof window.initGame === 'function') {
            window.initGame();

            setupGameExtensions();

            gameInit = true;
        } else {
            console.error("Could not find initGame function");
        }
    }
}

function hideJoinUI() {
    const joinForm = document.getElementById('joinGameForm');
    if (joinForm) joinForm.style.display = 'none';
}

let frameCount = 0;

function updateFrameCount() {
    frameCount++;

    if (isMultiplayer && frameCount % 5 === 0) {
        sendGameStateUpdate();
    }

    requestAnimationFrame(updateFrameCount);
}

function logMultiplayerState() {

}

function startMultiplayerDebug() {
    logMultiplayerState();
    setTimeout(startMultiplayerDebug, 3000);
}

window.addEventListener('load', function() {

    updateFrameCount();

    setTimeout(startMultiplayerDebug, 3000);

    setTimeout(function() {

        initMultiplayer();
    }, 500);
});

window.skipMainInit = true;

window.originalChangeRoom = window.changeRoom;
window.changeRoom = function(newRoomId) {

    window.originalChangeRoom(newRoomId);

    markRoomDiscovered(newRoomId);
};