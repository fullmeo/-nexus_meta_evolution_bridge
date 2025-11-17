// streamingService.js — Video & Audio Streaming Service for NeuralMix P2P
// Supports YouTube and Twitch input/output streaming

/**
 * StreamingService handles video/audio streaming from platforms like YouTube and Twitch
 * and provides output streaming capabilities for live broadcasting
 */
export class StreamingService {
    constructor(audioSync) {
        this.audioSync = audioSync;

        // Input streaming
        this.youtubePlayer = null;
        this.twitchPlayer = null;
        this.activeStreamDeck = null;
        this.streamAudioSource = null;
        this.streamAudioElement = null;

        // Output streaming
        this.outputStream = null;
        this.isStreaming = false;
        this.streamDestination = null;
        this.streamKey = null;
        this.streamPlatform = null;

        // Callbacks
        this.onStreamReady = null;
        this.onStreamError = null;
        this.onStreamStatusChange = null;

        // YouTube API
        this.youtubeAPIReady = false;
        this.loadYouTubeAPI();
    }

    /**
     * Load YouTube IFrame API
     * @private
     */
    loadYouTubeAPI() {
        if (window.YT && window.YT.Player) {
            this.youtubeAPIReady = true;
            return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            this.youtubeAPIReady = true;
            console.log('✅ YouTube API loaded');
        };
    }

