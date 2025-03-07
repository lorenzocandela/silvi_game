//SERVER.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const gameRooms = {};

function generateGameCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    if (gameRooms[code]) {
        return generateGameCode();
    }

    return code;
}

io.on('connection', (socket) => {
    //console.log('User connected:', socket.id);

    socket.on('createGame', () => {
        const gameCode = generateGameCode();

        gameRooms[gameCode] = {
            hostId: socket.id,
            players: [socket.id],
            started: false,
            lastActivity: Date.now()
        };

        socket.join(gameCode);

        socket.emit('gameCreated', {
            gameCode
        });

        //console.log(`Game created with code ${gameCode} by player ${socket.id}`);
    });

    socket.on('joinGame', (data) => {
        const {
            gameCode
        } = data;

        if (!gameRooms[gameCode]) {
            socket.emit('gameError', {
                message: 'Game not found'
            });
            return;
        }

        if (gameRooms[gameCode].players.length >= 2) {
            socket.emit('gameError', {
                message: 'Game is full'
            });
            return;
        }

        if (gameRooms[gameCode].started) {
            socket.emit('gameError', {
                message: 'Game has already started'
            });
            return;
        }

        gameRooms[gameCode].players.push(socket.id);
        gameRooms[gameCode].lastActivity = Date.now();
        socket.join(gameCode);

        socket.emit('joinSuccess', {
            gameCode,
            hostId: gameRooms[gameCode].hostId
        });

        socket.to(gameRooms[gameCode].hostId).emit('playerJoined', {
            playerId: socket.id
        });

        //console.log(`Player ${socket.id} joined game ${gameCode}`);
    });

    socket.on('startGame', (data) => {
        const {
            gameCode
        } = data;

        if (!gameRooms[gameCode]) return;
        if (gameRooms[gameCode].hostId !== socket.id) return;

        gameRooms[gameCode].started = true;
        gameRooms[gameCode].lastActivity = Date.now();

        io.to(gameCode).emit('gameStarted');

        //console.log(`Game ${gameCode} started by host ${socket.id}`);
    });

    socket.on('updateGameState', (data) => {
        const {
            gameCode,
            playerId
        } = data;

        if (!gameRooms[gameCode]) {
            //console.log(`Invalid game code in updateGameState: ${gameCode}`);
            return;
        }

        gameRooms[gameCode].lastActivity = Date.now();

        //console.log(`Forwarding state update from ${playerId} in game ${gameCode} to other players`);

        socket.to(gameCode).emit('updateGameState', data);
    });

    socket.on('disconnect', () => {
        //console.log('User disconnected:', socket.id);

        for (const gameCode in gameRooms) {
            const room = gameRooms[gameCode];

            if (room.players.includes(socket.id)) {

                socket.to(gameCode).emit('playerDisconnected', {
                    playerId: socket.id
                });

                if (room.hostId === socket.id) {
                    socket.to(gameCode).emit('gameEnded', {
                        reason: 'Host disconnected'
                    });
                    delete gameRooms[gameCode];
                    //console.log(`Game ${gameCode} ended - host disconnected`);
                } else {

                    room.players = room.players.filter(id => id !== socket.id);
                    //console.log(`Player ${socket.id} removed from game ${gameCode}`);
                }
            }
        }
    });

    socket.on('chestOpened', (data) => {
        const {
            gameCode,
            roomId
        } = data;
        if (!gameRooms[gameCode]) return;

        gameRooms[gameCode].lastActivity = Date.now();

        socket.to(gameCode).emit('chestOpened', {
            roomId
        });
    });

    socket.on('roomTransition', (data) => {
        const {
            gameCode,
            newRoomId
        } = data;
        if (!gameRooms[gameCode]) {
            //console.log(`Invalid game code in roomTransition: ${gameCode}`);
            return;
        }

        gameRooms[gameCode].lastActivity = Date.now();

        //console.log(`Player ${socket.id} moved to room ${newRoomId} in game ${gameCode}`);

        socket.to(gameCode).emit('roomTransition', {
            newRoomId,
            playerId: socket.id
        });

        if (newRoomId === 15 || newRoomId === "15") {

            let allInFinalRoom = true;
            let finalRoomPlayers = [];

            for (const playerId of gameRooms[gameCode].players) {
                const playerRoom = gameRooms[gameCode].playerRooms?.[playerId];

                if (playerId === socket.id) {

                    if (!gameRooms[gameCode].playerRooms) {
                        gameRooms[gameCode].playerRooms = {};
                    }
                    gameRooms[gameCode].playerRooms[playerId] = newRoomId;
                    finalRoomPlayers.push(playerId);
                } else if (!playerRoom || (playerRoom !== 15 && playerRoom !== "15")) {
                    allInFinalRoom = false;
                } else {
                    finalRoomPlayers.push(playerId);
                }
            }

            if (allInFinalRoom && finalRoomPlayers.length > 1) {
                //console.log(`All players in game ${gameCode} are in the final room! Victory!`);
                io.to(gameCode).emit('multiplayerVictory');
            }
        } else {

            if (!gameRooms[gameCode].playerRooms) {
                gameRooms[gameCode].playerRooms = {};
            }
            gameRooms[gameCode].playerRooms[socket.id] = newRoomId;
        }
    });
});

setInterval(() => {
    const now = Date.now();
    for (const gameCode in gameRooms) {
        const room = gameRooms[gameCode];

        if (room.lastActivity && now - room.lastActivity > 2 * 60 * 60 * 1000) {
            //console.log(`Cleaning up stale game room: ${gameCode}`);
            delete gameRooms[gameCode];
        }
    }
}, 15 * 60 * 1000);

process.on('SIGTERM', () => {
    //console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        //console.log('Server closed');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    //console.log(`Server running on port ${PORT}`);
});