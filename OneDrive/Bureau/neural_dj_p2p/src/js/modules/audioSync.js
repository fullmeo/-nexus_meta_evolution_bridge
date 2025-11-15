// audioSync.js  Module de synchronisation audio pour NeuralMix P2P Enhanced
// Gère l'audio via Web Audio API, BPM detection, P2P streaming et synchronisation

export class AudioSync {
    constructor() {
        // Audio Context
        this.audioContext = null;
        this.masterGain = null;
        this.compressor = null;

        // Decks audio
        this.decks = new Map();

        // Microphone / External input
        this.micStream = null;
        this.micSource = null;
        this.micGain = null;

        // Analysers for visualization and BPM detection
        this.analysers = new Map();

        // P2P Audio streaming
        this.p2pAudioDestination = null;
        this.p2pAudioStream = null;
        this.remoteAudioSource = null;

        // Synchronization state
        this.syncState = {
            masterDeck: null,
            syncEnabled: false,
            bpmOffset: 0
        };

        // Callbacks
        this.onBPMDetected = null;
        this.onAudioReady = null;
        this.onError = null;
        this.onSyncUpdate = null;
    }

    /**
     * Initialize the audio system
     * @returns {Promise<boolean>}
     */
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain and compressor
            this.masterGain = this.audioContext.createGain();
            this.compressor = this.audioContext.createDynamicsCompressor();

