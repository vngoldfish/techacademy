"use client";

import { useState, useEffect, useRef } from "react";
import { VideoPlayer } from "../video/VideoPlayer";
import { exportToVTT, parseSubtitles, SubtitleCue } from "@/lib/subtitle-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Plus, 
  Trash2, 
  Clock, 
  Save, 
  Sparkles, 
  X, 
  FileCheck,
  ChevronRight,
  Search
} from "lucide-react";

interface SubtitleEditorProps {
  videoUrl: string;
  videoType: "YOUTUBE" | "VIMEO" | "S3";
  lessonDuration: number | null;
  initialSubtitleUrl: string | null;
  onSave: (url: string) => void;
  onClose: () => void;
}

export function SubtitleEditor({
  videoUrl,
  videoType,
  lessonDuration,
  initialSubtitleUrl,
  onSave,
  onClose,
}: SubtitleEditorProps) {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingSubtitles, setLoadingSubtitles] = useState(false);
  const playerRef = useRef<any>(null);
  const cuesContainerRef = useRef<HTMLDivElement>(null);

  // Load existing subtitles if any
  useEffect(() => {
    const subtitleUrl = initialSubtitleUrl as string;
    if (!initialSubtitleUrl) return;

    let active = true;
    async function loadSubtitles() {
      try {
        setLoadingSubtitles(true);
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
        if (active) setLoadingSubtitles(false);
      }
    }

    loadSubtitles();
    return () => {
      active = false;
    };
  }, [initialSubtitleUrl]);

  // Handle Video ready
  const handleReady = (player: any) => {
    playerRef.current = player;
  };

  // Handle Time update from player
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  // Seek video player to specific time
  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(seconds);
      playerRef.current.play?.();
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-generate template subtitles (every 10 seconds)
  const handleAutoGenerate = () => {
    let duration = lessonDuration || 120;
    
    // Check if player has duration info
    if (playerRef.current && typeof playerRef.current.duration === "function") {
      const pDuration = playerRef.current.duration();
      if (pDuration && !isNaN(pDuration)) {
        duration = Math.floor(pDuration);
      }
    }

    const newCues: SubtitleCue[] = [];
    for (let start = 0; start < duration; start += 10) {
      const end = Math.min(start + 10, duration);
      newCues.push({
        start,
        end,
        text: `Phụ đề đoạn [${formatTime(start)} - ${formatTime(end)}] (Vui lòng sửa lại nội dung)...`,
      });
    }

    setCues(newCues);
  };

  // Add a new manual cue row
  const handleAddCue = () => {
    const newCue: SubtitleCue = {
      start: currentTime,
      end: currentTime + 5,
      text: "Nội dung phụ đề mới...",
    };
    
    // Insert cue in sorted order based on start time
    const updatedCues = [...cues, newCue].sort((a, b) => a.start - b.start);
    setCues(updatedCues);
  };

  // Delete a cue row
  const handleDeleteCue = (indexToDelete: number) => {
    setCues(cues.filter((_, idx) => idx !== indexToDelete));
  };

  // Update cue fields
  const handleUpdateCue = (index: number, fields: Partial<SubtitleCue>) => {
    const updated = cues.map((cue, idx) => {
      if (idx === index) {
        const nextCue = { ...cue, ...fields };
        // Ensure start <= end
        if (nextCue.start > nextCue.end) {
          nextCue.end = nextCue.start;
        }
        return nextCue;
      }
      return cue;
    });
    // Sort cues automatically if start time is changed
    if ("start" in fields) {
      updated.sort((a, b) => a.start - b.start);
    }
    setCues(updated);
  };

  // Save cues to VTT file and update database
  const handleSaveSubtitles = async () => {
    if (cues.length === 0) {
      alert("Vui lòng thêm ít nhất một dòng phụ đề trước khi lưu.");
      return;
    }

    try {
      setSaving(true);
      const vttContent = exportToVTT(cues);
      
      // Create virtual file
      const file = new File([vttContent], "subtitles.vtt", { type: "text/vtt" });
      const formData = new FormData();
      formData.append("file", file);

      // Upload file
      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload subtitle file");
      const uploadData = await uploadRes.json();
      
      if (uploadData.url) {
        onSave(uploadData.url);
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi lưu phụ đề.");
    } finally {
      setSaving(false);
    }
  };

  const filteredCues = cues.map((c, i) => ({ ...c, originalIndex: i })).filter(
    (cue) => cue.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Soạn thảo phụ đề bài học
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Thiết kế phụ đề tương tác, đồng bộ trực tiếp mốc thời gian với video bài giảng.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl h-9 w-9 p-0">
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </div>

        {/* Workspace body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left panel: Video Player */}
          <div className="w-full md:w-1/2 bg-black flex flex-col items-center justify-center p-4 md:p-6 shrink-0 relative">
            <div className="w-full max-w-lg aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <VideoPlayer
                src={videoUrl}
                videoType={videoType}
                startTime={0}
                onReady={handleReady}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
            
            {/* Playback Stats */}
            <div className="mt-4 text-center text-xs text-slate-400 font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md select-none">
              Thời gian hiện tại: <span className="text-amber-400 text-sm ml-1 font-mono">{formatTime(currentTime)}</span> ({currentTime} giây)
            </div>
          </div>

          {/* Right panel: Subtitle Rows list */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/40">
            
            {/* Editor Action Buttons & Search */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Button onClick={handleAddCue} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-9 px-4">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm dòng
                </Button>
                {cues.length === 0 && (
                  <Button onClick={handleAutoGenerate} variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600 text-xs font-semibold h-9 px-4">
                    <Sparkles className="h-4 w-4 mr-1 text-blue-500" />
                    Chia tự động (10s)
                  </Button>
                )}
              </div>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Lọc từ khóa phụ đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* List scroll container */}
            <div ref={cuesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingSubtitles ? (
                <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                  Đang nạp dữ liệu phụ đề cũ...
                </div>
              ) : filteredCues.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-white p-8">
                  <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700">Chưa có phụ đề</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Bài học này chưa được khởi tạo phụ đề. Hãy bấm nút **Thêm dòng** hoặc **Chia tự động** để bắt đầu soạn thảo.
                  </p>
                </div>
              ) : (
                filteredCues.map((cue) => {
                  const isActive = currentTime >= cue.start && currentTime <= cue.end;
                  return (
                    <div 
                      key={cue.originalIndex}
                      className={`p-4 bg-white border rounded-2xl transition-all duration-200 flex flex-col gap-3 shadow-sm hover:shadow-md ${
                        isActive ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20" : "border-slate-100"
                      }`}
                    >
                      {/* Timeline controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-3">
                          {/* Start time */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Bắt đầu</span>
                            <div className="flex items-center">
                              <Input 
                                type="number" 
                                value={cue.start} 
                                step="any"
                                onChange={(e) => handleUpdateCue(cue.originalIndex, { start: parseFloat(e.target.value) || 0 })}
                                className="h-7 w-16 text-center text-xs font-mono rounded-lg border-slate-200 p-1"
                              />
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleUpdateCue(cue.originalIndex, { start: currentTime })}
                                title="Lấy giây hiện tại từ Video"
                                className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg ml-0.5"
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <ChevronRight className="h-3 w-3 text-slate-300" />

                          {/* End time */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Kết thúc</span>
                            <div className="flex items-center">
                              <Input 
                                type="number" 
                                value={cue.end} 
                                step="any"
                                onChange={(e) => handleUpdateCue(cue.originalIndex, { end: parseFloat(e.target.value) || 0 })}
                                className="h-7 w-16 text-center text-xs font-mono rounded-lg border-slate-200 p-1"
                              />
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleUpdateCue(cue.originalIndex, { end: currentTime })}
                                title="Lấy giây hiện tại từ Video"
                                className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg ml-0.5"
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleSeek(cue.start)}
                            title="Phát thử video tại mốc này"
                            className="h-7 px-2 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Phát thử
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteCue(cue.originalIndex)}
                            className="h-7 w-7 p-0 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Text Input area */}
                      <Textarea
                        value={cue.text}
                        rows={2}
                        onChange={(e) => handleUpdateCue(cue.originalIndex, { text: e.target.value })}
                        placeholder="Nhập nội dung phụ đề hiển thị tại mốc thời gian này..."
                        className="text-xs rounded-xl border-slate-200 p-2.5 bg-slate-50/20 focus:bg-white resize-none"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <span className="text-xs text-slate-500 font-semibold">
            Tổng cộng: <strong className="text-slate-800">{cues.length}</strong> câu phụ đề.
          </span>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-semibold h-10 px-5 border-slate-200">
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleSaveSubtitles} 
              disabled={saving || cues.length === 0} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-10 px-6 shadow-md shadow-blue-500/10"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? "Đang lưu phụ đề..." : "Lưu cấu hình & Đóng"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
