/**
 * Sistema audio ultra-semplificato per il gioco - CON FADE AUDIO
 * - Log dettagliati e fade tra canzoni
 */

// Elenco delle stanze con audio speciale
const SPECIAL_ROOMS = [2, 4, 10, 13, 14, 19, 23, 24];

// Variabili per gestire lo stato dell'audio
let mainAudio = null;
let roomAudios = {};
let currentAudio = null;
let isMuted = false;
let currentRoom = null;
let isAudioInitialized = false;
let lastAttemptedRoomAudio = null;

// Parametri per il fade
const FADE_DURATION = 1000; // Durata del fade in millisecondi
let isFading = false;
let fadeInterval = null;

// Log potenziato
function debugLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[AUDIO ${timestamp}]`;
    
    switch(type) {
        case 'error':
            console.error(`${prefix} ERROR: ${message}`);
            break;
        case 'warn':
            console.warn(`${prefix} WARN: ${message}`);
            break;
        case 'success':
            console.log(`${prefix} SUCCESS: %c${message}`, 'color: green; font-weight: bold');
            break;
        default:
            console.log(`${prefix} ${message}`);
    }
}

// Crea un pulsante per attivare l'audio
function createAudioButton() {
    debugLog("Creazione pulsante di attivazione audio...");
    
    // Rimuovi pulsanti esistenti
    const existingButton = document.getElementById('startAudioButton');
    if (existingButton) {
        existingButton.parentNode.removeChild(existingButton);
    }
    
    const button = document.createElement('button');
    button.id = 'startAudioButton';
    button.textContent = 'ATTIVA AUDIO 🔊';
    
    // Stile del pulsante
    Object.assign(button.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '20px 40px',
        backgroundColor: '#004400',
        color: '#00ff00',
        border: '3px solid #00aa00',
        borderRadius: '10px',
        fontSize: '24px',
        fontFamily: 'Courier New, monospace',
        cursor: 'pointer',
        zIndex: '10000',
        boxShadow: '0 0 30px rgba(0, 255, 0, 0.8)'
    });
    
    // Aggiungi event listener
    button.addEventListener('click', function() {
        debugLog("Pulsante audio cliccato!", 'success');
        document.body.removeChild(button);
        initializeAudio();
    });
    
    document.body.appendChild(button);
}

// Inizializza l'audio (chiamato direttamente dal clic sul pulsante)
function initializeAudio() {
    debugLog("Inizializzazione audio...");
    
    if (isAudioInitialized) {
        debugLog("Audio già inizializzato, non ripeto l'operazione", 'warn');
        return;
    }
    
    try {
        // Crea l'audio principale
        mainAudio = new Audio('/assets/audio/suono.mp3');
        mainAudio.loop = true;
        mainAudio.volume = 0.7;
        
        // Evento per monitorare caricamento
        mainAudio.addEventListener('canplaythrough', () => {
            debugLog("Audio principale pronto per la riproduzione");
        });
        
        // Evento per monitorare errori
        mainAudio.addEventListener('error', (e) => {
            debugLog(`Errore nell'audio principale: ${e.message}`, 'error');
        });
        
        // Avvia immediatamente l'audio principale
        const playPromise = mainAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                debugLog("Audio principale avviato con successo!", 'success');
                currentAudio = mainAudio;
                isAudioInitialized = true;
                
                // Precarica gli audio delle stanze
                preloadRoomAudios();
                
                // Aggiungi pulsante mute
                addMuteButton();
                
                // Collega al sistema delle stanze
                hookIntoRoomSystem();
                
                // Verifica se siamo già in una stanza speciale
                if (window.roomSystem && SPECIAL_ROOMS.includes(window.roomSystem.currentRoom)) {
                    debugLog(`Già in stanza speciale ${window.roomSystem.currentRoom}, cambio audio...`);
                    handleRoomChange(window.roomSystem.currentRoom);
                }
                
            }).catch(error => {
                debugLog(`Errore nell'avvio dell'audio: ${error.message}`, 'error');
                // Mostra di nuovo il pulsante in caso di errore
                setTimeout(createAudioButton, 3000);
            });
        }
    } catch (error) {
        debugLog(`Errore nell'inizializzazione audio: ${error.message}`, 'error');
        setTimeout(createAudioButton, 3000);
    }
}

