# NeuralMix P2P - Video & Audio Streaming Guide

## Overview

The NeuralMix P2P platform now supports comprehensive video and audio streaming capabilities, allowing you to:

1. **Input Sources**: Use YouTube and Twitch videos/streams as audio sources for your DJ decks
2. **Output Streaming**: Stream your DJ mix live to platforms like YouTube Live, Twitch, and Facebook Live

## Table of Contents

- [Input Streaming](#input-streaming)
  - [YouTube Integration](#youtube-integration)
  - [Twitch Integration](#twitch-integration)
- [Output Streaming](#output-streaming)
  - [Browser-Based Recording](#browser-based-recording)
  - [Professional Live Streaming](#professional-live-streaming)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Input Streaming

### YouTube Integration

Load audio from YouTube videos directly into your DJ decks.

#### How to Use:

1. **Get YouTube URL or Video ID**
   - Full URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Short URL: `https://youtu.be/dQw4w9WgXcQ`
   - Video ID only: `dQw4w9WgXcQ`

2. **Load into Deck**
   - Enter the YouTube URL in the "YouTube Input" field
   - Select which deck (A or B) to load it into
   - Click "▶ Load" button
   - Wait for the video to load

3. **Control Playback**
   - **▶ Play**: Start YouTube playback
   - **⏸ Pause**: Pause playback
   - **⏹ Stop**: Stop and reset playback

#### Features:

- ✅ Automatic audio extraction
- ✅ Integrates with deck audio chain (EQ, effects, volume)
- ✅ Real-time playback control
- ✅ Synchronized with deck mixer
- ⚠️ Subject to browser CORS restrictions

#### Example:

```javascript
// Load YouTube video
await app.loadYouTube();

// Control playback
app.controlYouTube('play');
app.controlYouTube('pause');
app.controlYouTube('stop');

// Access via streamingService
app.streamingService.seekYouTube(30); // Seek to 30 seconds
app.streamingService.setYouTubeVolume(80); // Set volume to 80%
```

---

### Twitch Integration

Load live Twitch streams as audio sources for DJ mixing.

#### How to Use:

1. **Get Twitch Channel**
   - Full URL: `https://www.twitch.tv/channelname`
   - Channel name only: `channelname`

2. **Load into Deck**
   - Enter the Twitch URL in the "Twitch Input" field
   - Select which deck (A or B) to load it into
   - Click "▶ Load" button
   - Wait for the stream to connect

3. **Control Playback**
   - **▶ Play**: Start stream playback
   - **⏸ Pause**: Pause playback

#### Features:

- ✅ Live stream audio capture
- ✅ Real-time mixing with DJ decks
- ✅ Full EQ and effects support
- ✅ Low latency playback
- ⚠️ Requires Twitch Embed API

#### Example:

```javascript
// Load Twitch stream
await app.loadTwitch();

// Control playback
app.controlTwitch('play');
app.controlTwitch('pause');
```

---

## Output Streaming

### Browser-Based Recording

The simplest way to record your DJ mix for later upload to streaming platforms.

#### How to Use:

1. **Select Platform**
   - Choose from: YouTube Live, Twitch, Facebook Live, or Custom RTMP

2. **Enter Stream Key** (optional for recording)
   - Get your stream key from the platform dashboard
   - For browser recording, this is stored but not used

3. **Start Recording**
   - Click "🔴 Start Stream" button
   - Your mix will be recorded in the browser
   - Recording indicator will appear

4. **Stop and Download**
   - Click "⏹ Stop Stream" button
   - Recording will automatically download as `.webm` file

#### Features:

- ✅ No server required
- ✅ Works entirely in browser
- ✅ High quality audio recording (128kbps)
- ✅ Automatic download on stop
- ❌ Not true live streaming
- ❌ Cannot go live to platforms directly

---

### Professional Live Streaming

For true live streaming to YouTube, Twitch, Facebook, etc., you need streaming software.

#### Recommended Software:

1. **OBS Studio** (Free, Open Source)
   - [Download OBS](https://obsproject.com/)
   - Most popular and feature-rich
   - Cross-platform (Windows, Mac, Linux)

2. **Streamlabs OBS** (Free)
   - [Download Streamlabs](https://streamlabs.com/)
   - User-friendly interface
   - Built-in widgets and alerts

3. **Restream.io** (Paid)
   - [Restream.io](https://restream.io/)
   - Stream to multiple platforms simultaneously

#### Setup Guide - OBS + NeuralMix:

##### Step 1: Get Your Stream Key

**YouTube Live:**
1. Go to [YouTube Studio](https://studio.youtube.com/)
2. Click "Go Live" (top right)
3. Select "Stream" tab
4. Copy your "Stream key"
5. Copy "Stream URL" (usually `rtmp://a.rtmp.youtube.com/live2`)

**Twitch:**
1. Go to [Twitch Dashboard](https://dashboard.twitch.tv/)
2. Click "Settings" → "Stream"
3. Copy your "Primary Stream key"
4. Server URL: `rtmp://live.twitch.tv/app`

**Facebook Live:**
1. Go to [Facebook Live Producer](https://www.facebook.com/live/producer)
2. Copy "Stream Key"
3. Server URL: `rtmps://live-api-s.facebook.com:443/rtmp`

##### Step 2: Configure OBS

1. **Open OBS Studio**

2. **Add Audio Source**
   - In "Sources" panel, click "+"
   - Select "Audio Output Capture"
   - Name it "NeuralMix Audio"
   - Select your system audio output
   - Click OK

3. **Configure Stream Settings**
   - Go to: **Settings** → **Stream**
   - **Service**: Select your platform (YouTube, Twitch, etc.)
   - **Server**: Auto-filled (or use custom RTMP URL)
   - **Stream Key**: Paste your stream key
   - Click **OK**

4. **Audio Settings (Important!)**
   - Go to: **Settings** → **Audio**
   - **Sample Rate**: 48 kHz
   - **Channels**: Stereo
   - Disable "Desktop Audio" if using Audio Output Capture
   - Click **OK**

5. **Video Settings** (Optional)
   - Go to: **Settings** → **Video**
   - **Canvas Resolution**: 1920x1080 (or your preference)
   - **Output Resolution**: 1920x1080
   - **FPS**: 30 or 60
   - Add a static image or video loop for visual content

6. **Output Settings**
   - Go to: **Settings** → **Output**
   - **Output Mode**: Advanced
   - **Encoder**: x264 or hardware encoder
   - **Audio Bitrate**: 128-320 kbps
   - Click **OK**

##### Step 3: Start Streaming

1. **In NeuralMix**:
   - Load your tracks
   - Start mixing
   - Ensure audio is playing

2. **In OBS**:
   - Click "Start Streaming" button
   - You should see "LIVE" indicator
   - Audio levels should show activity

3. **Verify Stream**:
   - Check your platform dashboard
   - View stream preview
   - Confirm audio is being received

4. **Go Live!**:
   - On YouTube: Click "Go Live" button
   - On Twitch: You're already live
   - On Facebook: Publish your stream

##### Step 4: Stop Streaming

1. **In OBS**: Click "Stop Streaming"
2. **In NeuralMix**: Stop playback if desired
3. **On Platform**: End stream from dashboard

---

## API Reference

### StreamingService Class

#### Input Methods

```javascript
// Load YouTube video
await streamingService.loadYouTubeStream(deckId, youtubeUrl)
// Returns: { platform, videoId, title, author, duration, deckId }

// Load Twitch stream
await streamingService.loadTwitchStream(deckId, twitchUrl)
// Returns: { platform, channel, deckId, isLive }

// Control YouTube
streamingService.controlYouTube(action) // action: 'play', 'pause', 'stop'
streamingService.seekYouTube(seconds)
streamingService.setYouTubeVolume(volume) // 0-100
streamingService.getYouTubeCurrentTime() // Returns current time in seconds

// Control Twitch
streamingService.controlTwitch(action) // action: 'play', 'pause'

// Stop streams
streamingService.stopStream('youtube')
streamingService.stopStream('twitch')
```

#### Output Methods

```javascript
// Initialize output stream
await streamingService.initializeOutputStream({
    platform: 'youtube', // 'youtube', 'twitch', 'facebook', 'custom'
    streamKey: 'your-stream-key',
    serverUrl: 'rtmp://custom-server/live' // optional for custom
})
// Returns: { platform, streamReady, stream, note, rtmpUrl, streamKey }

// Get RTMP URL for platform
streamingService.getRTMPUrl(platform)
// Returns: RTMP URL string

// Browser streaming
streamingService.startBrowserStream() // Returns: boolean
await streamingService.stopBrowserStream() // Returns: Blob

// Get stream stats
streamingService.getStreamStats()
// Returns: { isStreaming, platform, activeInputDeck, youtubeActive, twitchActive, outputStreamReady }
```

#### Callbacks

```javascript
// Stream ready
streamingService.onStreamReady = (metadata) => {
    console.log('Stream ready:', metadata);
};

// Stream error
streamingService.onStreamError = (message, error) => {
    console.error('Stream error:', message, error);
};

// Stream status change
streamingService.onStreamStatusChange = (status) => {
    console.log('Stream status:', status);
};
```

---

## Troubleshooting

### YouTube Not Loading

**Problem**: YouTube video fails to load or shows CORS error

**Solutions**:
1. Ensure you're running from a web server (not `file://`)
2. Check if the video is embeddable (some videos restrict embedding)
3. Try a different video
4. Check browser console for specific errors
5. Some videos may have regional restrictions

### Twitch Stream Not Working

**Problem**: Twitch stream doesn't connect

**Solutions**:
1. Verify the channel is live
2. Check channel name spelling
3. Ensure Twitch Embed API is loaded (check browser console)
4. Try refreshing the page
5. Check if the channel is set to "Mature Content" (may require auth)

### No Audio from Stream

**Problem**: Stream loads but no audio plays

**Solutions**:
1. Check deck volume slider
2. Check crossfader position
3. Verify master volume
4. Click play button on the stream controls
5. Check browser audio permissions
6. Ensure AudioContext is resumed (click any button)

### OBS Not Capturing Audio

**Problem**: OBS shows no audio levels from NeuralMix

**Solutions**:
1. **Check Audio Source**:
   - Remove existing audio source
   - Add "Audio Output Capture"
   - Select correct audio device

2. **Check NeuralMix**:
   - Ensure tracks are playing
   - Check master volume is up
   - Verify browser is not muted

3. **Check OBS Settings**:
   - Settings → Audio → Verify sample rate (48kHz)
   - Ensure audio source is not muted in mixer
   - Check audio monitoring settings

4. **Alternative Method**:
   - Use "Browser Source" in OBS
   - Point to NeuralMix URL
   - Enable "Control audio via OBS"

### Stream Quality Issues

**Problem**: Poor audio quality or lag

**Solutions**:
1. **In OBS**:
   - Increase audio bitrate (Settings → Output)
   - Use CBR (Constant Bitrate) encoding
   - Reduce video quality if needed

2. **In NeuralMix**:
   - Close other browser tabs
   - Disable visualization if lagging
   - Reduce EQ/effects processing

3. **Network**:
   - Check internet upload speed
   - Close other applications using bandwidth
   - Use wired connection instead of WiFi

### Browser Recording Not Downloading

**Problem**: "Stop Stream" doesn't trigger download

**Solutions**:
1. Check browser download permissions
2. Disable popup blocker for the site
3. Check browser downloads folder
4. Try a different browser
5. Check browser console for errors

---

## Platform-Specific Notes

### YouTube Live

- **Requirements**: 1000+ subscribers (for most accounts)
- **Latency**: 15-60 seconds typical
- **Key Location**: [YouTube Studio](https://studio.youtube.com/) → Stream → Stream Key
- **Best For**: Long-form content, music sets

### Twitch

- **Requirements**: Verified email address
- **Latency**: 2-5 seconds typical (low latency mode)
- **Key Location**: [Twitch Dashboard](https://dashboard.twitch.tv/) → Settings → Stream
- **Best For**: Interactive DJ sets, gaming music

### Facebook Live

- **Requirements**: Facebook account in good standing
- **Latency**: 5-15 seconds typical
- **Key Location**: [Facebook Live Producer](https://www.facebook.com/live/producer)
- **Best For**: Social events, private parties

---

## Best Practices

### For Input Streaming:

1. **Test Before Live**: Always test YouTube/Twitch sources before live performance
2. **Have Backups**: Keep local audio files as backup sources
3. **Check Copyright**: Ensure you have rights to stream the content
4. **Monitor Latency**: Be aware of stream delay when mixing
5. **Quality Check**: Verify audio quality before using in set

### For Output Streaming:

1. **Test Your Setup**: Do test streams before important events
2. **Check Internet**: Ensure stable upload speed (5+ Mbps recommended)
3. **Wired Connection**: Use Ethernet instead of WiFi for stability
4. **Close Other Apps**: Free up CPU and bandwidth
5. **Monitor Chat**: Keep an eye on viewer feedback
6. **Have a Backup**: Keep local recording as backup
7. **Check Platform Rules**: Ensure you follow platform streaming guidelines

---

## Advanced Tips

### Multi-Platform Streaming

Use **Restream.io** to stream to multiple platforms simultaneously:

1. Sign up at [Restream.io](https://restream.io/)
2. Connect your YouTube, Twitch, Facebook accounts
3. Get Restream RTMP URL and key
4. In OBS: Use Restream's RTMP URL and key
5. Stream once, broadcast everywhere

### Custom RTMP Server

For private streaming or recording:

1. Set up **Nginx with RTMP module**
2. Use platform: "custom"
3. Enter your server RTMP URL
4. Stream to your own server

### Audio Routing (Advanced)

For better audio capture in OBS:

1. Install **VB-CABLE** (virtual audio cable)
2. Set browser output to VB-CABLE
3. In OBS, capture VB-CABLE as audio source
4. This isolates NeuralMix audio from system sounds

---

## Limitations

### Browser-Based Streaming:

- ❌ Cannot directly send RTMP streams (requires server)
- ❌ Recording only, not true live streaming
- ✅ Can be uploaded to platforms after recording

### Input Streaming:

- ⚠️ Subject to platform API restrictions
- ⚠️ May have CORS limitations
- ⚠️ Requires stable internet connection
- ⚠️ Platform content may change or be removed

### Performance:

- High CPU usage when using video sources
- May affect audio sync on low-end hardware
- Multiple streams may cause browser lag

---

## Support

For issues or questions:

- Check browser console for error messages
- Verify platform API keys and permissions
- Test with different browsers (Chrome recommended)
- Ensure latest browser version
- Check NeuralMix logs in chat panel

---

## License

This streaming functionality is part of the NeuralMix P2P Enhanced platform.

**Author**: Serigne Diagne
**Version**: 11.2.0
**Last Updated**: 2025

---

## Related Documentation

- [AudioSync API Documentation](./audioSync-API.md)
- [Integration Guide](../INTEGRATION.md)
- [Main README](../README.md)
