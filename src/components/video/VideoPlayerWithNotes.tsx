"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "./VideoPlayer";
import { TimestampNotes } from "./TimestampNotes";

interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date | string;
}

interface VideoPlayerWithNotesProps {
  lessonId: string;
  videoUrl: string;
  videoType: "YOUTUBE" | "VIMEO" | "S3";
  initialNotes: Note[];
  initialPosition?: number;
  onProgressUpdate?: (position: number) => void;
  onComplete?: () => void;
}

export function VideoPlayerWithNotes({
  lessonId,
  videoUrl,
  videoType,
  initialNotes,
  initialPosition = 0,
  onProgressUpdate,
  onComplete,
}: VideoPlayerWithNotesProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const playerRef = useRef<any>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveProgress = useCallback(async (payload: { lastPosition?: number; videoCompleted?: boolean; completed?: boolean }) => {
    await fetch(`/api/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }, [lessonId]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleReady = useCallback((player: any) => {
    playerRef.current = player;

    saveIntervalRef.current = setInterval(() => {
      const pos = Math.floor(player.currentTime());
      if (onProgressUpdate) {
        onProgressUpdate(pos);
      } else {
        saveProgress({ lastPosition: pos });
      }
    }, 10000);
  }, [onProgressUpdate, saveProgress]);

  const handleEnded = useCallback(async () => {
    if (onComplete) {
      onComplete();
    } else {
      await saveProgress({ videoCompleted: true });
      router.refresh();
    }
  }, [onComplete, router, saveProgress]);

  const handleAddNote = useCallback(async (timestamp: number, content: string) => {
    const res = await fetch(`/api/lessons/${lessonId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp, content }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [...prev, note]);
    }
  }, [lessonId]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  const handleJumpToTimestamp = useCallback((timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(timestamp);
      playerRef.current.play();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <div className="flex flex-1 items-start justify-center bg-black p-4">
        <div className="w-full max-w-6xl">
          <VideoPlayer
            src={videoUrl}
            videoType={videoType}
            startTime={initialPosition}
            onReady={handleReady}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>
      </div>
      <div className="min-h-[calc(100vh-8rem)] w-80 shrink-0">
        <TimestampNotes
          notes={notes}
          currentTime={currentTime}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onJumpToTimestamp={handleJumpToTimestamp}
        />
      </div>
    </div>
  );
}