// Precarica gli audio per le stanze speciali
function preloadRoomAudios() {
    debugLog("Precaricamento audio stanze speciali...");
    
    SPECIAL_ROOMS.forEach(roomId => {
        try {
            debugLog(`Caricamento audio stanza ${roomId}...`);
            
            const audio = new Audio(`/assets/audio/suono${roomId}.mp3`);
            audio.loop = true;
            audio.volume = 0;  // Inizia a volume 0 per permettere il fade in
            roomAudios[roomId] = audio;
            
            // Verifica che l'audio sia caricabile
            audio.addEventListener('canplaythrough', () => {
                debugLog(`Audio per stanza ${roomId} caricato con successo`, 'success');
            });
            
            // Gestisci errori
            audio.addEventListener('error', (e) => {
                debugLog(`Errore nel caricamento audio stanza ${roomId}: ${e.type}`, 'error');
                delete roomAudios[roomId];
            });
            
            // Verifica se il file esiste effettivamente
            fetch(`/assets/audio/suono${roomId}.mp3`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`);
                    }
                    debugLog(`File audio stanza ${roomId} verificato sul server`, 'success');
                })
                .catch(error => {
                    debugLog(`File audio stanza ${roomId} non disponibile: ${error.message}`, 'error');
                });
            
        } catch (error) {
            debugLog(`Errore nella creazione audio stanza ${roomId}: ${error.message}`, 'error');
        }
    });
}

// Esegue un fade tra due audio
function fadeAudio(fromAudio, toAudio) {
    if (isFading) {
        debugLog("Fade già in corso, annullo il precedente", 'warn');
        clearInterval(fadeInterval);
    }
    
    if (!fromAudio || !toAudio) {
        debugLog("Audio mancante per il fade", 'error');
        return;
    }
    
    debugLog(`Avvio fade da ${fromAudio === mainAudio ? 'principale' : 'stanza'} a ${toAudio === mainAudio ? 'principale' : 'stanza'}`);
    
    // Salva il volume originale dell'audio di partenza
    const fromVolume = fromAudio.volume;
    
    // Imposta il volume iniziale per l'audio di destinazione
    toAudio.volume = 0;
    
    // Avvia l'audio di destinazione
    const playPromise = toAudio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            debugLog(`Errore avvio audio per fade: ${error.message}`, 'error');
            return;
        });
    }
    
    // Imposta le variabili per il fade
    isFading = true;
    let startTime = Date.now();
    
    // Esegui il fade con un intervallo
    fadeInterval = setInterval(() => {
        // Calcola il progresso del fade (0-1)
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / FADE_DURATION, 1);
        
        // Aggiorna i volumi
        fromAudio.volume = fromVolume * (1 - progress);
        toAudio.volume = isMuted ? 0 : 0.7 * progress;
        
        // Se il fade è completo
        if (progress >= 1) {
            clearInterval(fadeInterval);
            isFading = false;
            
            // Metti in pausa l'audio di partenza
            fromAudio.pause();
            fromAudio.currentTime = 0;
            fromAudio.volume = isMuted ? 0 : 0.7;  // Ripristina il volume originale
            
            // Assicurati che l'audio di destinazione sia al volume corretto
            toAudio.volume = isMuted ? 0 : 0.7;
            
            debugLog(`Fade completato`, 'success');
        }
    }, 30);  // Aggiorna ogni 30ms per un'animazione fluida
}

// Aggiungi pulsante mute all'interfaccia
function addMuteButton() {
    debugLog("Aggiunta pulsante mute...");
    
    const addButton = function() {
        const controls = document.querySelector('.controls');
        if (!controls) {
            debugLog("Controlli non trovati, riprovo tra poco...");
            setTimeout(addButton, 1000);
            return;
        }
        
        if (document.querySelector('.audio-mute-button')) {
            debugLog("Pulsante mute già presente");
            return; // Evita duplicati
        }
        
        const muteButton = document.createElement('button');
        muteButton.textContent = '🔊';
        muteButton.className = 'audio-mute-button';
        
        // Stile del pulsante
        Object.assign(muteButton.style, {
            backgroundColor: '#004400',
            color: '#00ff00',
            border: '2px solid #00aa00',
            borderRadius: '4px',
            padding: '10px',
            margin: '5px',
            cursor: 'pointer'
        });
        
        // Evento per il toggle mute
        muteButton.addEventListener('click', function() {
            toggleMute();
            muteButton.textContent = isMuted ? '🔇' : '🔊';
        });
        
        controls.appendChild(muteButton);
        debugLog("Pulsante mute aggiunto all'interfaccia", 'success');
    };
    
    // Prova ad aggiungere il pulsante ora o dopo un ritardo
    addButton();
}

// Attiva/disattiva il mute
function toggleMute() {
    isMuted = !isMuted;
    debugLog(`Audio ${isMuted ? 'disattivato' : 'attivato'}`);
    
    // Imposta il mute su tutti gli audio
    if (mainAudio) {
        mainAudio.muted = isMuted;
    }
    
    Object.values(roomAudios).forEach(audio => {
        if (audio) {
            audio.muted = isMuted;
        }
    });
}

// Gestisce il cambio di stanza
function handleRoomChange(roomId) {
    if (!isAudioInitialized) {
        debugLog("Audio non ancora inizializzato, ignoro cambio stanza", 'warn');
        return;
    }
    
    if (currentRoom === roomId) {
        debugLog(`Già nella stanza ${roomId}, ignoro cambio audio`);
        return;
    }
    
    if (!roomId) {
        debugLog("ID stanza non valido", 'warn');
        return;
    }
    
    debugLog(`Cambio stanza audio: da ${currentRoom || 'nessuna'} a ${roomId}`);
    currentRoom = roomId;
    
    // Controllo specifico per la stanza 10
    if (roomId === 10) {
        debugLog("STANZA SPECIALE 10 RILEVATA!", 'success');
    }
    
    try {
        // Controlla se la stanza ha un audio speciale
        if (SPECIAL_ROOMS.includes(parseInt(roomId)) && roomAudios[roomId]) {
            debugLog(`Stanza ${roomId} ha audio speciale, avvio fade...`);
            lastAttemptedRoomAudio = roomId;
            
            // Esegui il fade dall'audio corrente all'audio della stanza
            fadeAudio(currentAudio, roomAudios[roomId]);
            
            // Aggiorna l'audio corrente
            currentAudio = roomAudios[roomId];
        } 
        // Se non è una stanza speciale, usa l'audio principale
        else if (currentAudio !== mainAudio && mainAudio) {
            if (!SPECIAL_ROOMS.includes(parseInt(roomId))) {
                debugLog(`Stanza ${roomId} non è speciale, fade verso audio principale`);
            } else {
                debugLog(`Audio per stanza ${roomId} non trovato, fade verso audio principale`, 'warn');
            }
            
            // Esegui il fade dall'audio corrente all'audio principale
            fadeAudio(currentAudio, mainAudio);
            
            // Aggiorna l'audio corrente
            currentAudio = mainAudio;
        }
    } catch (error) {
        debugLog(`Errore nella gestione audio stanza: ${error.message}`, 'error');
    }
}

// Collega al sistema delle stanze
function hookIntoRoomSystem() {
    debugLog("Tentativo di collegamento al sistema stanze...");
    
    const hook = function() {
        // Verifica che il sistema delle stanze esista
        if (!window.roomSystem) {
            debugLog("Oggetto roomSystem non disponibile, ritento tra 1 secondo...", 'warn');
            setTimeout(hook, 1000);
            return;
        }
        
        if (typeof window.changeRoom !== 'function') {
            debugLog("Funzione changeRoom non disponibile, ritento tra 1 secondo...", 'warn');
            setTimeout(hook, 1000);
            return;
        }
        
        try {
            // Salva la funzione originale
            const originalChangeRoom = window.changeRoom;
            
            // Sovrascrivi la funzione
            window.changeRoom = function(newRoomId) {
                debugLog(`[HOOK] Intercettata chiamata changeRoom(${newRoomId})`);
                
                // Chiamata alla funzione originale
                originalChangeRoom(newRoomId);
                
                // Gestione audio
                handleRoomChange(newRoomId);
            };
            
            debugLog("Collegamento al sistema stanze completato!", 'success');
            
            // Imposta l'audio per la stanza corrente
            if (window.roomSystem && window.roomSystem.currentRoom) {
                const currentSystemRoom = window.roomSystem.currentRoom;
                debugLog(`Sistema stanze indica stanza corrente: ${currentSystemRoom}`);
                handleRoomChange(currentSystemRoom);
            }
            
            // Aggiungi un monitoraggio continuo della stanza corrente
            setInterval(() => {
                if (window.roomSystem && window.roomSystem.currentRoom !== currentRoom) {
                    const detectedRoom = window.roomSystem.currentRoom;
                    debugLog(`[MONITOR] Rilevato cambio stanza non intercettato: ${detectedRoom}`, 'warn');
                    handleRoomChange(detectedRoom);
                }
            }, 2000);
            
        } catch (error) {
            debugLog(`Errore nel collegamento al sistema stanze: ${error.message}`, 'error');
        }
    };
    
    // Avvia il processo di hook
    hook();
}

// Aggiunge un pulsante di debug specifico per stanza 10
function addDebugButton() {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'DEBUG S10';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '10px';
    debugButton.style.right = '10px';
    debugButton.style.padding = '10px';
    debugButton.style.backgroundColor = 'red';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '5px';
    debugButton.style.cursor = 'pointer';
    debugButton.style.zIndex = '10000';
    
    debugButton.addEventListener('click', function() {
        debugLog("Pulsante debug stanza 10 cliccato");
        
        if (!isAudioInitialized) {
            debugLog("Audio non inizializzato, lo avvio");
            initializeAudio();
        }
        
        setTimeout(() => {
            debugLog("Forzatura manuale audio stanza 10");
            
            // Controlla se l'audio della stanza 10 esiste
            if (roomAudios[10]) {
                debugLog("Audio stanza 10 trovato, avvio fade");
                fadeAudio(currentAudio, roomAudios[10]);
                currentAudio = roomAudios[10];
            } else {
                debugLog("Audio stanza 10 non trovato!", 'error');
                
                // Tenta di crearlo ora
                const audio = new Audio('/assets/audio/suono10.mp3');
                audio.loop = true;
                audio.volume = 0;
                roomAudios[10] = audio;
                
                audio.oncanplaythrough = () => {
                    debugLog("Audio stanza 10 caricato ora");
                    fadeAudio(currentAudio, audio);
                    currentAudio = audio;
                };
                
                audio.onerror = (e) => {
                    debugLog(`Errore caricamento stanza 10: ${e.type}`, 'error');
                    // Verifica percorso
                    fetch('/assets/audio/suono10.mp3')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error ${response.status}`);
                            }
                            debugLog("File suono10.mp3 esiste sul server", 'success');
                            return response.blob();
                        })
                        .then(blob => {
                            debugLog(`File suono10.mp3 scaricato, dimensione: ${blob.size} bytes`, 'success');
                        })
                        .catch(error => {
                            debugLog(`File suono10.mp3 non trovato: ${error.message}`, 'error');
                        });
                };
            }
        }, 500);
    });
    
    document.body.appendChild(debugButton);
}

