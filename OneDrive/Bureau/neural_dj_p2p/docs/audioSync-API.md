# AudioSync API Documentation

## Overview

`audioSync.js` is the core audio synchronization module for NeuralMix P2P. It handles all audio operations using the Web Audio API, including:

- Multi-deck audio playback and mixing
- BPM detection and synchronization
- Microphone/external input handling
- Real-time audio effects and EQ
- P2P audio streaming via WebRTC
- Waveform and frequency analysis

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [API Reference](#api-reference)
4. [Examples](#examples)
5. [Architecture](#architecture)

---

## Installation

```javascript
// Import the AudioSync class
import { AudioSync } from './modules/audioSync.js';

// Or use the singleton instance
import audioSync from './modules/audioSync.js';
```

---

## Quick Start

```javascript
import { AudioSync } from './modules/audioSync.js';

// Create instance
const audioSync = new AudioSync();

// Initialize audio system
await audioSync.initialize();

// Create decks
audioSync.createDeck('a');
audioSync.createDeck('b');

// Load audio file
const fileInput = document.getElementById('file-input');
const audioData = await audioSync.loadAudioFile('a', fileInput.files[0]);

console.log(`Loaded: ${audioData.fileName}, BPM: ${audioData.bpm}`);

// Play
audioSync.play('a');

// Sync decks by BPM
audioSync.syncDecks('a', 'b');
```

---

## API Reference

### Constructor

#### `new AudioSync()`

Creates a new AudioSync instance.

```javascript
const audioSync = new AudioSync();
```

---

### Initialization

#### `initialize()`

Initializes the audio system, creates audio context, and sets up master audio chain.

**Returns:** `Promise<boolean>` - Success status

```javascript
const success = await audioSync.initialize();
if (success) {
    console.log('Audio system ready!');
}
```

**Audio Chain:** `Compressor → Master Gain → Speakers`

---

### Deck Management

#### `createDeck(deckId)`

Creates a new audio deck with full mixing capabilities.

**Parameters:**
- `deckId` (string) - Unique identifier (e.g., 'a', 'b', 'ext')

**Returns:** `Object` - Deck configuration

```javascript
const deck = audioSync.createDeck('a');
// Deck audio chain: Source → Low EQ → Mid EQ → High EQ → Gain → Analyser → Compressor
```

**Deck Object Structure:**
```javascript
{
    id: 'a',
    gainNode: GainNode,
    analyser: AnalyserNode,
    filterHigh: BiquadFilterNode,
    filterMid: BiquadFilterNode,
    filterLow: BiquadFilterNode,
    source: AudioBufferSourceNode,
    buffer: AudioBuffer,
    isPlaying: false,
    currentTime: 0,
    startTime: 0,
    bpm: 0,
    duration: 0,
    playbackRate: 1.0
}
```

#### `loadAudioFile(deckId, file)`

Loads an audio file into a deck and detects BPM.

**Parameters:**
- `deckId` (string) - Deck identifier
- `file` (File) - Audio file object

**Returns:** `Promise<Object>` - Audio metadata

```javascript
const input = document.getElementById('file-a');
const data = await audioSync.loadAudioFile('a', input.files[0]);

console.log(data);
// {
//     buffer: AudioBuffer,
//     duration: 245.5,
//     bpm: 128,
//     fileName: 'track.mp3'
// }
```

---

### Playback Control

#### `play(deckId, offset = 0)`

Starts playback on a deck.

**Parameters:**
- `deckId` (string) - Deck identifier
- `offset` (number) - Start position in seconds (optional)

**Returns:** `boolean` - Success status

```javascript
// Play from beginning
audioSync.play('a');

// Play from 30 seconds
audioSync.play('a', 30);
```

#### `pause(deckId)`

Pauses playback and saves current position.

**Parameters:**
- `deckId` (string) - Deck identifier

**Returns:** `boolean` - Success status

```javascript
audioSync.pause('a');
```

#### `stop(deckId)`

Stops playback and resets position to 0.

**Parameters:**
- `deckId` (string) - Deck identifier

**Returns:** `boolean` - Success status

```javascript
audioSync.stop('a');
```

#### `seek(deckId, time)`

Seeks to a specific position in the track.

**Parameters:**
- `deckId` (string) - Deck identifier
- `time` (number) - Target position in seconds

```javascript
// Jump to 1 minute
audioSync.seek('a', 60);
```

#### `getCurrentTime(deckId)`

Gets current playback position.

**Parameters:**
- `deckId` (string) - Deck identifier

**Returns:** `number` - Current time in seconds

```javascript
const position = audioSync.getCurrentTime('a');
console.log(`Current position: ${position.toFixed(2)}s`);
```

---

### Audio Control

#### `setVolume(deckId, volume)`

Sets deck volume.

**Parameters:**
- `deckId` (string) - Deck identifier
- `volume` (number) - Volume level (0-1)

```javascript
// Set to 80%
audioSync.setVolume('a', 0.8);
```

#### `setMasterVolume(volume)`

Sets master output volume.

**Parameters:**
- `volume` (number) - Volume level (0-1)

```javascript
audioSync.setMasterVolume(0.9);
```

#### `setEQ(deckId, band, gain)`

Adjusts EQ filter for a deck.

**Parameters:**
- `deckId` (string) - Deck identifier
- `band` (string) - Filter band: 'high', 'mid', or 'low'
- `gain` (number) - Gain in dB (-40 to +40)

```javascript
// Boost high frequencies by 6dB
audioSync.setEQ('a', 'high', 6);

// Cut mid frequencies by 12dB
audioSync.setEQ('a', 'mid', -12);

// Reset low frequencies
audioSync.setEQ('a', 'low', 0);
```

**EQ Filter Specifications:**
- **High Shelf:** 3000 Hz
- **Mid Peaking:** 1000 Hz (Q = 1)
- **Low Shelf:** 320 Hz

#### `setPlaybackRate(deckId, rate)`

Adjusts playback speed/tempo.

**Parameters:**
- `deckId` (string) - Deck identifier
- `rate` (number) - Playback rate (0.5 to 2.0)

```javascript
// Play at 110% speed
audioSync.setPlaybackRate('a', 1.1);

// Play at 95% speed
audioSync.setPlaybackRate('b', 0.95);
```

---

### Synchronization

#### `syncDecks(masterDeckId, slaveDeckId)`

Synchronizes two decks by matching their BPMs.

**Parameters:**
- `masterDeckId` (string) - Master deck identifier
- `slaveDeckId` (string) - Slave deck identifier (will be adjusted)

**Returns:** `Object` - Sync result

```javascript
const result = audioSync.syncDecks('a', 'b');

console.log(result);
// {
//     success: true,
//     masterBPM: 128,
//     slaveBPM: 124,
//     playbackRate: 1.032
// }
```

**How it works:**
1. Reads BPM from both decks
2. Calculates playback rate adjustment: `masterBPM / slaveBPM`
3. Applies rate to slave deck
4. Triggers `onSyncUpdate` callback

---

### Microphone / External Input

#### `enableInput()`

Enables microphone input with live monitoring.

**Returns:** `Promise<boolean>` - Success status

```javascript
const enabled = await audioSync.enableInput();
if (enabled) {
    console.log('Microphone active');
}
```

**Audio Settings:**
- Echo cancellation: OFF
- Noise suppression: OFF
- Auto gain control: OFF
- Default volume: 0.3 (30%)

#### `disableInput()`

Disables microphone input and stops the stream.

```javascript
audioSync.disableInput();
```

#### `setMicVolume(volume)`

Sets microphone input volume.

**Parameters:**
- `volume` (number) - Volume level (0-1)

```javascript
audioSync.setMicVolume(0.5);
```

---

### Analysis & Visualization

#### `getAnalyser(id)`

Gets the analyser node for a deck or microphone.

**Parameters:**
- `id` (string) - Deck ID or 'mic'

**Returns:** `AnalyserNode|null`

```javascript
const analyser = audioSync.getAnalyser('a');
analyser.fftSize = 4096;
```

#### `getFrequencyData(id)`

Gets frequency spectrum data for visualization.

**Parameters:**
- `id` (string) - Deck ID or 'mic'

**Returns:** `Uint8Array|null` - Frequency data (0-255)

```javascript
const frequencies = audioSync.getFrequencyData('a');

// Draw spectrum
const canvas = document.getElementById('spectrum');
const ctx = canvas.getContext('2d');
const barWidth = canvas.width / frequencies.length;

for (let i = 0; i < frequencies.length; i++) {
    const barHeight = (frequencies[i] / 255) * canvas.height;
    ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
}
```

#### `getTimeDomainData(id)`

Gets waveform data for visualization.

**Parameters:**
- `id` (string) - Deck ID or 'mic'

**Returns:** `Uint8Array|null` - Time domain data (0-255)

```javascript
const waveform = audioSync.getTimeDomainData('a');

// Draw waveform
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
const sliceWidth = canvas.width / waveform.length;

ctx.beginPath();
let x = 0;

for (let i = 0; i < waveform.length; i++) {
    const v = waveform[i] / 128.0;
    const y = (v * canvas.height) / 2;

    if (i === 0) {
        ctx.moveTo(x, y);
    } else {
        ctx.lineTo(x, y);
    }

    x += sliceWidth;
}

ctx.stroke();
```

#### `detectBPM(buffer)`

Detects BPM from an audio buffer using peak detection.

**Parameters:**
- `buffer` (AudioBuffer) - Audio buffer to analyze

**Returns:** `Promise<number>` - Detected BPM (60-200)

```javascript
const bpm = await audioSync.detectBPM(audioBuffer);
console.log(`Detected BPM: ${bpm}`);
```

**Algorithm:**
1. Low-pass filter at 200 Hz (isolate bass/kick)
2. Peak detection with adaptive threshold
3. Calculate intervals between peaks
4. Median interval → BPM conversion
5. Clamp to 60-200 BPM range

---

### P2P Audio Streaming

#### `getP2PAudioStream()`

Gets the master audio stream for P2P transmission.

**Returns:** `MediaStream|null`

```javascript
const stream = audioSync.getP2PAudioStream();

// Send via WebRTC
peerConnection.addTrack(stream.getAudioTracks()[0], stream);
```

#### `connectRemoteAudio(stream)`

Connects incoming P2P audio stream from remote DJ.

**Parameters:**
- `stream` (MediaStream) - Remote audio stream

```javascript
// Receive from WebRTC
peerConnection.ontrack = (event) => {
    audioSync.connectRemoteAudio(event.streams[0]);
};
```

#### `disconnectRemoteAudio()`

Disconnects remote P2P audio.

```javascript
audioSync.disconnectRemoteAudio();
```

---

### Callbacks

Set callback functions to receive notifications:

```javascript
// BPM detected
audioSync.onBPMDetected = (deckId, bpm, buffer) => {
    console.log(`Deck ${deckId}: ${bpm} BPM`);
};

// Audio system ready
audioSync.onAudioReady = (ready) => {
    console.log('Audio ready:', ready);
};

// Sync update
audioSync.onSyncUpdate = (syncData) => {
    console.log('Sync:', syncData);
};

// Error handling
audioSync.onError = (message, error) => {
    console.error(`Error: ${message}`, error);
};
```

---

### Cleanup

#### `destroy()`

Cleans up and destroys the audio context.

```javascript
audioSync.destroy();
```

**Cleanup actions:**
- Stops all decks
- Disables microphone
- Disconnects remote audio
- Closes audio context
- Clears all internal maps

---

## Examples

### Example 1: Basic DJ Setup

```javascript
import { AudioSync } from './modules/audioSync.js';

const audioSync = new AudioSync();

async function setupDJ() {
    // Initialize
    await audioSync.initialize();

    // Create two decks
    audioSync.createDeck('a');
    audioSync.createDeck('b');

    // Load tracks
    const fileA = document.getElementById('file-a').files[0];
    const fileB = document.getElementById('file-b').files[0];

    await audioSync.loadAudioFile('a', fileA);
    await audioSync.loadAudioFile('b', fileB);

    // Start playing
    audioSync.play('a');
    audioSync.setVolume('a', 0.8);

    // Sync deck B to deck A
    audioSync.syncDecks('a', 'b');

    // Play deck B
    audioSync.play('b');
    audioSync.setVolume('b', 0);

    // Fade in deck B over 8 bars
    setTimeout(() => {
        audioSync.setVolume('b', 0.8);
    }, 8000);
}

setupDJ();
```

### Example 2: Live Microphone with Effects

```javascript
async function setupLiveMic() {
    await audioSync.initialize();

    // Enable microphone
    await audioSync.enableInput();

    // Set volume
    audioSync.setMicVolume(0.7);

    // Visualize input
    const drawMicSpectrum = () => {
        const frequencies = audioSync.getFrequencyData('mic');
        // ... draw visualization
        requestAnimationFrame(drawMicSpectrum);
    };

    drawMicSpectrum();
}
```

### Example 3: P2P DJ Collaboration

```javascript
// DJ A - Send audio
const localStream = audioSync.getP2PAudioStream();
peerConnection.addTrack(localStream.getAudioTracks()[0], localStream);

// DJ B - Receive audio
peerConnection.ontrack = (event) => {
    audioSync.connectRemoteAudio(event.streams[0]);
    console.log('Connected to remote DJ!');
};
```

### Example 4: Auto-Sync and Mix

```javascript
audioSync.onBPMDetected = async (deckId, bpm) => {
    console.log(`Deck ${deckId}: ${bpm} BPM detected`);

    // Auto-sync when both tracks loaded
    if (audioSync.decks.get('a')?.bpm && audioSync.decks.get('b')?.bpm) {
        const result = audioSync.syncDecks('a', 'b');

        if (result.success) {
            console.log('Decks synced! Ready to mix.');
        }
    }
};
```

---

## Architecture

### Audio Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEURALMIX AUDIO GRAPH                    │
└─────────────────────────────────────────────────────────────────┘

DECK A:
[Audio File] → [Buffer Source] → [Low EQ] → [Mid EQ] → [High EQ]
                                    ↓
                              [Gain Node] → [Analyser]
                                    ↓
                              [Compressor]

DECK B: (same chain)

MICROPHONE:
[Mic Input] → [Gain Node] → [Analyser] → [Compressor]

REMOTE P2P:
[Remote Stream] → [Gain Node] → [Compressor]

MASTER:
[Compressor] → [Master Gain] ┬→ [Speakers]
                              └→ [P2P Stream Destination]
```

### Class Structure

```javascript
AudioSync {
    // Core
    audioContext: AudioContext
    masterGain: GainNode
    compressor: DynamicsCompressorNode

    // Decks
    decks: Map<string, DeckObject>
    analysers: Map<string, AnalyserNode>

    // Microphone
    micStream: MediaStream
    micSource: MediaStreamSourceNode
    micGain: GainNode

    // P2P
    p2pAudioDestination: MediaStreamDestinationNode
    p2pAudioStream: MediaStream
    remoteAudioSource: MediaStreamSourceNode

    // State
    syncState: {
        masterDeck: string
        syncEnabled: boolean
        bpmOffset: number
    }
}
```

---

## Best Practices

1. **Always initialize first:**
   ```javascript
   await audioSync.initialize();
   ```

2. **Handle errors:**
   ```javascript
   audioSync.onError = (msg, err) => {
       console.error(msg, err);
       // Show user notification
   };
   ```

3. **Resume audio context on user interaction:**
   ```javascript
   button.addEventListener('click', async () => {
       if (audioSync.audioContext.state === 'suspended') {
           await audioSync.audioContext.resume();
       }
   });
   ```

4. **Clean up when done:**
   ```javascript
   window.addEventListener('beforeunload', () => {
       audioSync.destroy();
   });
   ```

5. **Check deck state before operations:**
   ```javascript
   const deck = audioSync.decks.get('a');
   if (deck && deck.buffer) {
       audioSync.play('a');
   }
   ```

---

## Browser Compatibility

- ✅ Chrome 34+
- ✅ Firefox 25+
- ✅ Safari 14.1+
- ✅ Edge 79+

**Required APIs:**
- Web Audio API
- MediaDevices API (for microphone)
- MediaStream API (for P2P)

---

## License

MIT License - NeuralMix P2P Enhanced
Author: Serigne Diagne
