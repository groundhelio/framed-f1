import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw } from 'lucide-react';

const Player = ({ streamUrl, channelName }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const hlsRef = useRef(null);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        setError(null);
        if (!streamUrl) return;

        const proxyUrl = `/proxy?url=${encodeURIComponent(streamUrl)}`;

        setIsLoading(true);

        const onPlay = () => {
            setIsPlaying(true);
            setIsLoading(false);
        };
        const onPause = () => setIsPlaying(false);
        const onWaiting = () => setIsLoading(true);
        const onPlaying = () => setIsLoading(false);
        const onVolumeChange = () => {
            setVolume(video.volume);
            setIsMuted(video.muted);
        };

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('volumechange', onVolumeChange);

        if (Hls.isSupported()) {
            if (hlsRef.current) hlsRef.current.destroy();

            const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
            hlsRef.current = hls;

            hls.loadSource(proxyUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.log('Autoplay prevented:', e));
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error('HLS Error', data);
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                    else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
                    else { hls.destroy(); setError('Stream Error'); }
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = proxyUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.log('Autoplay prevented:', e));
            });
        } else {
            setError('HLS not supported');
        }

        // Safety timeout
        const timeoutId = setTimeout(() => {
            if (isLoading) {
                setError('Connection timeout');
                setIsLoading(false);
                if (hlsRef.current) hlsRef.current.stopLoad();
            }
        }, 20000);

        return () => {
            clearTimeout(timeoutId);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('volumechange', onVolumeChange);
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [streamUrl, retryCount]);

    // Controls Logic
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    const handleVolumeChange = (e) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        if (videoRef.current) {
            videoRef.current.volume = newVol;
            videoRef.current.muted = newVol === 0;
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => console.error(err));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Activity Monitor to hide controls
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    return (
        <div
            ref={containerRef}
            className="video-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onDoubleClick={toggleFullscreen}
        >
            {error && (
                <div className="error-message" style={{ position: 'absolute', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <span>{error}</span>
                    <button
                        onClick={() => {
                            setError(null);
                            setRetryCount(c => c + 1);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#e50914', color: 'white', cursor: 'pointer' }}
                    >
                        <RotateCcw size={16} /> Retry
                    </button>
                </div>
            )}

            {isLoading && !error && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}

            <video ref={videoRef} className="video-player" playsInline />

            {/* Channel Info Overlay */}
            <div className={`channel-info-overlay ${showControls ? '' : 'hidden'}`}>
                {channelName}
            </div>

            {/* Custom Controls */}
            <div className={`video-controls-overlay ${showControls ? 'visible' : ''}`}>
                <div className="controls-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button className="control-btn" onClick={togglePlay}>
                            {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
                        </button>

                        <div className="volume-container">
                            <button className="control-btn" onClick={toggleMute}>
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                            />
                        </div>
                    </div>

                    <button className="control-btn" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Player;