// Avvia tutto il processo
document.addEventListener('DOMContentLoaded', function() {
    debugLog("DOM caricato, inizializzazione audio manager...");
    createAudioButton();
    addDebugButton(); // Aggiungi pulsante debug
});

// Esponi funzioni per debug
window.audioDebug = {
    mainAudio: () => mainAudio,
    roomAudios: () => roomAudios,
    currentAudio: () => currentAudio,
    currentRoom: () => currentRoom,
    handleRoomChange: handleRoomChange,
    toggleMute: toggleMute,
    fadeAudio: fadeAudio,
    forceRoom10: () => {
        debugLog("Forzatura stanza 10 da console");
        if (roomAudios[10]) {
            fadeAudio(currentAudio, roomAudios[10]);
            currentAudio = roomAudios[10];
            debugLog("Audio stanza 10 forzato", 'success');
        } else {
            debugLog("Audio stanza 10 non disponibile", 'error');
        }
    },
    reloadAudio: () => {
        debugLog("Ricarica completa sistema audio");
        isAudioInitialized = false;
        if (currentAudio) currentAudio.pause();
        if (fadeInterval) clearInterval(fadeInterval);
        mainAudio = null;
        roomAudios = {};
        currentAudio = null;
        currentRoom = null;
        isFading = false;
        createAudioButton();
    },
    checkFiles: async () => {
        debugLog("Verifica file audio...");
        try {
            const mainResponse = await fetch('/assets/audio/suono.mp3');
            debugLog(`File principale: ${mainResponse.ok ? 'OK' : 'NON TROVATO'}`);
            
            for (const roomId of SPECIAL_ROOMS) {
                try {
                    const response = await fetch(`/assets/audio/suono${roomId}.mp3`);
                    debugLog(`File stanza ${roomId}: ${response.ok ? 'OK' : 'NON TROVATO'}`);
                } catch (e) {
                    debugLog(`File stanza ${roomId}: ERRORE ${e.message}`, 'error');
                }
            }
        } catch (e) {
            debugLog(`Errore verifica file: ${e.message}`, 'error');
        }
    }
};