// audioSync.example.js — Examples d'utilisation du module AudioSync

import { AudioSync } from './audioSync.js';
import neuralSync from './neuralSync.js';

/**
 * Example 1: Setup de base avec deux decks
 */
async function example1_BasicDJSetup() {
    console.log('=== Example 1: Basic DJ Setup ===');

    const audioSync = new AudioSync();

    // Initialiser le système audio
    const initialized = await audioSync.initialize();
    if (!initialized) {
        console.error('Failed to initialize audio system');
        return;
    }

    // Créer deux decks
    const deckA = audioSync.createDeck('a');
    const deckB = audioSync.createDeck('b');

    console.log('Decks created:', deckA.id, deckB.id);

    // Callbacks
    audioSync.onBPMDetected = (deckId, bpm, buffer) => {
        console.log(`✅ BPM detected on deck ${deckId}: ${bpm} BPM`);
        console.log(`Duration: ${buffer.duration.toFixed(2)}s`);
    };

    // Simuler le chargement de fichiers
    // Dans une vraie application, ceci viendrait d'un input file
    // await audioSync.loadAudioFile('a', fileA);
    // await audioSync.loadAudioFile('b', fileB);

    // Lecture
    // audioSync.play('a');
    // audioSync.setVolume('a', 0.8);

    console.log('✅ Basic DJ setup complete');
}

/**
 * Example 2: Synchronisation BPM entre deux decks
 */
async function example2_BPMSync() {
    console.log('=== Example 2: BPM Synchronization ===');

    const audioSync = new AudioSync();
    await audioSync.initialize();

    // Créer les decks
    audioSync.createDeck('a');
    audioSync.createDeck('b');

    // Simuler des BPMs détectés
    // En réalité, ceci se fait automatiquement lors du loadAudioFile
    audioSync.decks.get('a').bpm = 128;
    audioSync.decks.get('b').bpm = 124;

    // Callback de synchronisation
    audioSync.onSyncUpdate = (syncData) => {
        console.log('🔄 Sync update:', syncData);
        console.log(`  Master: ${syncData.masterBPM} BPM`);
        console.log(`  Slave: ${syncData.slaveBPM} BPM`);
        console.log(`  Playback rate: ${syncData.adjustedRate.toFixed(3)}`);
    };

    // Synchroniser deck B sur deck A
    const result = audioSync.syncDecks('a', 'b');

    if (result.success) {
        console.log('✅ Decks synchronized successfully');
        console.log(`  Deck A: ${result.masterBPM} BPM`);
        console.log(`  Deck B: ${result.slaveBPM} BPM → ${result.masterBPM} BPM`);
    } else {
        console.log('❌ Sync failed:', result.reason);
    }
}

/**
 * Example 3: Contrôle de l'égaliseur (EQ)
 */
async function example3_EQControl() {
    console.log('=== Example 3: EQ Control ===');

    const audioSync = new AudioSync();
    await audioSync.initialize();

    const deck = audioSync.createDeck('a');

    // Ajuster les fréquences
    audioSync.setEQ('a', 'high', 6);   // +6dB sur les aigus
    audioSync.setEQ('a', 'mid', -3);   // -3dB sur les mediums
    audioSync.setEQ('a', 'low', 0);    // Pas de changement sur les graves

    console.log('✅ EQ settings applied:');
    console.log('  High: +6dB (3000 Hz)');
    console.log('  Mid: -3dB (1000 Hz)');
    console.log('  Low: 0dB (320 Hz)');

    // Réinitialiser l'EQ
    audioSync.setEQ('a', 'high', 0);
    audioSync.setEQ('a', 'mid', 0);
    audioSync.setEQ('a', 'low', 0);

    console.log('✅ EQ reset to flat');
}

/**
 * Example 4: Entrée microphone avec monitoring en direct
 */
