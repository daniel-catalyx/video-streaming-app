'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/fantasy/index.css';

interface VideoPlayerProps {
  videoId: string;
  onEnded?: () => void;
  autoplay?: boolean;
}

export default function VideoPlayer({ videoId, onEnded, autoplay = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-theme-fantasy');
    videoRef.current.appendChild(videoElement);

    const player = playerRef.current = videojs(videoElement, {
      autoplay: autoplay,
      controls: true,
      responsive: true,
      fluid: true,
      sources: [{
        src: `http://localhost:8000/api/videos/${videoId}/stream`,
        type: 'video/mp4'
      }],
      playbackRates: [0.5, 1, 1.5, 2],
      controlBar: {
        volumePanel: {
          inline: false
        }
      }
    });

    player.on('ended', () => {
      if (onEnded) {
        onEnded();
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoId, onEnded, autoplay]);

  return (
    <div className="video-container">
      <div ref={videoRef} />
    </div>
  );
}