    /**
     * Extract video ID from YouTube URL
     * @param {string} url - YouTube URL
     * @returns {string|null} Video ID
     */
    extractYouTubeId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    /**
     * Extract channel name from Twitch URL
     * @param {string} url - Twitch URL
     * @returns {string|null} Channel name
     */
    extractTwitchChannel(url) {
        const patterns = [
            /twitch\.tv\/([a-zA-Z0-9_]+)/,
            /^([a-zA-Z0-9_]+)$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    /**
     * Load YouTube video as audio source for a deck
     * @param {string} deckId - Deck identifier ('a', 'b', etc.)
     * @param {string} youtubeUrl - YouTube URL or video ID
     * @param {string} containerId - DOM container ID for the player
     * @returns {Promise<Object>} Stream metadata
     */
    async loadYouTubeStream(deckId, youtubeUrl, containerId = 'youtube-player-container') {
        if (!this.youtubeAPIReady) {
            const error = 'YouTube API not ready yet';
            this.triggerError(error);
            throw new Error(error);
        }

        const videoId = this.extractYouTubeId(youtubeUrl);
        if (!videoId) {
            const error = 'Invalid YouTube URL';
            this.triggerError(error);
            throw new Error(error);
        }

        return new Promise((resolve, reject) => {
            try {
                // Create container if it doesn't exist
                let container = document.getElementById(containerId);
                if (!container) {
                    container = document.createElement('div');
                    container.id = containerId;
                    container.style.position = 'absolute';
                    container.style.left = '-9999px';
                    container.style.width = '640px';
                    container.style.height = '360px';
                    document.body.appendChild(container);
                }

                // Create player
                this.youtubePlayer = new YT.Player(containerId, {
                    height: '360',
                    width: '640',
                    videoId: videoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        disablekb: 0,
                        enablejsapi: 1,
                        modestbranding: 1,
                        playsinline: 1
                    },
                    events: {
                        onReady: (event) => {
                            this.onYouTubeReady(event, deckId, resolve, reject);
                        },
                        onError: (event) => {
                            const error = `YouTube error: ${event.data}`;
                            this.triggerError(error);
                            reject(new Error(error));
                        },
                        onStateChange: (event) => {
                            this.onYouTubeStateChange(event, deckId);
                        }
                    }
                });

                this.activeStreamDeck = deckId;
            } catch (error) {
                this.triggerError('Failed to load YouTube stream', error);
                reject(error);
            }
        });
    }

    /**
     * Handle YouTube player ready event
     * @private
     */
    async onYouTubeReady(event, deckId, resolve, reject) {
        try {
            // Get the iframe element
            const iframe = event.target.getIframe();

            // Try to capture audio using Web Audio API
            const audioContext = this.audioSync.audioContext;

            // Create an audio element to capture the stream
            this.streamAudioElement = document.createElement('audio');
            this.streamAudioElement.crossOrigin = 'anonymous';

            // For YouTube, we need to use captureStream if available
            // Note: This may have CORS restrictions
            const videoElement = iframe.contentWindow?.document?.querySelector('video');

            if (videoElement && videoElement.captureStream) {
                const mediaStream = videoElement.captureStream();
                this.streamAudioSource = audioContext.createMediaStreamSource(mediaStream);

                // Connect to the deck
                const deck = this.audioSync.decks.get(deckId);
                if (deck) {
                    this.streamAudioSource.connect(deck.gainNode);
                }

                const videoData = event.target.getVideoData();
                const duration = event.target.getDuration();

                const metadata = {
                    platform: 'youtube',
                    videoId: videoData.video_id,
                    title: videoData.title,
                    author: videoData.author,
                    duration: duration,
                    deckId: deckId
                };

                this.triggerStreamReady(metadata);
                resolve(metadata);
            } else {
                // Fallback: Use iframe audio (limited control)
                console.warn('⚠️ Direct audio capture not available, using iframe playback');

                const metadata = {
                    platform: 'youtube',
                    videoId: event.target.getVideoData().video_id,
                    title: event.target.getVideoData().title,
                    author: event.target.getVideoData().author,
                    duration: event.target.getDuration(),
                    deckId: deckId,
                    limitedControl: true
                };

                this.triggerStreamReady(metadata);
                resolve(metadata);
            }
        } catch (error) {
            this.triggerError('Failed to setup YouTube audio', error);
            reject(error);
        }
    }

    /**
     * Handle YouTube state changes
     * @private
     */
    onYouTubeStateChange(event, deckId) {
        const states = {
            '-1': 'unstarted',
            '0': 'ended',
            '1': 'playing',
            '2': 'paused',
            '3': 'buffering',
            '5': 'cued'
        };

        const state = states[event.data] || 'unknown';

        if (this.onStreamStatusChange) {
            this.onStreamStatusChange({
                platform: 'youtube',
                deckId: deckId,
                state: state,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Load Twitch stream as audio source
     * @param {string} deckId - Deck identifier
     * @param {string} twitchUrl - Twitch URL or channel name
     * @param {string} containerId - DOM container ID for the player
     * @returns {Promise<Object>} Stream metadata
     */
    async loadTwitchStream(deckId, twitchUrl, containerId = 'twitch-player-container') {
        const channel = this.extractTwitchChannel(twitchUrl);
        if (!channel) {
            const error = 'Invalid Twitch URL';
            this.triggerError(error);
            throw new Error(error);
        }

        return new Promise((resolve, reject) => {
            try {
                // Create container if it doesn't exist
                let container = document.getElementById(containerId);
                if (!container) {
                    container = document.createElement('div');
                    container.id = containerId;
                    container.style.position = 'absolute';
                    container.style.left = '-9999px';
                    container.style.width = '640px';
                    container.style.height = '360px';
                    document.body.appendChild(container);
                }

                // Create Twitch embed
                if (!window.Twitch || !window.Twitch.Embed) {
                    // Load Twitch embed script
                    const script = document.createElement('script');
                    script.src = 'https://embed.twitch.tv/embed/v1.js';
                    script.onload = () => {
                        this.createTwitchPlayer(channel, containerId, deckId, resolve, reject);
                    };
                    document.head.appendChild(script);
                } else {
                    this.createTwitchPlayer(channel, containerId, deckId, resolve, reject);
                }

                this.activeStreamDeck = deckId;
            } catch (error) {
                this.triggerError('Failed to load Twitch stream', error);
                reject(error);
            }
        });
    }

    /**
     * Create Twitch player
     * @private
     */
    createTwitchPlayer(channel, containerId, deckId, resolve, reject) {
        try {
            this.twitchPlayer = new Twitch.Embed(containerId, {
                width: 640,
                height: 360,
                channel: channel,
                layout: 'video',
                autoplay: false,
                muted: false
            });

            this.twitchPlayer.addEventListener(Twitch.Embed.VIDEO_READY, () => {
                const player = this.twitchPlayer.getPlayer();

                // Try to capture stream
                const iframe = document.querySelector(`#${containerId} iframe`);
                const videoElement = iframe?.contentWindow?.document?.querySelector('video');

                if (videoElement && videoElement.captureStream) {
                    const audioContext = this.audioSync.audioContext;
                    const mediaStream = videoElement.captureStream();
                    this.streamAudioSource = audioContext.createMediaStreamSource(mediaStream);

                    const deck = this.audioSync.decks.get(deckId);
                    if (deck) {
                        this.streamAudioSource.connect(deck.gainNode);
                    }
                }

                const metadata = {
                    platform: 'twitch',
                    channel: channel,
                    deckId: deckId,
                    isLive: true
                };

                this.triggerStreamReady(metadata);
                resolve(metadata);
            });

            this.twitchPlayer.addEventListener(Twitch.Embed.VIDEO_PLAY, () => {
                if (this.onStreamStatusChange) {
                    this.onStreamStatusChange({
                        platform: 'twitch',
                        deckId: deckId,
                        state: 'playing',
                        timestamp: Date.now()
                    });
                }
            });

            this.twitchPlayer.addEventListener(Twitch.Embed.VIDEO_PAUSE, () => {
                if (this.onStreamStatusChange) {
                    this.onStreamStatusChange({
                        platform: 'twitch',
                        deckId: deckId,
                        state: 'paused',
                        timestamp: Date.now()
                    });
                }
            });
        } catch (error) {
            this.triggerError('Failed to create Twitch player', error);
            reject(error);
        }
    }

    /**
     * Control YouTube playback
     * @param {string} action - 'play', 'pause', 'stop'
     */
    controlYouTube(action) {
        if (!this.youtubePlayer) return false;

        switch (action) {
            case 'play':
                this.youtubePlayer.playVideo();
                break;
            case 'pause':
                this.youtubePlayer.pauseVideo();
                break;
            case 'stop':
                this.youtubePlayer.stopVideo();
                break;
        }

        return true;
    }

    /**
     * Control Twitch playback
     * @param {string} action - 'play', 'pause'
     */
    controlTwitch(action) {
        if (!this.twitchPlayer) return false;

        const player = this.twitchPlayer.getPlayer();
        if (!player) return false;

        switch (action) {
            case 'play':
                player.play();
                break;
            case 'pause':
                player.pause();
                break;
        }

        return true;
    }

    /**
     * Get current YouTube playback time
     * @returns {number} Current time in seconds
     */
    getYouTubeCurrentTime() {
        return this.youtubePlayer ? this.youtubePlayer.getCurrentTime() : 0;
    }

    /**
     * Seek YouTube video
     * @param {number} seconds - Time in seconds
     */
    seekYouTube(seconds) {
        if (this.youtubePlayer) {
            this.youtubePlayer.seekTo(seconds, true);
        }
    }

    /**
     * Set YouTube volume
     * @param {number} volume - Volume 0-100
     */
    setYouTubeVolume(volume) {
        if (this.youtubePlayer) {
            this.youtubePlayer.setVolume(Math.max(0, Math.min(100, volume)));
        }
    }

    /**
     * Stop stream and disconnect
     * @param {string} platform - 'youtube' or 'twitch'
     */
    stopStream(platform) {
        if (platform === 'youtube' && this.youtubePlayer) {
            this.youtubePlayer.stopVideo();
            this.youtubePlayer.destroy();
            this.youtubePlayer = null;
        }

        if (platform === 'twitch' && this.twitchPlayer) {
            this.twitchPlayer.getPlayer()?.pause();
            this.twitchPlayer = null;
        }

        if (this.streamAudioSource) {
            this.streamAudioSource.disconnect();
            this.streamAudioSource = null;
        }

        this.activeStreamDeck = null;
    }

    /**
     * Initialize output streaming to YouTube/Twitch
     * @param {Object} config - Streaming configuration
     * @param {string} config.platform - 'youtube' or 'twitch'
     * @param {string} config.streamKey - Platform stream key
     * @param {string} config.serverUrl - RTMP server URL (optional)
     * @returns {Promise<Object>} Stream info
     */
    async initializeOutputStream(config) {
        const { platform, streamKey, serverUrl } = config;

        if (!streamKey) {
            throw new Error('Stream key is required');
        }

        this.streamPlatform = platform;
        this.streamKey = streamKey;
        this.streamDestination = serverUrl;

        // Get the master audio stream from audioSync
        this.outputStream = this.audioSync.getP2PAudioStream();

        if (!this.outputStream) {
            throw new Error('Failed to get audio stream');
        }

        // Note: Actual RTMP streaming requires a server-side component
        // This provides the MediaStream that can be sent to a streaming server
        // via WebRTC or captured for local recording

        return {
            platform: platform,
            streamReady: true,
            stream: this.outputStream,
            note: 'Use a streaming server (OBS, restream.io, etc.) to send to RTMP endpoint',
            rtmpUrl: this.getRTMPUrl(platform),
            streamKey: streamKey
        };
    }

    /**
     * Get RTMP URL for platform
     * @param {string} platform - 'youtube' or 'twitch'
     * @returns {string} RTMP URL
     */
    getRTMPUrl(platform) {
        const rtmpUrls = {
            youtube: 'rtmp://a.rtmp.youtube.com/live2',
            twitch: 'rtmp://live.twitch.tv/app',
            facebook: 'rtmps://live-api-s.facebook.com:443/rtmp',
            custom: this.streamDestination || 'rtmp://custom-server/live'
        };

        return rtmpUrls[platform] || rtmpUrls.custom;
    }

    /**
     * Start browser-based streaming (using MediaRecorder)
     * This creates a downloadable recording rather than true live streaming
     * @returns {boolean} Success status
     */
    startBrowserStream() {
        if (!this.outputStream) {
            this.triggerError('Output stream not initialized');
            return false;
        }

        try {
            this.mediaRecorder = new MediaRecorder(this.outputStream, {
                mimeType: 'audio/webm',
                audioBitsPerSecond: 128000
            });

            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.start(1000); // Collect data every second
            this.isStreaming = true;

            if (this.onStreamStatusChange) {
                this.onStreamStatusChange({
                    platform: this.streamPlatform,
                    state: 'streaming',
                    timestamp: Date.now()
                });
            }

            return true;
        } catch (error) {
            this.triggerError('Failed to start browser stream', error);
            return false;
        }
    }

    /**
     * Stop browser-based streaming
     * @returns {Blob|null} Recorded audio blob
     */
    stopBrowserStream() {
        if (!this.mediaRecorder || !this.isStreaming) {
            return null;
        }

        return new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                this.isStreaming = false;
                this.recordedChunks = [];

                if (this.onStreamStatusChange) {
                    this.onStreamStatusChange({
                        platform: this.streamPlatform,
                        state: 'stopped',
                        timestamp: Date.now()
                    });
                }

                resolve(blob);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Get stream statistics
     * @returns {Object} Stream stats
     */
    getStreamStats() {
        return {
            isStreaming: this.isStreaming,
            platform: this.streamPlatform,
            activeInputDeck: this.activeStreamDeck,
            youtubeActive: this.youtubePlayer !== null,
            twitchActive: this.twitchPlayer !== null,
            outputStreamReady: this.outputStream !== null
        };
    }

    /**
     * Trigger stream ready callback
     * @private
     */
    triggerStreamReady(metadata) {
        if (this.onStreamReady) {
            this.onStreamReady(metadata);
        }
    }

    /**
     * Trigger error callback
     * @private
     */
    triggerError(message, error = null) {
        if (this.onStreamError) {
            this.onStreamError(message, error);
        }
        console.error(`❌ StreamingService: ${message}`, error);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stopStream('youtube');
        this.stopStream('twitch');

        if (this.isStreaming) {
            this.stopBrowserStream();
        }

        this.outputStream = null;
        this.streamAudioElement = null;

        // Remove player containers
        const youtubeContainer = document.getElementById('youtube-player-container');
        if (youtubeContainer) youtubeContainer.remove();

        const twitchContainer = document.getElementById('twitch-player-container');
        if (twitchContainer) twitchContainer.remove();
    }
}

// Export singleton instance
export default StreamingService;