async function example4_MicrophoneInput() {
    console.log('=== Example 4: Microphone Input ===');

    const audioSync = new AudioSync();
    await audioSync.initialize();

    // Activer le microphone
    const micEnabled = await audioSync.enableInput();

    if (micEnabled) {
        console.log('✅ Microphone enabled');

        // Régler le volume du micro
        audioSync.setMicVolume(0.5);
        console.log('  Volume: 50%');

        // Obtenir l'analyseur pour visualisation
        const analyser = audioSync.getAnalyser('mic');
        console.log('  Analyser FFT size:', analyser.fftSize);

        // Fonction de visualisation (à appeler dans requestAnimationFrame)
        const visualize = () => {
            const frequencies = audioSync.getFrequencyData('mic');
            const waveform = audioSync.getTimeDomainData('mic');

            // Calculer le niveau moyen
            let sum = 0;
            for (let i = 0; i < frequencies.length; i++) {
                sum += frequencies[i];
            }
            const average = sum / frequencies.length;

            console.log(`  Mic level: ${(average / 255 * 100).toFixed(1)}%`);

            // Dans une vraie app, dessiner sur un canvas ici
        };

        // Exemple de désactivation
        setTimeout(() => {
            audioSync.disableInput();
            console.log('✅ Microphone disabled');
        }, 5000);

    } else {
        console.log('❌ Microphone access denied');
    }
}

/**
 * Example 5: P2P Audio Streaming
 */
async function example5_P2PStreaming() {
    console.log('=== Example 5: P2P Audio Streaming ===');

    const audioSync = new AudioSync();
    await audioSync.initialize();

    // Obtenir le stream audio local pour transmission P2P
    const localStream = audioSync.getP2PAudioStream();

    console.log('✅ P2P audio stream ready');
    console.log('  Audio tracks:', localStream.getAudioTracks().length);

    // Simuler l'envoi via WebRTC (dans une vraie app)
    /*
    peerConnection.addTrack(localStream.getAudioTracks()[0], localStream);
    */

    // Simuler la réception d'un stream distant
    // Dans une vraie app, ceci viendrait de peerConnection.ontrack
    /*
    peerConnection.ontrack = (event) => {
        audioSync.connectRemoteAudio(event.streams[0]);
        console.log('✅ Remote DJ connected');
    };
    */

    console.log('✅ P2P setup complete');
}

/**
 * Example 6: Intégration avec NeuralSync
 */
async function example6_NeuralSyncIntegration() {
    console.log('=== Example 6: NeuralSync Integration ===');

    const audioSync = new AudioSync();
    await audioSync.initialize();

    // Créer les decks
    audioSync.createDeck('a');
    audioSync.createDeck('b');

    // Configurer NeuralSync
    neuralSync.setStatusCallback((status) => {
        console.log('🧠 NeuralSync status:', status.statusText);
    });

    neuralSync.setEffectSyncCallback((data) => {
        console.log('🔄 Effect sync:', data);

        // Appliquer des effets basés sur la synchronisation
        if (data.aligned) {
            console.log('  ✅ Beats aligned!');
            // Appliquer des effets de transition automatiques
        }
    });

    // Simuler des données de sync
    neuralSync.updateSyncData({
        bpm: 128,
        confidence: 95,
        align: true
    });

    // Auto-sync avec NeuralSync
    const syncResult = neuralSync.autoSyncTracks(
        { bpm: 128, confidence: 98 },
        { bpm: 124, confidence: 95 }
    );

    console.log('✅ NeuralSync result:', syncResult);
}

/**
 * Example 7: Contrôle avancé de la lecture
 */
async function example7_AdvancedPlaybackControl() {
    console.log('=== Example 7: Advanced Playback Control ===');

    const audioSync = new AudioSync();
    await audioSync.initialize();

    const deck = audioSync.createDeck('a');

    // Simuler un buffer chargé
    // deck.buffer = audioBuffer;
    // deck.duration = 245.5;

    // Lecture à partir d'une position spécifique
    // audioSync.play('a', 30); // Commence à 30 secondes

    // Ajuster la vitesse de lecture
    audioSync.setPlaybackRate('a', 1.05); // +5% plus rapide
    console.log('✅ Playback rate set to 1.05 (105%)');

    // Simuler un seek
    // audioSync.seek('a', 120); // Aller à 2 minutes
    console.log('✅ Seeked to 2:00');

    // Obtenir la position actuelle
    const currentTime = audioSync.getCurrentTime('a');
    console.log(`  Current position: ${currentTime.toFixed(2)}s`);

    // Pause et reprise
    // audioSync.pause('a');
    console.log('✅ Paused');

    // setTimeout(() => {
    //     audioSync.play('a'); // Reprend où on s'est arrêté
    //     console.log('✅ Resumed');
    // }, 2000);
}

