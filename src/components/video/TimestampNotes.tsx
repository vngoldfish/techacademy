"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Clock } from "lucide-react";
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
  const [isAdding, setIsAdding] = useState(false);

  function handleAdd() {
    if (!newNote.trim()) return;
    onAddNote(Math.floor(currentTime), newNote.trim());
    setNewNote("");
    setIsAdding(false);
  }

  const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex h-full flex-col border-l bg-white">
      <div className="border-b p-4">
        <h3 className="font-semibold text-gray-900">Ghi chú</h3>
        <p className="text-xs text-gray-500">{notes.length} ghi chú</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedNotes.length === 0 && !isAdding && (
          <p className="text-center text-sm text-gray-400 py-8">
            Chưa có ghi chú nào. Nhấn + để thêm.
          </p>
        )}

        {sortedNotes.map((note) => (
          <div
            key={note.id}
            className="group rounded-lg border p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <button
                onClick={() => onJumpToTimestamp(note.timestamp)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
              >
                <Clock className="h-3 w-3" />
                {formatDuration(note.timestamp)}
              </button>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-700">{note.content}</p>
          </div>
        ))}

        {isAdding && (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs text-gray-500">
              Thêm ghi chú tại {formatDuration(Math.floor(currentTime))}
            </p>
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Nội dung ghi chú..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>Lưu</Button>
              <Button size="sm" variant="outline" onClick={() => { setIsAdding(false); setNewNote(""); }}>
                Hủy
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isAdding && (
        <div className="border-t p-4">
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm ghi chú
          </Button>
        </div>
      )}
    </div>
  );
}
