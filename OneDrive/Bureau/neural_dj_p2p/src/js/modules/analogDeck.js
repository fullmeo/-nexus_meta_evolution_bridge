// analogDeck.js — Analog Hardware Integration for NeuralMix P2P
// Supports turntables, CDJs, MIDI controllers, and audio interfaces

/**
 * AnalogDeck handles integration with physical DJ hardware
 * - Audio interface input (turntables, CDJs, external mixers)
 * - Multi-channel routing
 * - DVS (Digital Vinyl System) timecode detection
 * - MIDI controller mapping
 * - Hardware monitoring and levels
 */
export class AnalogDeck {
    constructor(audioSync) {
        this.audioSync = audioSync;

        // Audio inputs
        this.audioInputs = new Map(); // Map of input ID to MediaStreamSourceNode
        this.inputStreams = new Map(); // Map of input ID to MediaStream
        this.inputGains = new Map(); // Map of input ID to GainNode
        this.inputAnalysers = new Map(); // Map of input ID to AnalyserNode

        // DVS (Digital Vinyl System)
        this.dvsEnabled = new Map(); // Map of deck ID to DVS status
        this.timecodeDetectors = new Map(); // Map of deck ID to timecode detector
        this.timecodeType = 'serato'; // 'serato', 'traktor', 'rekordbox'

        // MIDI
        this.midiAccess = null;
        this.midiInputs = new Map();
        this.midiControllers = new Map();
        this.midiMappings = new Map();

        // Configuration
        this.config = {
            sampleRate: 48000,
            latency: 'balanced', // 'interactive', 'balanced', 'playback'
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false
        };

        // Callbacks
        this.onInputReady = null;
        this.onInputError = null;
        this.onTimecodeDetected = null;
        this.onMIDIMessage = null;
        this.onLevelUpdate = null;
    }

    /**
     * Initialize analog deck system
     * @param {Object} options - Configuration options
     * @returns {Promise<boolean>} Success status
     */
    async initialize(options = {}) {
        Object.assign(this.config, options);

        try {
            // Initialize MIDI
            await this.initializeMIDI();

            this.log('✅ Analog deck system initialized');
            return true;
        } catch (error) {
            this.triggerError('Failed to initialize analog deck system', error);
            return false;
        }
    }

    /**
     * Get available audio input devices
     * @returns {Promise<Array>} List of audio input devices
     */
    async getAvailableInputDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');