/**
 * Example 8: Gestion des erreurs
 */
async function example8_ErrorHandling() {
    console.log('=== Example 8: Error Handling ===');

    const audioSync = new AudioSync();

    // Configurer le gestionnaire d'erreurs
    audioSync.onError = (message, error) => {
        console.error('❌ AudioSync Error:', message);
        console.error('  Details:', error);

        // Dans une vraie app:
        // - Afficher une notification à l'utilisateur
        // - Logger l'erreur pour debug
        // - Tenter une récupération si possible
    };

    await audioSync.initialize();

    // Tester une opération invalide
    const result = audioSync.play('nonexistent-deck');
    console.log('Play on nonexistent deck:', result); // false

    // Tenter de sync sans BPM
    const syncResult = audioSync.syncDecks('a', 'b');
    console.log('Sync without BPM:', syncResult);

    console.log('✅ Error handling demonstration complete');
}

/**
 * Example 9: Visualisation du waveform
 */
async function example9_WaveformVisualization() {
    console.log('=== Example 9: Waveform Visualization ===');

    const audioSync = new AudioSync();
    await audioSync.initialize();

    const deck = audioSync.createDeck('a');

    // Fonction de rendu du waveform
    function drawWaveform(canvasId, deckId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.log('Canvas not found (running in Node.js?)');
            return;
        }

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        function render() {
            requestAnimationFrame(render);

            // Obtenir les données du waveform
            const waveform = audioSync.getTimeDomainData(deckId);
            if (!waveform) return;

            // Clear canvas
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, width, height);

            // Dessiner le waveform
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#a855f7';
            ctx.beginPath();

            const sliceWidth = width / waveform.length;
            let x = 0;

            for (let i = 0; i < waveform.length; i++) {
                const v = waveform[i] / 128.0;
                const y = (v * height) / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.lineTo(width, height / 2);
            ctx.stroke();
        }

        render();
    }

    console.log('✅ Waveform visualization function ready');
    console.log('  Usage: drawWaveform("canvas-id", "deck-id")');
}

/**
 * Example 10: Cleanup et destruction
 */
async function example10_Cleanup() {
    console.log('=== Example 10: Cleanup ===');

    const audioSync = new AudioSync();
    await audioSync.initialize();

    audioSync.createDeck('a');
    audioSync.createDeck('b');
    await audioSync.enableInput();

    console.log('✅ Audio system running');
    console.log('  Decks:', audioSync.decks.size);
    console.log('  Analysers:', audioSync.analysers.size);

    // Nettoyage complet
    audioSync.destroy();

    console.log('✅ Audio system destroyed');
    console.log('  Decks:', audioSync.decks.size); // 0
    console.log('  Audio context:', audioSync.audioContext); // null
}

// Exporter les exemples
export {
    example1_BasicDJSetup,
    example2_BPMSync,
    example3_EQControl,
    example4_MicrophoneInput,
    example5_P2PStreaming,
    example6_NeuralSyncIntegration,
    example7_AdvancedPlaybackControl,
    example8_ErrorHandling,
    example9_WaveformVisualization,
    example10_Cleanup
};

// Si exécuté directement (pour test)
if (typeof window === 'undefined') {
    console.log('\n🎧 AudioSync Examples - Running in Node.js\n');
    console.log('Note: Some examples require browser APIs\n');

    // Exécuter les exemples qui ne nécessitent pas le navigateur
    // (en commentaire car ils nécessitent quand même Web Audio API)

    console.log('To run these examples:');
    console.log('1. Open your browser console');
    console.log('2. Import this file');
    console.log('3. Call any example function\n');

    console.log('Available examples:');
    console.log('  - example1_BasicDJSetup()');
    console.log('  - example2_BPMSync()');
    console.log('  - example3_EQControl()');
    console.log('  - example4_MicrophoneInput()');
    console.log('  - example5_P2PStreaming()');
    console.log('  - example6_NeuralSyncIntegration()');
    console.log('  - example7_AdvancedPlaybackControl()');
    console.log('  - example8_ErrorHandling()');
    console.log('  - example9_WaveformVisualization()');
    console.log('  - example10_Cleanup()');
}
