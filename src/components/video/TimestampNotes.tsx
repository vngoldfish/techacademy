"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date | string;
}

interface TimestampNotesProps {
  notes: Note[];
  currentTime: number;
  onAddNote: (timestamp: number, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  onJumpToTimestamp: (timestamp: number) => void;
}

export function TimestampNotes({
  notes,
  currentTime,
  onAddNote,
  onDeleteNote,
  onJumpToTimestamp,
}: TimestampNotesProps) {
  const [newNote, setNewNote] = useState("");

  function handleAdd() {
    const content = newNote.trim();
    if (!content) return;

    onAddNote(Math.floor(currentTime), content);
    setNewNote("");
  }

  const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);
  const currentTimestamp = formatDuration(Math.floor(currentTime));

  return (
    <div className="flex h-full flex-col border-l bg-white">
      <div className="border-b p-4">
        <h3 className="font-semibold text-gray-900">Ghi chú</h3>
        <p className="text-xs text-gray-500">
          {notes.length} ghi chú · Đang ở {currentTimestamp}
        </p>
      </div>

      <div className="border-b p-4">
        <div className="space-y-2 rounded-lg border bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-700">
            Ghi chú tại {currentTimestamp}
          </p>
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={`Viết ghi chú tại ${currentTimestamp}...`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button size="sm" className="w-full" onClick={handleAdd} disabled={!newNote.trim()}>
            Lưu ghi chú
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {sortedNotes.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            Chưa có ghi chú nào. Viết ghi chú ở ô bên trên, hệ thống sẽ lưu tại giây hiện tại của video.
          </p>
        )}

        {sortedNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => onJumpToTimestamp(note.timestamp)}
            className="group w-full rounded-lg border p-3 text-left transition-colors hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-blue-600">
                <Clock className="h-3 w-3" />
                {formatDuration(note.timestamp)}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }
                }}
                className="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                aria-label="Xóa ghi chú"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">{note.content}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
