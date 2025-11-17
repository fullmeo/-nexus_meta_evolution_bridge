# NeuralMix P2P - Analog Hardware Integration Guide

## Overview

NeuralMix P2P now supports **plug-and-play integration with analog DJ hardware**, including:

- 🎵 **Turntables** (Technics 1200, Audio-Technica, etc.)
- 💿 **CDJs** (Pioneer CDJ series, Denon, etc.)
- 🎛️ **DJ Controllers** (Pioneer DDJ, Numark Mixtrack, Traktor Kontrol)
- 🔊 **Audio Interfaces** (Focusrite, Native Instruments, Behringer, etc.)
- 📀 **DVS (Digital Vinyl System)** - Control digital files with vinyl/CDs
- 🎹 **MIDI Controllers** - Full MIDI mapping support

## Table of Contents

- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [Turntable Setup](#turntable-setup)
- [CDJ Setup](#cdj-setup)
- [DJ Controller Setup](#dj-controller-setup)
- [Audio Interface Configuration](#audio-interface-configuration)
- [DVS (Digital Vinyl System)](#dvs-digital-vinyl-system)
- [MIDI Mapping](#midi-mapping)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Quick Start

### Simplest Setup (Audio Input Only):

1. Connect turntable/CDJ to audio interface
2. Connect audio interface to computer via USB
3. In NeuralMix: Click "🔄" to refresh devices
4. Select your audio device from dropdown
5. Select target deck (A, B, or External)
6. Click "🔌 Connect"
7. **Done!** Play your hardware through Neural Mix

### With DVS (Digital Vinyl Control):

1-5. Same as above
6. Check "Enable DVS" checkbox
7. Select timecode type (Serato, Traktor, or Rekordbox)
8. Click "🔌 Connect"
9. Load an audio file in NeuralMix
10. Play timecode vinyl/CD
11. **Control digital files with vinyl!**

---

## Requirements

### Hardware:

**Minimum:**
- Any turntable or CDJ with line output
- Audio interface with at least 1 input
- USB cable
- Audio cables (RCA/XLR)

**Recommended for DVS:**
- Low-latency audio interface (<10ms)
- Timecode vinyl or CDs
- Quality needles (for vinyl)
- Dual-channel audio interface

**Supported Audio Interfaces:**
- ✅ Native Instruments Traktor Audio 2/6/10
- ✅ Focusrite Scarlett series (2i2, 4i4, 18i20)
- ✅ Behringer U-Phoria UMC series
- ✅ PreSonus AudioBox
- ✅ M-Audio M-Track
- ✅ Roland Rubix
- ✅ MOTU M2/M4
- ✅ Any class-compliant USB audio interface

### Software:

- Modern web browser (Chrome/Edge recommended)
- Web server (for local development)
- Audio interface drivers (if required)

---

## Turntable Setup

### Standard Audio Mode

Play turntable audio directly through NeuralMix mixer.

#### Equipment Needed:
- Turntable with line output
- Audio interface
- RCA cables
- Phono preamp (if not built into turntable/interface)

#### Connection Steps:

```
Turntable → Phono Preamp → Audio Interface → Computer → NeuralMix
```

1. **Connect Turntable to Preamp**
   - If turntable has built-in preamp: Skip this step
   - If using external preamp: Connect turntable RCA outputs to preamp inputs
   - Set turntable to "PHONO" mode if available

2. **Connect to Audio Interface**
   - Connect preamp outputs to interface LINE inputs (usually inputs 1-2)
   - If using interface with phono inputs: Connect directly to phono inputs

3. **Configure Audio Interface**
   - Set input gain to appropriate level
   - Enable phantom power if needed (usually not for line input)
   - Check that input monitoring is off (to avoid feedback)

4. **Configure NeuralMix**
   - Click "🔄 Refresh" to detect devices
   - Select your audio interface
   - Choose deck to route audio to (A, B, Ext1, Ext2)
   - Select "Stereo (2)" channels
   - Click "🔌 Connect"

5. **Test**
   - Play a record
   - Check input level meter (should peak around -6dB)
   - Adjust interface gain if needed
   - Use NeuralMix mixer controls for EQ and volume

#### Signal Chain in NeuralMix:

```
Hardware Input → Gain Control → Analyser → EQ (Low/Mid/High)
→ Deck Volume → Crossfader → Effects → Master → Output
```

---

### DVS Mode (Digital Vinyl System)

Control digital audio files using traditional vinyl turntables.

#### Additional Equipment:
- DVS timecode vinyl (Serato CV02, Traktor Scratch, or Rekordbox)
- Low-latency audio interface
- Quality turntable with accurate speed control
- Fresh needles

#### Supported Timecode Systems:

| System | Type | Notes |
|--------|------|-------|
| **Serato CV02** | Most common | 1000Hz/1500Hz stereo tones |
| **Traktor Scratch** | Native Instruments | 2000Hz/2500Hz stereo tones |
| **Rekordbox DVS** | Pioneer | 1800Hz/2200Hz stereo tones |

#### Setup Steps:

1. **Connect Hardware** (same as audio mode)

2. **Place Timecode Vinyl**
   - Clean vinyl before use
   - Calibrate tonearm weight (usually 3-5g)
   - Set anti-skate properly
   - Ensure needle is clean and in good condition

3. **Configure NeuralMix**
   - Follow audio mode steps 1-4
   - ✅ **Check "Enable DVS"**
   - Select timecode type (must match your vinyl!)
   - Click "🔌 Connect"

4. **Load Digital Track**
   - Load audio file in NeuralMix deck
   - Track will be controlled by vinyl

5. **Calibrate (if needed)**
   - Play timecode vinyl
   - Check DVS quality indicator (should be >70%)
   - Adjust needle weight if quality is low
   - Clean vinyl if quality is inconsistent

6. **Start DJing!**
   - Play, scratch, and mix using vinyl
   - Digital file follows vinyl movement
   - Use NeuralMix for EQ, effects, and recording

#### DVS Tips:

**For Best Performance:**
- Use "Interactive" latency mode (10ms)
- Close unnecessary applications
- Use wired (not wireless) USB connection
- Keep timecode vinyl clean
- Use quality needles (Ortofon Concorde, Shure M44-7)
- Ensure stable turntable (no vibrations)

**Latency Settings:**
- **Interactive (10ms)**: Best for DVS, very responsive
- **Balanced (50ms)**: Good for audio passthrough
- **Playback (100ms)**: Most stable, higher latency

**Signal Quality:**
- Good: 80-100% (perfect tracking)
- Acceptable: 60-79% (usable but may skip)
- Poor: <60% (clean vinyl, check needle)

---

## CDJ Setup

### Standard Audio Mode

Use CDJ audio output through NeuralMix mixer.

#### Equipment Needed:
- CDJ (Pioneer, Denon, etc.)
- Audio interface
- RCA or XLR cables

#### Connection:

```
CDJ Line Out → Audio Interface Input → Computer → NeuralMix
```

1. **Configure CDJ**
   - Set output level to LINE (not PHONO)
   - Set master tempo ON for pitch control
   - Disable internal effects (use NeuralMix effects)

2. **Connect Cables**
   - RCA: Red/White to interface inputs 1/2
   - XLR: Use balanced cables for longer runs

3. **Configure NeuralMix** (same as turntable audio mode)

4. **Play**
   - CDJ audio routed through NeuralMix
   - Use NeuralMix for EQ, crossfader, effects

---

### DVS Mode with CDJ

Control digital files using timecode CDs.

#### Additional Equipment:
- DVS timecode CDs (Serato, Traktor, or Rekordbox)
- CDJ with CD playback

#### Setup:

1. Insert timecode CD in CDJ
2. Follow DVS setup steps (same as turntable)
3. Select appropriate timecode type
4. Control digital files with CDJ jog wheel and pitch fader

#### Notes:
- Most professional CDJs support timecode CDs
- Use original timecode CDs for best results
- CDJ-2000NXS2 and newer have built-in Rekordbox DVS

---

## DJ Controller Setup

### MIDI Controller Integration

Control NeuralMix with hardware controllers via MIDI.

#### Supported Controllers:
- ✅ Pioneer DDJ-400
- ✅ Pioneer DDJ-SB series
- ✅ Pioneer DDJ-RB
- ✅ Numark Mixtrack Pro series
- ✅ Traktor Kontrol S2/S4
- ✅ Denon MC series
- ✅ Any MIDI-compatible controller

#### Auto-Detection:

1. **Connect Controller**
   - Plug controller into USB port
   - Wait for driver installation (if needed)
   - No additional setup required for class-compliant devices

2. **Verify Connection**
   - In NeuralMix, check "MIDI Controller" section
   - Controller should appear in "Detected Controllers" dropdown
   - Status will show connection

3. **Load Preset Mapping**
   - Select your controller model from "Controller Preset"
   - Click "📥 Load Preset"
   - Mappings are automatically configured!

#### Supported MIDI Messages:
- **Note On/Off**: Buttons, pads
- **Control Change (CC)**: Knobs, faders, encoders
- **Pitch Bend**: Jog wheels, pitch faders

#### Default Mappings (Pioneer DDJ-400):

| Control | MIDI CC | Function |
|---------|---------|----------|
| Play Deck A | Note 11 | Play/Pause Deck A |
| Play Deck B | Note 43 | Play/Pause Deck B |
| Volume A | CC 13 | Deck A Volume |
| Volume B | CC 45 | Deck B Volume |
| EQ High A | CC 16 | Deck A High EQ |
| EQ Mid A | CC 17 | Deck A Mid EQ |
| EQ Low A | CC 18 | Deck A Low EQ |
| EQ High B | CC 48 | Deck B High EQ |
| EQ Mid B | CC 49 | Deck B Mid EQ |
| EQ Low B | CC 50 | Deck B Low EQ |
| Crossfader | CC 8 | Crossfader Position |

---

### MIDI Learn (Custom Mapping)

Create custom MIDI mappings for any controller.

#### Steps:

1. **Enter MIDI Learn Mode**
   - Click "🎓 MIDI Learn" button
   - Status indicator shows "MIDI Learn Active"

2. **Map a Control**
   - Click NeuralMix control you want to map (volume, EQ, etc.)
   - Move/press your controller knob/button
   - Mapping is created automatically

3. **Test Mapping**
   - Move controller
   - NeuralMix control should respond
   - Fine-tune if needed

4. **Save**
   - Mappings are saved in browser storage
   - Persist across sessions

#### Mappable Functions:
- ✅ Play/Pause
- ✅ Cue Points
- ✅ Volume (deck and master)
- ✅ EQ (3-band)
- ✅ Crossfader
- ✅ Effects on/off
- ✅ Pitch/Tempo
- ✅ Loop controls
- ✅ Hot cues

---

## Audio Interface Configuration

### Recommended Settings

#### Sample Rate:
- **48kHz**: Recommended (industry standard)
- **44.1kHz**: Acceptable (CD quality)
- Higher rates increase latency

#### Buffer Size:
- **64 samples**: DVS, lowest latency (~1.5ms @ 48kHz)
- **128 samples**: Good balance (~3ms @ 48kHz)
- **256 samples**: Stable, higher latency (~5ms @ 48kHz)
- **512+ samples**: Avoid for real-time use

#### Latency Modes:
| Mode | Latency | Best For |
|------|---------|----------|
| Interactive | ~10ms | DVS, live performance |
| Balanced | ~50ms | Audio mixing |
| Playback | ~100ms | Recording, stability |

### Multi-Channel Setup

For multiple turntables/CDJs:

```
Deck A (Turntable 1) → Interface Input 1-2 → NeuralMix Deck A
Deck B (Turntable 2) → Interface Input 3-4 → NeuralMix Deck B
```

1. Connect first deck to inputs 1-2
2. In NeuralMix: Route to Deck A
3. Connect second deck to inputs 3-4
4. In NeuralMix: Route to Deck B (requires second connection)

---

## DVS (Digital Vinyl System)

### How DVS Works

DVS uses **timecode signals** encoded on vinyl or CDs:

1. Timecode vinyl plays specific audio tones
2. Audio interface captures the tones
3. NeuralMix decodes position, speed, direction
4. Digital file playback follows vinyl movement

### Timecode Specifications

**Serato CV02:**
- Left channel: 1000 Hz
- Right channel: 1500 Hz
- Most widely compatible

**Traktor Scratch:**
- Left channel: 2000 Hz
- Right channel: 2500 Hz
- Native Instruments standard

**Rekordbox DVS:**
- Left channel: 1800 Hz
- Right channel: 2200 Hz
- Pioneer standard

### DVS Signal Path

```
Vinyl Movement → Turntable → Timecode Signal → Audio Interface
→ Timecode Detection → Position/Speed/Direction → Digital Playback
```

### Quality Factors

**Signal Quality Depends On:**
1. Vinyl cleanliness (most important!)
2. Needle condition
3. Tonearm calibration
4. Audio interface quality
5. USB connection stability
6. System CPU load

**Optimal Conditions:**
- ✅ Clean timecode vinyl
- ✅ Fresh needle
- ✅ Proper tonearm weight (3-5g)
- ✅ Low-latency audio interface
- ✅ Dedicated USB port
- ✅ Minimal CPU load
- ✅ Stable surface (no vibrations)

---

## MIDI Mapping

### MIDI Message Types

**Note On (0x90):**
- Buttons, pads
- Velocity: 0-127
- Use for: Play, Cue, Hot Cues

**Note Off (0x80):**
- Button release
- Usually not needed for DJ functions

**Control Change (0xB0):**
- Knobs, faders, encoders
- Value: 0-127
- Use for: Volume, EQ, Effects, Crossfader

**Pitch Bend (0xE0):**
- Pitch fader, jog wheel
- 14-bit resolution
- Use for: Precise tempo control

### Creating Mappings

#### Via API:

```javascript
// Add MIDI mapping
app.analogDeck.addMIDIMapping({
    inputId: 'midi-device-id',
    note: 11,  // MIDI note/CC number
    action: 'play',  // Action to perform
    deckId: 'a'  // Target deck
});

// Supported actions:
// - play, pause, cue
// - volume, pitch
// - eq (with parameter: 'high', 'mid', 'low')
// - crossfader
// - hotcue
```

#### Via UI:

1. Select controller from dropdown
2. Load preset or create custom
3. Test mappings
4. Fine-tune as needed

---

## Troubleshooting

### No Audio From Hardware

**Problem:** Hardware connected but no sound

**Solutions:**
1. ✅ Check physical connections (cables plugged in)
2. ✅ Verify audio interface is powered on
3. ✅ Select correct input in NeuralMix
4. ✅ Check input level meter (should show activity)
5. ✅ Adjust interface input gain
6. ✅ Verify deck volume is up
7. ✅ Check crossfader position
8. ✅ Ensure master volume is up

### Low DVS Quality

**Problem:** DVS quality below 60%

**Solutions:**
1. 🧹 **Clean timecode vinyl** (most common cause)
2. 🎯 **Check needle condition** (replace if worn)
3. ⚖️ **Calibrate tonearm weight** (3-5g typical)
4. 🔌 **Use different USB port** (avoid hubs)
5. 💻 **Close other applications** (reduce CPU load)
6. 🎛️ **Switch to "Interactive" latency mode**
7. 📀 **Try different timecode type** (Serato most reliable)

### DVS Drift/Skipping

**Problem:** Digital file doesn't stay in sync with vinyl

**Solutions:**
1. Clean vinyl thoroughly
2. Check turntable speed (33⅓ or 45 RPM accurate?)
3. Ensure stable surface (no vibrations)
4. Use quality turntable with quartz lock
5. Replace needle
6. Check USB cable quality

### MIDI Controller Not Detected

**Problem:** Controller doesn't appear in list

**Solutions:**
1. ✅ Reconnect USB cable
2. ✅ Try different USB port
3. ✅ Install manufacturer drivers (if required)
4. ✅ Check controller is MIDI-compatible
5. ✅ Click "🔄 Refresh" in NeuralMix
6. ✅ Restart browser
7. ✅ Check browser MIDI permissions

### High Latency

**Problem:** Noticeable delay between action and sound

**Solutions:**
1. ⚡ Switch to "Interactive" latency mode
2. ⚡ Reduce audio interface buffer size
3. ⚡ Close unnecessary applications
4. ⚡ Use wired (not wireless) connection
5. ⚡ Disable browser extensions
6. ⚡ Update audio interface drivers

### Crackling/Distorted Audio

**Problem:** Audio has clicks, pops, or distortion

**Solutions:**
1. 🔊 Reduce input gain (may be clipping)
2. 🔊 Check input level meter (should peak at -6dB)
3. 🔊 Increase buffer size (trade latency for stability)
4. 🔊 Close other applications
5. 🔊 Check USB power (use powered hub if needed)
6. 🔊 Update audio interface firmware

---

## API Reference

### AnalogDeck Class

```javascript
import { AnalogDeck } from './modules/analogDeck.js';

const analogDeck = new AnalogDeck(audioSync);
await analogDeck.initialize();
```

#### Methods:

**Audio Input:**
```javascript
// Get available devices
const devices = await analogDeck.getAvailableInputDevices();

// Connect audio interface
const metadata = await analogDeck.connectAudioInterface(deckId, {
    deviceId: 'audio-device-id',
    channelCount: 2,  // 1=mono, 2=stereo
    dvsEnabled: false
});

// Disconnect
analogDeck.disconnectAudioInterface(deckId);

// Set input volume
analogDeck.setInputVolume(deckId, 0.8);  // 0-1

// Get input volume
const volume = analogDeck.getInputVolume(deckId);
```

**DVS:**
```javascript
// Enable DVS
await analogDeck.enableDVS(deckId, 'serato');  // 'serato', 'traktor', 'rekordbox'

// Disable DVS
analogDeck.disableDVS(deckId);
```

**MIDI:**
```javascript
// Add MIDI mapping
analogDeck.addMIDIMapping({
    inputId: 'midi-id',
    note: 11,
    action: 'play',
    deckId: 'a',
    parameter: 'high'  // for EQ
});

// Remove mapping
analogDeck.removeMIDIMapping(inputId, note);

// Load controller preset
analogDeck.loadControllerMapping('pioneer-ddj-400');

// Get status
const status = analogDeck.getStatus();
```

#### Callbacks:

```javascript
// Input ready
analogDeck.onInputReady = (metadata) => {
    console.log('Input connected:', metadata);
};

// Input error
analogDeck.onInputError = (message, error) => {
    console.error('Error:', message, error);
};

// Timecode detected
analogDeck.onTimecodeDetected = (timecodeData) => {
    console.log('DVS:', timecodeData.speed, timecodeData.direction);
};

// MIDI message
analogDeck.onMIDIMessage = (midiEvent) => {
    console.log('MIDI:', midiEvent.command, midiEvent.note, midiEvent.value);
};

// Level update
analogDeck.onLevelUpdate = (levelData) => {
    console.log('Level:', levelData.level, 'dB:', levelData.peak);
};
```

---

## Best Practices

### For Live Performance:

1. **Test Before the Gig**
   - Connect all hardware
   - Test DVS quality
   - Verify MIDI mappings
   - Check latency settings

2. **Optimize System**
   - Close unnecessary apps
   - Disable Wi-Fi (use Ethernet)
   - Use "Interactive" latency
   - Keep laptop plugged in

3. **Backup Plan**
   - Have spare needles
   - Carry backup timecode vinyl
   - Keep USB cables handy
   - Test all connections

### For Studio/Production:

1. **Quality Over Speed**
   - Use "Balanced" latency
   - Higher buffer sizes OK
   - Focus on audio quality

2. **Recording**
   - Monitor input levels
   - Peak around -6dB
   - Use NeuralMix recording feature

### For DVS:

1. **Maintenance**
   - Clean vinyl before every session
   - Replace needles regularly (50-100 hours)
   - Calibrate tonearm monthly
   - Keep backup vinyl

2. **Settings**
   - Always use "Interactive" latency
   - 48kHz sample rate
   - Lowest stable buffer size
   - Disable power saving

---

## Hardware Compatibility Matrix

| Device Type | Audio Mode | DVS Mode | MIDI Control |
|-------------|------------|----------|--------------|
| Turntables | ✅ | ✅ | ❌ |
| CDJs | ✅ | ✅ | ⚠️ Some models |
| DJ Controllers | ⚠️ Audio in | ❌ | ✅ |
| Audio Interfaces | ✅ | ✅ | ❌ |
| MIDI Controllers | ❌ | ❌ | ✅ |
| Hybrid Controllers | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Fully supported
- ⚠️ Partially supported
- ❌ Not applicable

---

## Glossary

**DVS**: Digital Vinyl System - Control digital files with vinyl
**Timecode**: Special audio signal on vinyl/CD for position tracking
**Latency**: Delay between action and sound (lower is better)
**Buffer**: Audio processing chunk size (affects latency)
**MIDI**: Musical Instrument Digital Interface (controller protocol)
**CC**: Control Change (MIDI message type)
**Audio Interface**: External sound card for audio input/output
**Phono Preamp**: Amplifier for turntable's low-level signal
**Sample Rate**: Audio quality (48kHz standard)
**Bit Depth**: Audio dynamic range (16-bit minimum)

---

## Support

For issues or questions:
- Check browser console for errors
- Verify hardware connections
- Test with different USB ports
- Update audio interface drivers
- Check NeuralMix logs

---

## License

Part of NeuralMix P2P Enhanced platform.

**Author**: Serigne Diagne
**Version**: 11.3.0
**Last Updated**: 2025

---

## Related Documentation

- [AudioSync API Documentation](./audioSync-API.md)
- [Streaming Guide](./STREAMING.md)
- [Integration Guide](../INTEGRATION.md)
