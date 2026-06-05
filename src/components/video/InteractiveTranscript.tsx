"use client";

import { useEffect, useRef, useState } from "react";
import { parseSubtitles, SubtitleCue } from "@/lib/subtitle-parser";
import { Play, Search, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface InteractiveTranscriptProps {
  subtitleUrl: string;
  currentTime: number;
  onCueClick: (timestamp: number) => void;
}

export function InteractiveTranscript({
  subtitleUrl,
  currentTime,
  onCueClick,
}: InteractiveTranscriptProps) {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevActiveIndexRef = useRef<number>(-1);

  // Fetch and parse subtitles
  useEffect(() => {
    let active = true;
    async function loadSubtitles() {
      try {
        setLoading(true);
        const res = await fetch(subtitleUrl);
        if (!res.ok) throw new Error("Failed to fetch subtitles");
        const content = await res.text();
        if (active) {
          const parsed = parseSubtitles(content, subtitleUrl);
          setCues(parsed);
        }
      } catch (err) {
        console.error("Error loading subtitles:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSubtitles();
    return () => {
      active = false;
    };
  }, [subtitleUrl]);

  // Find index of the currently active cue
  const activeIndex = cues.findIndex(
    (cue) => currentTime >= cue.start && currentTime <= cue.end
  );

  // Auto-scroll when activeIndex changes
  useEffect(() => {
    if (activeIndex !== -1 && activeIndex !== prevActiveIndexRef.current && containerRef.current) {
      prevActiveIndexRef.current = activeIndex;
      const activeEl = containerRef.current.querySelector(
        `[data-cue-index="${activeIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [activeIndex]);

  // Helper to format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter cues based on search query
  const filteredCues = cues.map((cue, idx) => ({ ...cue, originalIndex: idx })).filter((cue) =>
    cue.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-2"></div>
        <p className="text-xs font-semibold">Đang tải phụ đề...</p>
      </div>
    );
  }

  if (cues.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
        <p className="text-xs font-semibold">Không tìm thấy hoặc không thể nạp phụ đề tương tác.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      {/* Search Input Header */}
      <div className="p-3 border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm từ khóa trong phụ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* Transcript Scrollable Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 select-none scrollbar-thin"
        style={{ contentVisibility: "auto" }}
      >
        {filteredCues.map((cue) => {
          const isActive = cue.originalIndex === activeIndex;
          return (
            <div
              key={cue.originalIndex}
              data-cue-index={cue.originalIndex}
              onClick={() => onCueClick(cue.start)}
              className={`flex items-start gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-amber-100/60 border-amber-200 shadow-sm scale-[1.01]"
                  : "bg-white border-slate-100/80 hover:bg-slate-50 hover:border-slate-200"
              }`}
            >
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 mt-0.5 flex items-center gap-1 ${
                isActive 
                  ? "bg-amber-200 text-amber-800" 
                  : "bg-slate-100 text-slate-500 group-hover:bg-blue-50"
              }`}>
                {isActive ? <Volume2 className="h-3 w-3 animate-pulse" /> : <Play className="h-2.5 w-2.5" />}
                {formatTime(cue.start)}
              </div>
              <p className={`text-xs leading-relaxed transition-colors ${
                isActive 
                  ? "text-amber-950 font-bold" 
                  : "text-slate-700"
              }`}>
                {cue.text}
              </p>
            </div>
          );
        })}

        {filteredCues.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-400 font-semibold">
            Không tìm thấy từ khóa trùng khớp.
          </div>
        )}
      </div>
    </div>
  );
}
