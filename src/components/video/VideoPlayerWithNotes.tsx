"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "./VideoPlayer";
import { TimestampNotes } from "./TimestampNotes";
import { InteractiveTranscript } from "./InteractiveTranscript";

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
  isInteractiveVideo?: boolean;
  subtitleUrl?: string | null;
}

export function VideoPlayerWithNotes({
  lessonId,
  videoUrl,
  videoType,
  initialNotes,
  initialPosition = 0,
  onProgressUpdate,
  onComplete,
  isInteractiveVideo = false,
  subtitleUrl = null,
}: VideoPlayerWithNotesProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const playerRef = useRef<any>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [activeTab, setActiveTab] = useState<"transcript" | "notes">(
    isInteractiveVideo && subtitleUrl ? "transcript" : "notes"
  );

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

  const hasSubtitles = isInteractiveVideo && subtitleUrl;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-8rem)] bg-slate-900">
      {/* Left Column: Video Player */}
      <div className="flex flex-1 items-start justify-center bg-black p-4 lg:p-6">
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

      {/* Right Column: Sidebar (Transcript / Notes) */}
      <div className="w-full lg:w-96 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col h-[500px] lg:h-auto lg:min-h-[calc(100vh-8rem)]">
        {hasSubtitles && (
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1.5 shrink-0 select-none">
            <button
              onClick={() => setActiveTab("transcript")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                activeTab === "transcript"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
              }`}
            >
              Phụ đề tương tác
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                activeTab === "notes"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
              }`}
            >
              Ghi chú bài học
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === "transcript" && subtitleUrl ? (
            <InteractiveTranscript
              subtitleUrl={subtitleUrl}
              currentTime={currentTime}
              onCueClick={handleJumpToTimestamp}
            />
          ) : (
            <TimestampNotes
              notes={notes}
              currentTime={currentTime}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onJumpToTimestamp={handleJumpToTimestamp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
