"use client";

import React, {useState, useEffect, useRef, useCallback} from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { FaPause, FaPlay, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress, FaComments, FaCogs } from "react-icons/fa";
import { OnProgressProps } from "react-player/base";
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import Chat from '@/components/chat';
import { RingLoader } from 'react-spinners';
import { IStream } from "@/models/Stream.ts";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/utils.ts";
import { CHAT_PERMISSION } from "@/lib/constants.ts";
import pusher from '../lib/pusher';
import {showToast} from "@/components/toast.tsx";
import {User} from "next-auth";
import {throttle} from "lodash";
import {useRouter} from "next/navigation"; // Import your Pusher instance

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

const Player: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isClient, setIsClient] = useState<boolean>(false);
    const [currentDuration, setCurrentDuration] = useState<string>();
    const [duration, setDuration] = useState<string>();
    const [volume, setVolume] = useState<number>(0.5); // Default volume is 0.5 (50%)
    const [isMuted, setMuted] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);
    const [showControls, setShowControls] = useState<boolean>(true);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [showChat, setShowChat] = useState<boolean>(true); // Chat visible by default
    const [showOverlayChat, setShowOverlayChat] = useState<boolean>(false);
    const [showContentRating, setShowContentRating] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true); // Loading state
    const [isMusicPlaying, setMusicPlaying] = useState<boolean>(false); // Music playing state
    const [streamInfo, setStreamInfo] = useState<IStream>();
    const playerRef = useRef<HTMLDivElement>(null);
    const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null); // Ref for the audio element
    const [streamUrl, setStreamUrl] = useState('');

    const { data: session } = useSession();

    const router = useRouter()

    useEffect(() => {
        setIsClient(true);

        // Subscribe to Pusher events
        const channel = pusher.subscribe('stream-channel');
        channel.bind('start-broadcast', handleStartBroadcast);
        channel.bind('end-broadcast', handleEndBroadcast);

        return () => {
            channel.unbind('start-broadcast', handleStartBroadcast);
            channel.unbind('end-broadcast', handleEndBroadcast);
            pusher.unsubscribe('stream-channel');
        };
    }, []);

    useEffect(() => {
        if (showContentRating) {
            const timer = setTimeout(() => setShowContentRating(false), 5000); // Hide after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [showContentRating]);

    useEffect(() => {
        if (loading && isMusicPlaying && audioRef.current) {
            audioRef.current.play(); // Play the music when loading starts
        } else if (audioRef.current) {
            audioRef.current.pause(); // Pause the music when loading ends
        }
    }, [loading, isMusicPlaying]);

    useEffect(() => {
        const fetchStreamInfo = async () => {
            try {
                const response = await axios.get('/api/stream/stream');
                setStreamInfo(response.data);
                setStreamUrl(window.location.href + 'api/stream/video');
                setHasError(false);
            } catch (error) {
                console.error("Failed to fetch stream info", error);
                setHasError(true);
                setHasError(false);
            }
        };

        fetchStreamInfo();
    }, []);

    const handleStartBroadcast = (data: User) => {
        setLoading(true);
        const fetchStreamInfo = async () => {
            try {
                const response = await axios.get('/api/stream/stream');
                setStreamInfo(response.data);
                setStreamUrl(window.location.href + 'api/stream/video');
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch stream info", error);
                setHasError(true);
                setLoading(false);
            }
        };

        fetchStreamInfo();

        window.location.reload();
        showToast("The stream just started.")
    };

    const handleEndBroadcast = () => {
        setLoading(true);

        window.location.reload();
        showToast("The streaming was ended", "info")
    };

    const formatDuration = (seconds: number) => {
        seconds = Math.floor(seconds);
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return [hrs, mins, secs].map(v => v.toString().padStart(2, '0')).join(':');
    };

    const handleSetDuration = (duration: number) => {
        setDuration(formatDuration(duration));
    };

    const handleProgress = (cb: OnProgressProps) => {
        setCurrentDuration(formatDuration(cb.playedSeconds));
    };

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);
        setMuted(newVolume === 0);
    };

    const toggleMute = () => {
        setMuted(!isMuted);
        setVolume(isMuted ? 0.5 : 0); // Restore to 50% volume when unmuting
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    }

    const handleFullScreen = () => {
        if (playerRef.current) {
            if (!isFullScreen) {
                if (playerRef.current.requestFullscreen) {
                    playerRef.current.requestFullscreen();
                }
                setIsFullScreen(true);
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                setIsFullScreen(false);
                setShowOverlayChat(false);
            }
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => setShowControls(false), 5000);
    };

    const toggleChat = () => {
        if (isFullScreen) {
            setShowOverlayChat(!showOverlayChat);
        } else {
            setShowChat(!showChat);
        }
    };

    const handleReady = () => {
        setLoading(false);
        setHasError(false);
    };

    const handleError = () => {
        setLoading(false);
        setHasError(true);
    };

    const handleBuffer = useCallback(throttle(() => {
        setLoading(true);
    }, 1000), []);

    const handleBufferEnd = () => {
        setLoading(false);
    };

    return (
        <div ref={playerRef} className="relative flex w-full h-screen bg-black" onMouseMove={handleMouseMove} style={{ overflow: 'hidden' }}>
            {showContentRating && streamInfo && (
                <div className="absolute top-4 left-4 p-2 text-white z-50 rounded-md flex flex-col border-l-4 border-pink-600">
                    <div className="flex items-center">
                        <div className="w-1 bg-red-600 h-full mr-2"></div>
                        <h2 className="text-lg font-bold">RATED {streamInfo.contentRating.age}+</h2>
                    </div>
                    <p className="mt-1 text-sm text-center">{streamInfo.contentRating.reason}</p>
                </div>
            )}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex-1 flex items-center justify-center relative bg-black">
                <div className="absolute inset-0 flex items-center justify-center">
                    {loading ? (
                        <>
                            <RingLoader color="#ffffff" />
                        </>
                    ) : hasError ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <RingLoader color="#ffffff" />
                        </div>
                    ) : (<></>)}

                    {isClient && (
                        <ReactPlayer
                            url={streamUrl}
                            playing={isPlaying}
                            controls={false}
                            width="100%"
                            height="100%"
                            onError={handleError}
                            volume={isMuted ? 0 : volume}
                            onDuration={handleSetDuration}
                            onProgress={handleProgress}
                            onReady={handleReady}
                            onBuffer={handleBuffer}
                            onBufferEnd={handleBufferEnd}
                            config={{
                                file: {
                                    attributes: {
                                        crossorigin: 'anonymous'
                                    },
                                    forceHLS: true
                                }
                            }}
                        />
                    )}
                </div>
                <div className={`absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gray-900 bg-opacity-75 text-white transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <div className="relative flex items-center">
                                <button className="p-2 md:p-4 text-xl md:text-2xl rounded" onClick={togglePlay}>
                                    {isPlaying ? <FaPause/> : <FaPlay/>}
                                </button>
                                <button className="p-2 md:p-4 text-xl md:text-2xl rounded" onClick={toggleMute}>
                                    {isMuted ? <FaVolumeMute/> : <FaVolumeUp/>}
                                </button>
                                {showControls && (
                                    <div className="relative flex items-center">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={volume}
                                            onChange={handleVolumeChange}
                                            className="volume-slider bg-gray-800 ml-2 hidden md:block"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-center flex flex-col items-center">
                            <h3 className="text-md md:text-lg font-bold">{streamInfo?.title}</h3>
                            {duration && (
                                <div className="text-gray-400 text-xs md:text-sm">
                                    {currentDuration}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <Tooltip overlay="Chat" placement="top">
                                <button className="p-2 md:p-4 text-xl md:text-2xl rounded" onClick={toggleChat}>
                                    <FaComments />
                                </button>
                            </Tooltip>

                            {session?.profile && hasPermission(session.profile, CHAT_PERMISSION.MODERATION_DASHBOARD) && (
                                <Tooltip overlay="Moderation view" placement="top">
                                    <button className="p-2 md:p-4 text-xl md:text-2xl rounded" onClick={() => router.push("/dashboard")}>
                                        <FaCogs className="text-yellow-200" />
                                    </button>
                                </Tooltip>
                            )}

                            <Tooltip overlay={isFullScreen ? "Exit Fullscreen" : "Fullscreen"} placement="top">
                                <button className="p-2 md:p-4 text-xl md:text-2xl rounded" onClick={handleFullScreen}>
                                    {isFullScreen ? <FaCompress /> : <FaExpand />}
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
            {showChat && !isFullScreen && (
                <div className="hidden md:block w-1/4 h-full bg-gray-900">
                    <Chat streamId={streamInfo?.streamId}/>
                </div>
            )}
            {showOverlayChat && isFullScreen && (
                <div className="absolute top-4 left-4 w-1/4 h-1/3 rounded-lg overflow-hidden">
                    <Chat streamId={streamInfo?.streamId} isOverlay={true} />
                </div>
            )}
        </div>
    );
};

export default Player;