            return audioInputs.map(device => ({
                id: device.deviceId,
                label: device.label || `Microphone ${device.deviceId.substr(0, 8)}`,
                groupId: device.groupId
            }));
        } catch (error) {
            this.triggerError('Failed to enumerate devices', error);
            return [];
        }
    }

    /**
     * Connect audio interface to a deck
     * @param {string} deckId - Deck identifier ('a', 'b', 'ext1', 'ext2', etc.)
     * @param {Object} options - Configuration options
     * @param {string} options.deviceId - Audio device ID (optional)
     * @param {number} options.channelCount - Number of channels (1=mono, 2=stereo)
     * @param {boolean} options.dvsEnabled - Enable DVS timecode detection
     * @returns {Promise<Object>} Input metadata
     */
    async connectAudioInterface(deckId, options = {}) {
        const {
            deviceId = 'default',
            channelCount = 2,
            dvsEnabled = false
        } = options;

        try {
            // Create constraints
            const constraints = {
                audio: {
                    deviceId: deviceId === 'default' ? undefined : { exact: deviceId },
                    channelCount: channelCount,
                    sampleRate: this.config.sampleRate,
                    echoCancellation: this.config.echoCancellation,
                    autoGainControl: this.config.autoGainControl,
                    noiseSuppression: this.config.noiseSuppression,
                    latency: this.getLatencyValue(this.config.latency)
                }
            };

            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Store the stream
            this.inputStreams.set(deckId, stream);

            // Create audio source
            const audioContext = this.audioSync.audioContext;
            const sourceNode = audioContext.createMediaStreamSource(stream);
            this.audioInputs.set(deckId, sourceNode);

            // Create gain node for this input
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.8;
            this.inputGains.set(deckId, gainNode);

            // Create analyser for level monitoring
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            this.inputAnalysers.set(deckId, analyser);

            // Connect audio chain: Source → Gain → Analyser
            sourceNode.connect(gainNode);
            gainNode.connect(analyser);

            // Connect to deck or create external deck
            const deck = this.audioSync.decks.get(deckId);
            if (deck) {
                // Connect to existing deck's input
                analyser.connect(deck.gainNode);
            } else {
                // Create external deck
                const newDeck = this.audioSync.createDeck(deckId);
                analyser.connect(newDeck.gainNode);
            }

            // Enable DVS if requested
            if (dvsEnabled) {
                await this.enableDVS(deckId);
            }

            // Get device info
            const tracks = stream.getAudioTracks();
            const settings = tracks[0].getSettings();

            const metadata = {
                deckId: deckId,
                deviceId: deviceId,
                label: tracks[0].label,
                channelCount: settings.channelCount || channelCount,
                sampleRate: settings.sampleRate || this.config.sampleRate,
                latency: settings.latency,
                dvsEnabled: dvsEnabled
            };

            this.log(`🎛️ Audio interface connected to ${deckId.toUpperCase()}: ${metadata.label}`);

            if (this.onInputReady) {
                this.onInputReady(metadata);
            }

            // Start level monitoring
            this.startLevelMonitoring(deckId);

            return metadata;

        } catch (error) {
            this.triggerError(`Failed to connect audio interface to ${deckId}`, error);
            throw error;
        }
    }

    /**
     * Disconnect audio interface from deck
     * @param {string} deckId - Deck identifier
     */
    disconnectAudioInterface(deckId) {
        // Stop stream
        const stream = this.inputStreams.get(deckId);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            this.inputStreams.delete(deckId);
        }

        // Disconnect audio nodes
        const source = this.audioInputs.get(deckId);
        if (source) {
            source.disconnect();
            this.audioInputs.delete(deckId);
        }

        const gain = this.inputGains.get(deckId);
        if (gain) {
            gain.disconnect();
            this.inputGains.delete(deckId);
        }

        const analyser = this.inputAnalysers.get(deckId);
        if (analyser) {
            analyser.disconnect();
            this.inputAnalysers.delete(deckId);
        }

        // Disable DVS
        this.disableDVS(deckId);

        this.log(`🔌 Disconnected audio interface from ${deckId.toUpperCase()}`);
    }

    /**
     * Set input volume/gain
     * @param {string} deckId - Deck identifier
     * @param {number} volume - Volume 0-1
     */
    setInputVolume(deckId, volume) {
        const gainNode = this.inputGains.get(deckId);
        if (gainNode) {
            gainNode.gain.setValueAtTime(volume, this.audioSync.audioContext.currentTime);
        }
    }

    /**
     * Get input volume/gain
     * @param {string} deckId - Deck identifier
     * @returns {number} Volume 0-1
     */
    getInputVolume(deckId) {
        const gainNode = this.inputGains.get(deckId);
        return gainNode ? gainNode.gain.value : 0;
    }

    /**
     * Get latency value for constraint
     * @private
     */
    getLatencyValue(latency) {
        const values = {
            'interactive': 0.01, // 10ms - Best for DVS
            'balanced': 0.05,    // 50ms - Good balance
            'playback': 0.1      // 100ms - More stable
        };
        return values[latency] || values.balanced;
    }

    /**
     * Start level monitoring for input
     * @private
     */
    startLevelMonitoring(deckId) {
        const analyser = this.inputAnalysers.get(deckId);
        if (!analyser) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const monitor = () => {
            analyser.getByteFrequencyData(dataArray);

            // Calculate RMS level
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const level = rms / 255; // 0-1

            if (this.onLevelUpdate) {
                this.onLevelUpdate({
                    deckId: deckId,
                    level: level,
                    peak: Math.max(...dataArray) / 255,
                    timestamp: Date.now()
                });
            }

            // Continue monitoring
            requestAnimationFrame(monitor);
        };

        monitor();
    }

    /**
     * Enable DVS (Digital Vinyl System) timecode detection
     * @param {string} deckId - Deck identifier
     * @param {string} timecodeType - 'serato', 'traktor', or 'rekordbox'
     * @returns {Promise<boolean>} Success status
     */
    async enableDVS(deckId, timecodeType = 'serato') {
        this.timecodeType = timecodeType;

        const analyser = this.inputAnalysers.get(deckId);
        if (!analyser) {
            this.triggerError('No audio input connected for DVS');
            return false;
        }

        try {
            // Create timecode detector
            const detector = new TimecodeDetector(analyser, timecodeType);

            detector.onDetected = (timecodeData) => {
                if (this.onTimecodeDetected) {
                    this.onTimecodeDetected({
                        deckId: deckId,
                        position: timecodeData.position,
                        speed: timecodeData.speed,
                        direction: timecodeData.direction,
                        quality: timecodeData.quality
                    });
                }

                // Apply to deck playback
                this.applyDVSControl(deckId, timecodeData);
            };

            this.timecodeDetectors.set(deckId, detector);
            this.dvsEnabled.set(deckId, true);

            this.log(`🎚️ DVS enabled for ${deckId.toUpperCase()} (${timecodeType})`);
            return true;

        } catch (error) {
            this.triggerError('Failed to enable DVS', error);
            return false;
        }
    }

    /**
     * Disable DVS for deck
     * @param {string} deckId - Deck identifier
     */
    disableDVS(deckId) {
        const detector = this.timecodeDetectors.get(deckId);
        if (detector) {
            detector.stop();
            this.timecodeDetectors.delete(deckId);
        }

        this.dvsEnabled.set(deckId, false);
        this.log(`🎚️ DVS disabled for ${deckId.toUpperCase()}`);
    }

    /**
     * Apply DVS control to deck playback
     * @private
     */
    applyDVSControl(deckId, timecodeData) {
        const deck = this.audioSync.decks.get(deckId);
        if (!deck || !deck.source) return;

        // Adjust playback rate based on vinyl speed
        const playbackRate = timecodeData.speed * (timecodeData.direction === 'forward' ? 1 : -1);
        this.audioSync.setPlaybackRate(deckId, Math.abs(playbackRate));

        // Handle scratching/direction changes
        if (timecodeData.direction === 'backward' && deck.isPlaying) {
            // For backward, would need reverse playback (complex)
            // For now, just slow down
            this.audioSync.setPlaybackRate(deckId, 0.1);
        }
    }

    /**
     * Initialize MIDI support
     * @private
     */
    async initializeMIDI() {
        if (!navigator.requestMIDIAccess) {
            this.log('⚠️ MIDI not supported in this browser');
            return false;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });

            // List available MIDI inputs
            this.midiAccess.inputs.forEach((input) => {
                this.log(`🎹 MIDI Input: ${input.name}`);
                this.midiInputs.set(input.id, input);

                // Set up message handler
                input.onmidimessage = (message) => {
                    this.handleMIDIMessage(input.id, message);
                };
            });

            this.log('✅ MIDI initialized');
            return true;

        } catch (error) {
            this.triggerError('Failed to initialize MIDI', error);
            return false;
        }
    }

    /**
     * Handle incoming MIDI message
     * @private
     */
    handleMIDIMessage(inputId, message) {
        const [status, data1, data2] = message.data;
        const command = status >> 4;
        const channel = status & 0x0f;

        const midiEvent = {
            inputId: inputId,
            command: this.getMIDICommand(command),
            channel: channel,
            note: data1,
            velocity: data2,
            value: data2 / 127, // Normalized 0-1
            timestamp: message.timeStamp
        };

        // Apply MIDI mapping if exists
        this.applyMIDIMapping(midiEvent);

        // Trigger callback
        if (this.onMIDIMessage) {
            this.onMIDIMessage(midiEvent);
        }
    }

    /**
     * Get MIDI command name
     * @private
     */
    getMIDICommand(command) {
        const commands = {
            8: 'noteoff',
            9: 'noteon',
            10: 'aftertouch',
            11: 'controlchange',
            12: 'programchange',
            13: 'channelaftertouch',
            14: 'pitchbend'
        };
        return commands[command] || 'unknown';
    }

    /**
     * Map MIDI control to application function
     * @param {Object} mapping - MIDI mapping configuration
     * @param {string} mapping.inputId - MIDI input ID
     * @param {number} mapping.note - MIDI note/CC number
     * @param {string} mapping.action - Action to perform
     * @param {string} mapping.deckId - Deck to control (optional)
     */
    addMIDIMapping(mapping) {
        const key = `${mapping.inputId}-${mapping.note}`;
        this.midiMappings.set(key, mapping);
        this.log(`🎹 MIDI mapping added: ${mapping.note} → ${mapping.action}`);
    }

    /**
     * Remove MIDI mapping
     * @param {string} inputId - MIDI input ID
     * @param {number} note - MIDI note/CC number
     */
    removeMIDIMapping(inputId, note) {
        const key = `${inputId}-${note}`;
        this.midiMappings.delete(key);
    }

    /**
     * Apply MIDI mapping to control
     * @private
     */
    applyMIDIMapping(midiEvent) {
        const key = `${midiEvent.inputId}-${midiEvent.note}`;
        const mapping = this.midiMappings.get(key);

        if (!mapping) return;

        const { action, deckId, parameter } = mapping;

        // Execute mapped action
        switch (action) {
            case 'play':
                if (midiEvent.command === 'noteon') {
                    this.audioSync.play(deckId);
                }
                break;

            case 'pause':
                if (midiEvent.command === 'noteon') {
                    this.audioSync.pause(deckId);
                }
                break;

            case 'volume':
                this.audioSync.setVolume(deckId, midiEvent.value);
                break;

            case 'crossfader':
                // Apply to crossfader position
                break;

            case 'eq':
                // parameter should be 'high', 'mid', or 'low'
                const gain = (midiEvent.value - 0.5) * 24; // -12 to +12 dB
                this.audioSync.setEQ(deckId, parameter, gain);
                break;

            case 'pitch':
                const pitchRange = 0.16; // ±16%
                const pitchValue = 1 + ((midiEvent.value - 0.5) * 2 * pitchRange);
                this.audioSync.setPlaybackRate(deckId, pitchValue);
                break;

            case 'cue':
                if (midiEvent.command === 'noteon') {
                    // Set cue point
                    const currentTime = this.audioSync.getCurrentTime(deckId);
                    // Store cue point (would need cue point system)
                }
                break;

            case 'hotcue':
                if (midiEvent.command === 'noteon') {
                    // Jump to hot cue
                    // Would need hot cue system
                }
                break;

            default:
                this.log(`⚠️ Unknown MIDI action: ${action}`);
        }
    }

    /**
     * Create default MIDI mappings for common controllers
     * @param {string} controllerType - 'pioneer-ddj', 'numark-mixtrack', 'traktor-s2', etc.
     */
    loadControllerMapping(controllerType) {
        // Predefined mappings for popular controllers
        const mappings = this.getControllerMappings(controllerType);

        mappings.forEach(mapping => {
            this.addMIDIMapping(mapping);
        });

        this.log(`🎹 Loaded ${mappings.length} mappings for ${controllerType}`);
    }

    /**
     * Get predefined controller mappings
     * @private
     */
    getControllerMappings(controllerType) {
        // Example mappings for Pioneer DDJ-400
        const pioneerDDJ = [
            { note: 11, action: 'play', deckId: 'a' },
            { note: 43, action: 'play', deckId: 'b' },
            { note: 13, action: 'volume', deckId: 'a' },
            { note: 45, action: 'volume', deckId: 'b' },
            { note: 16, action: 'eq', deckId: 'a', parameter: 'high' },
            { note: 17, action: 'eq', deckId: 'a', parameter: 'mid' },
            { note: 18, action: 'eq', deckId: 'a', parameter: 'low' },
            { note: 48, action: 'eq', deckId: 'b', parameter: 'high' },
            { note: 49, action: 'eq', deckId: 'b', parameter: 'mid' },
            { note: 50, action: 'eq', deckId: 'b', parameter: 'low' },
            { note: 8, action: 'crossfader' }
        ];

        const mappingPresets = {
            'pioneer-ddj': pioneerDDJ,
            'pioneer-ddj-400': pioneerDDJ,
            'numark-mixtrack': [],
            'traktor-s2': [],
            'generic': []
        };

        return mappingPresets[controllerType] || [];
    }

    /**
     * Get analog deck status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            audioInputs: Array.from(this.audioInputs.keys()),
            dvsEnabled: Array.from(this.dvsEnabled.entries()),
            midiInputs: Array.from(this.midiInputs.values()).map(input => ({
                id: input.id,
                name: input.name,
                manufacturer: input.manufacturer
            })),
            midiMappings: this.midiMappings.size,
            config: this.config
        };
    }

    /**
     * Log message
     * @private
     */
    log(message) {
        console.log(`[AnalogDeck] ${message}`);
    }

    /**
     * Trigger error callback
     * @private
     */
    triggerError(message, error = null) {
        if (this.onInputError) {
            this.onInputError(message, error);
        }
        console.error(`[AnalogDeck] ${message}`, error);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Disconnect all audio inputs
        this.audioInputs.forEach((_, deckId) => {
            this.disconnectAudioInterface(deckId);
        });

        // Disable all DVS
        this.dvsEnabled.forEach((_, deckId) => {
            this.disableDVS(deckId);
        });

        // Close MIDI inputs
        if (this.midiAccess) {
            this.midiAccess.inputs.forEach(input => {
                input.onmidimessage = null;
            });
        }

        this.log('🔌 Analog deck system destroyed');
    }
}

