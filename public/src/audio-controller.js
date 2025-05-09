/**
 * Sistema audio ultra-semplificato per il gioco - AUDIO UNICO
 * - Log dettagliati
 */

// Variabili per gestire lo stato dell'audio
let mainAudio = null;
let isMuted = false;
let isAudioInitialized = false;

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
                isAudioInitialized = true;
                
                // Aggiungi pulsante mute
                addMuteButton();
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
    
    // Imposta il mute sull'audio principale
    if (mainAudio) {
        mainAudio.muted = isMuted;
    }
}

// Avvia tutto il processo
document.addEventListener('DOMContentLoaded', function() {
    debugLog("DOM caricato, inizializzazione audio manager...");
    createAudioButton();
});