            // Setup audio chain: compressor -> master gain -> speakers
            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);

            // Configure compressor for DJ mixing
            this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
            this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
            this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
            this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
            this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

            // Setup P2P audio destination
            this.p2pAudioDestination = this.audioContext.createMediaStreamDestination();
            this.masterGain.connect(this.p2pAudioDestination);
            this.p2pAudioStream = this.p2pAudioDestination.stream;

            // Resume audio context if needed
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            if (this.onAudioReady) {
                this.onAudioReady(true);
            }

            console.log(' AudioSync initialized successfully');
            return true;

        } catch (error) {
            console.error('L AudioSync initialization error:', error);
            if (this.onError) {
                this.onError('Failed to initialize audio system', error);
            }
            return false;
        }
    }

    /**
     * Create a new deck
     * @param {string} deckId - Unique identifier for the deck (e.g., 'a', 'b', 'ext')
     * @returns {Object} Deck audio nodes
     */
    createDeck(deckId) {
        if (this.decks.has(deckId)) {
            console.warn(`Deck ${deckId} already exists`);
            return this.decks.get(deckId);
        }

        // Create audio nodes for this deck
        const gainNode = this.audioContext.createGain();
        const analyser = this.audioContext.createAnalyser();
        const filterHigh = this.audioContext.createBiquadFilter();
        const filterMid = this.audioContext.createBiquadFilter();
        const filterLow = this.audioContext.createBiquadFilter();

        // Configure analyser for BPM detection and visualization
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        // Configure EQ filters
        filterHigh.type = 'highshelf';
        filterHigh.frequency.setValueAtTime(3000, this.audioContext.currentTime);
        filterHigh.gain.setValueAtTime(0, this.audioContext.currentTime);

        filterMid.type = 'peaking';
        filterMid.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filterMid.Q.setValueAtTime(1, this.audioContext.currentTime);
        filterMid.gain.setValueAtTime(0, this.audioContext.currentTime);

        filterLow.type = 'lowshelf';
        filterLow.frequency.setValueAtTime(320, this.audioContext.currentTime);
        filterLow.gain.setValueAtTime(0, this.audioContext.currentTime);

        // Audio chain: source -> filters -> gain -> analyser -> compressor
        filterLow.connect(filterMid);
        filterMid.connect(filterHigh);
        filterHigh.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(this.compressor);

        const deck = {
            id: deckId,
            gainNode,
            analyser,
            filterHigh,
            filterMid,
            filterLow,
            source: null,
            buffer: null,
            isPlaying: false,
            currentTime: 0,
            startTime: 0,
            bpm: 0,
            duration: 0,
            playbackRate: 1.0
        };

        this.decks.set(deckId, deck);
        this.analysers.set(deckId, analyser);

        console.log(` Deck ${deckId} created`);
        return deck;
    }

    /**
     * Load an audio file into a deck
     * @param {string} deckId - Deck identifier
     * @param {File} file - Audio file to load
     * @returns {Promise<Object>} Audio data (buffer, duration, bpm)
     */
    async loadAudioFile(deckId, file) {
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Get or create deck
            let deck = this.decks.get(deckId);
            if (!deck) {
                deck = this.createDeck(deckId);
            }

            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();

            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Store buffer in deck
            deck.buffer = audioBuffer;
            deck.duration = audioBuffer.duration;

            // Detect BPM
            const bpm = await this.detectBPM(audioBuffer);
            deck.bpm = bpm;

            if (this.onBPMDetected) {
                this.onBPMDetected(deckId, bpm, audioBuffer);
            }

            console.log(` Audio loaded on deck ${deckId}: ${file.name} (${Math.round(audioBuffer.duration)}s, ${bpm} BPM)`);

            return {
                buffer: audioBuffer,
                duration: audioBuffer.duration,
                bpm: bpm,
                fileName: file.name
            };

        } catch (error) {
            console.error(`L Error loading audio on deck ${deckId}:`, error);
            if (this.onError) {
                this.onError(`Failed to load audio on deck ${deckId}`, error);
            }
            throw error;
        }
    }

    /**
     * Play audio from a deck
     * @param {string} deckId - Deck identifier
     * @param {number} offset - Start offset in seconds (default: 0)
     * @returns {boolean} Success status
     */
    play(deckId, offset = 0) {
        const deck = this.decks.get(deckId);
        if (!deck || !deck.buffer) {
            console.warn(`Cannot play deck ${deckId}: no audio loaded`);
            return false;
        }

        // Stop existing source if playing
        if (deck.source) {
            try {
                deck.source.stop();
            } catch (e) {
                // Ignore if already stopped
            }
            deck.source.disconnect();
        }

        // Create new buffer source
        const source = this.audioContext.createBufferSource();
        source.buffer = deck.buffer;
        source.playbackRate.setValueAtTime(deck.playbackRate, this.audioContext.currentTime);

        // Connect to filter chain
        source.connect(deck.filterLow);

        // Start playback
        const now = this.audioContext.currentTime;
        const startOffset = offset || deck.currentTime || 0;

        source.start(now, startOffset);

        // Update deck state
        deck.source = source;
        deck.isPlaying = true;
        deck.startTime = now - startOffset;

        // Handle end of playback
        source.onended = () => {
            if (deck.isPlaying) {
                deck.isPlaying = false;
                deck.currentTime = 0;
                console.log(`<µ Deck ${deckId} playback ended`);
            }
        };

        console.log(`¶ Playing deck ${deckId} from ${startOffset.toFixed(2)}s`);
        return true;
    }

    /**
     * Pause playback on a deck
     * @param {string} deckId - Deck identifier
     * @returns {boolean} Success status
     */
    pause(deckId) {
        const deck = this.decks.get(deckId);
        if (!deck || !deck.isPlaying) {
            return false;
        }

        // Calculate current position
        deck.currentTime = this.audioContext.currentTime - deck.startTime;

        // Stop the source
        if (deck.source) {
            try {
                deck.source.stop();
            } catch (e) {
                // Ignore if already stopped
            }
            deck.source.disconnect();
            deck.source = null;
        }

        deck.isPlaying = false;

        console.log(`ø Paused deck ${deckId} at ${deck.currentTime.toFixed(2)}s`);
        return true;
    }

    /**
     * Stop playback on a deck and reset position
     * @param {string} deckId - Deck identifier
     * @returns {boolean} Success status
     */
    stop(deckId) {
        const deck = this.decks.get(deckId);
        if (!deck) {
            return false;
        }

        // Stop the source
        if (deck.source) {
            try {
                deck.source.stop();
            } catch (e) {
                // Ignore
            }
            deck.source.disconnect();
            deck.source = null;
        }

        deck.isPlaying = false;
        deck.currentTime = 0;

        console.log(`ù Stopped deck ${deckId}`);
        return true;
    }

    /**
     * Set volume for a deck
     * @param {string} deckId - Deck identifier
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(deckId, volume) {
        const deck = this.decks.get(deckId);
        if (deck) {
            const clampedVolume = Math.max(0, Math.min(1, volume));
            deck.gainNode.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime);
        }
    }

    /**
     * Set EQ filter gain
     * @param {string} deckId - Deck identifier
     * @param {string} band - Filter band ('high', 'mid', 'low')
     * @param {number} gain - Gain in dB (-40 to +40)
     */
    setEQ(deckId, band, gain) {
        const deck = this.decks.get(deckId);
        if (!deck) return;

        const clampedGain = Math.max(-40, Math.min(40, gain));

        switch(band) {
            case 'high':
                deck.filterHigh.gain.setValueAtTime(clampedGain, this.audioContext.currentTime);
                break;
            case 'mid':
                deck.filterMid.gain.setValueAtTime(clampedGain, this.audioContext.currentTime);
                break;
            case 'low':
                deck.filterLow.gain.setValueAtTime(clampedGain, this.audioContext.currentTime);
                break;
        }
    }

    /**
     * Set playback rate for a deck (for tempo/pitch adjustment)
     * @param {string} deckId - Deck identifier
     * @param {number} rate - Playback rate (0.5 to 2.0)
     */
    setPlaybackRate(deckId, rate) {
        const deck = this.decks.get(deckId);
        if (!deck) return;

        const clampedRate = Math.max(0.5, Math.min(2.0, rate));
        deck.playbackRate = clampedRate;

        // Apply to active source if playing
        if (deck.source && deck.isPlaying) {
            deck.source.playbackRate.setValueAtTime(clampedRate, this.audioContext.currentTime);
        }
    }

    /**
     * Synchronize two decks by BPM
     * @param {string} masterDeckId - Master deck identifier
     * @param {string} slaveDeckId - Slave deck identifier
     * @returns {Object} Sync result
     */
    syncDecks(masterDeckId, slaveDeckId) {
        const masterDeck = this.decks.get(masterDeckId);
        const slaveDeck = this.decks.get(slaveDeckId);

        if (!masterDeck || !slaveDeck || !masterDeck.bpm || !slaveDeck.bpm) {
            console.warn('Cannot sync decks: missing BPM data');
            return { success: false, reason: 'missing_bpm' };
        }

        // Calculate playback rate adjustment
        const bpmRatio = masterDeck.bpm / slaveDeck.bpm;
        const adjustedRate = slaveDeck.playbackRate * bpmRatio;

        // Apply sync
        this.setPlaybackRate(slaveDeckId, adjustedRate);

        // Update sync state
        this.syncState.masterDeck = masterDeckId;
        this.syncState.syncEnabled = true;
        this.syncState.bpmOffset = masterDeck.bpm - slaveDeck.bpm;

        if (this.onSyncUpdate) {
            this.onSyncUpdate({
                master: masterDeckId,
                slave: slaveDeckId,
                masterBPM: masterDeck.bpm,
                slaveBPM: slaveDeck.bpm,
                adjustedRate: adjustedRate,
                synced: true
            });
        }

        console.log(`= Synced deck ${slaveDeckId} to ${masterDeckId}: ${slaveDeck.bpm} BPM -> ${masterDeck.bpm} BPM (rate: ${adjustedRate.toFixed(3)})`);

        return {
            success: true,
            masterBPM: masterDeck.bpm,
            slaveBPM: slaveDeck.bpm,
            playbackRate: adjustedRate
        };
    }

    /**
     * Enable microphone input
     * @returns {Promise<boolean>}
     */
    async enableInput() {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Create microphone source
            this.micStream = stream;
            this.micSource = this.audioContext.createMediaStreamSource(stream);
            this.micGain = this.audioContext.createGain();

            // Create analyser for mic
            const micAnalyser = this.audioContext.createAnalyser();
            micAnalyser.fftSize = 2048;
            this.analysers.set('mic', micAnalyser);

            // Connect: mic -> gain -> analyser -> compressor
            this.micSource.connect(this.micGain);
            this.micGain.connect(micAnalyser);
            micAnalyser.connect(this.compressor);

            // Start with low volume for safety
            this.micGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);

            console.log('<¤ Microphone input enabled');
            return true;

        } catch (error) {
            console.error('L Microphone access error:', error);
            if (this.onError) {
                this.onError('Failed to enable microphone', error);
            }
            return false;
        }
    }

    /**
     * Disable microphone input
     */
    disableInput() {
        if (this.micSource) {
            this.micSource.disconnect();
            this.micSource = null;
        }

        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }

        if (this.micGain) {
            this.micGain.disconnect();
            this.micGain = null;
        }

        this.analysers.delete('mic');

        console.log('<¤ Microphone input disabled');
    }

    /**
     * Set microphone volume
     * @param {number} volume - Volume level (0-1)
     */
    setMicVolume(volume) {
        if (this.micGain) {
            const clampedVolume = Math.max(0, Math.min(1, volume));
            this.micGain.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime);
        }
    }

    /**
     * Get audio analyser for a deck or microphone
     * @param {string} id - Deck ID or 'mic'
     * @returns {AnalyserNode|null}
     */
    getAnalyser(id) {
        return this.analysers.get(id) || null;
    }

    /**
     * Get frequency data for visualization
     * @param {string} id - Deck ID or 'mic'
     * @returns {Uint8Array|null}
     */
    getFrequencyData(id) {
        const analyser = this.analysers.get(id);
        if (!analyser) return null;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    /**
     * Get time domain data for waveform visualization
     * @param {string} id - Deck ID or 'mic'
     * @returns {Uint8Array|null}
     */
    getTimeDomainData(id) {
        const analyser = this.analysers.get(id);
        if (!analyser) return null;

        const dataArray = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    }

    /**
     * Detect BPM from audio buffer using peak detection algorithm
     * @param {AudioBuffer} buffer - Audio buffer to analyze
     * @returns {Promise<number>} Detected BPM
     */
    async detectBPM(buffer) {
        return new Promise((resolve) => {
            try {
                // Get audio data from first channel
                const audioData = buffer.getChannelData(0);
                const sampleRate = buffer.sampleRate;

                // Apply low-pass filter to isolate bass/kick drum
                const filtered = this.lowPassFilter(audioData, sampleRate, 200);

                // Detect peaks (potential beats)
                const peaks = this.detectPeaks(filtered, sampleRate);

                // Calculate intervals between peaks
                const intervals = [];
                for (let i = 1; i < peaks.length; i++) {
                    intervals.push(peaks[i] - peaks[i - 1]);
                }

                // Find median interval (more robust than average)
                if (intervals.length === 0) {
                    resolve(120); // Default BPM
                    return;
                }

                intervals.sort((a, b) => a - b);
                const medianInterval = intervals[Math.floor(intervals.length / 2)];

                // Convert interval to BPM
                const bpm = Math.round(60 / medianInterval);

                // Clamp to reasonable range (60-200 BPM)
                const clampedBPM = Math.max(60, Math.min(200, bpm));

                resolve(clampedBPM);

            } catch (error) {
                console.error('BPM detection error:', error);
                resolve(120); // Default BPM on error
            }
        });
    }

    /**
     * Simple low-pass filter implementation
     * @private
     */
    lowPassFilter(data, sampleRate, cutoffFreq) {
        const RC = 1 / (2 * Math.PI * cutoffFreq);
        const dt = 1 / sampleRate;
        const alpha = dt / (RC + dt);

        const filtered = new Float32Array(data.length);
        filtered[0] = data[0];

        for (let i = 1; i < data.length; i++) {
            filtered[i] = filtered[i - 1] + alpha * (data[i] - filtered[i - 1]);
        }

        return filtered;
    }

    /**
     * Detect peaks in audio data
     * @private
     */
    detectPeaks(data, sampleRate) {
        const peaks = [];
        const minPeakDistance = Math.floor(sampleRate * 0.3); // Min 300ms between beats
        const threshold = this.calculateThreshold(data);

        let lastPeak = -minPeakDistance;

        for (let i = 1; i < data.length - 1; i++) {
            // Check if this is a local maximum above threshold
            if (data[i] > threshold &&
                data[i] > data[i - 1] &&
                data[i] > data[i + 1] &&
                (i - lastPeak) >= minPeakDistance) {

                peaks.push(i / sampleRate);
                lastPeak = i;
            }
        }

        return peaks;
    }

    /**
     * Calculate adaptive threshold for peak detection
     * @private
     */
    calculateThreshold(data) {
        // Calculate RMS energy
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        const rms = Math.sqrt(sum / data.length);

        // Threshold is 1.5x RMS
        return rms * 1.5;
    }

    /**
     * Get P2P audio stream for WebRTC
     * @returns {MediaStream|null}
     */
    getP2PAudioStream() {
        return this.p2pAudioStream;
    }

    /**
     * Connect remote P2P audio stream
     * @param {MediaStream} stream - Remote audio stream
     */
    connectRemoteAudio(stream) {
        try {
            // Disconnect previous remote source
            if (this.remoteAudioSource) {
                this.remoteAudioSource.disconnect();
            }

            // Create source from remote stream
            this.remoteAudioSource = this.audioContext.createMediaStreamSource(stream);

            // Create gain for remote audio
            const remoteGain = this.audioContext.createGain();
            remoteGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);

            // Connect: remote -> gain -> compressor
            this.remoteAudioSource.connect(remoteGain);
            remoteGain.connect(this.compressor);

            console.log('< Remote P2P audio connected');

        } catch (error) {
            console.error('L Remote audio connection error:', error);
            if (this.onError) {
                this.onError('Failed to connect remote audio', error);
            }
        }
    }

    /**
     * Disconnect remote P2P audio
     */
    disconnectRemoteAudio() {
        if (this.remoteAudioSource) {
            this.remoteAudioSource.disconnect();
            this.remoteAudioSource = null;
            console.log('< Remote P2P audio disconnected');
        }
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            const clampedVolume = Math.max(0, Math.min(1, volume));
            this.masterGain.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime);
        }
    }

    /**
     * Get current playback time for a deck
     * @param {string} deckId - Deck identifier
     * @returns {number} Current time in seconds
     */
    getCurrentTime(deckId) {
        const deck = this.decks.get(deckId);
        if (!deck) return 0;

        if (deck.isPlaying) {
            return this.audioContext.currentTime - deck.startTime;
        }

        return deck.currentTime;
    }

    /**
     * Seek to a position in a deck
     * @param {string} deckId - Deck identifier
     * @param {number} time - Time in seconds
     */
    seek(deckId, time) {
        const deck = this.decks.get(deckId);
        if (!deck || !deck.buffer) return;

        const wasPlaying = deck.isPlaying;

        // Stop current playback
        if (wasPlaying) {
            this.pause(deckId);
        }

        // Set new time
        deck.currentTime = Math.max(0, Math.min(time, deck.duration));

        // Resume if was playing
        if (wasPlaying) {
            this.play(deckId, deck.currentTime);
        }
    }

    /**
     * Cleanup and destroy audio context
     */
    destroy() {
        // Stop all decks
        for (const [deckId] of this.decks) {
            this.stop(deckId);
        }

        // Disable microphone
        this.disableInput();

        // Disconnect remote audio
        this.disconnectRemoteAudio();

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Clear maps
        this.decks.clear();
        this.analysers.clear();

        console.log('= AudioSync destroyed');
    }
}

// Export singleton instance
const audioSync = new AudioSync();

export default audioSync;