/**
 * TimecodeDetector class for DVS support
 * Detects and decodes timecode signals from vinyl/CDJ
 */
class TimecodeDetector {
    constructor(analyser, timecodeType = 'serato') {
        this.analyser = analyser;
        this.timecodeType = timecodeType;
        this.isRunning = false;

        // Timecode frequencies (Hz)
        this.timecodeFrequencies = {
            'serato': { left: 1000, right: 1500 },    // Serato CV02
            'traktor': { left: 2000, right: 2500 },    // Traktor Scratch
            'rekordbox': { left: 1800, right: 2200 }   // Rekordbox DVS
        };

        this.onDetected = null;

        this.start();
    }

    start() {
        this.isRunning = true;
        this.detect();
    }

    detect() {
        if (!this.isRunning) return;

        const freqData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(freqData);

        // Simplified timecode detection (real implementation would be much more complex)
        // This is a placeholder - actual DVS requires sophisticated signal processing

        const avgLevel = freqData.reduce((a, b) => a + b, 0) / freqData.length;

        if (avgLevel > 50) {
            // Simulated timecode data
            const timecodeData = {
                position: Math.random() * 1000, // Position in ms
                speed: 1.0 + (Math.random() - 0.5) * 0.2, // 0.9 - 1.1
                direction: Math.random() > 0.5 ? 'forward' : 'backward',
                quality: Math.min(100, avgLevel * 2) // Signal quality percentage
            };

            if (this.onDetected) {
                this.onDetected(timecodeData);
            }
        }

        // Continue detection
        requestAnimationFrame(() => this.detect());
    }

    stop() {
        this.isRunning = false;
    }
}

// Export
export default AnalogDeck;
