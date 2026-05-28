"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VideoPlayerProps {
  src: string;
  videoType: "YOUTUBE" | "VIMEO" | "S3";
  poster?: string;
  onReady?: (player: any) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  startTime?: number;
}

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0];
    }

    if (parsed.pathname.includes("/embed/")) {
      return parsed.pathname.split("/embed/")[1]?.split("/")[0];
    }

    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

function getVimeoId(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } catch {
    return null;
  }
}

function VideoError() {
  return (
    <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
      Không thể phát video này.
    </div>
  );
}

export function VideoPlayer({
  src,
  videoType,
  poster,
  onReady,
  onTimeUpdate,
  onEnded,
  startTime = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (videoType !== "S3" || !videoRef.current) return;

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered");
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: "auto",
      fluid: true,
      responsive: true,
      aspectRatio: "16:9",
      sources: [{ src, type: "video/mp4" }],
      poster,
    });

    playerRef.current = player;

    player.ready(() => {
      if (startTime > 0) {
        player.currentTime(startTime);
      }
      onReady?.(player);
    });

    player.on("timeupdate", () => {
      const time = player.currentTime();
      if (time !== undefined) {
        onTimeUpdate?.(Math.floor(time));
      }
    });

    player.on("ended", () => {
      onEnded?.();
    });

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, videoType, poster, onReady, onTimeUpdate, onEnded, startTime]);

  if (videoType === "YOUTUBE") {
    const videoId = getYouTubeId(src);
    if (!videoId) return <VideoError />;

    return (
      <iframe
        className="aspect-video w-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Video bài học"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (videoType === "VIMEO") {
    const videoId = getVimeoId(src);
    if (!videoId) return <VideoError />;

    return (
      <iframe
        className="aspect-video w-full rounded-lg"
        src={`https://player.vimeo.com/video/${videoId}`}
        title="Video bài học"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div data-vjs-player className="overflow-hidden rounded-lg">
      <div ref={videoRef} />
    </div>
  );
}
