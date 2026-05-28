"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Lock, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  isFree: boolean;
  isGated: boolean;
  duration: number | null;
  completed?: boolean;
}

interface SessionData {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface SessionListProps {
  sessions: SessionData[];
  isEnrolled: boolean;
  courseSlug: string;
}

export function SessionList({ sessions, isEnrolled, courseSlug }: SessionListProps) {
  const [openSessions, setOpenSessions] = useState<Set<string>>(
    new Set(sessions.map((s) => s.id))
  );

  function toggleSession(sessionId: string) {
    setOpenSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="rounded-lg border">
          <button
            onClick={() => toggleSession(session.id)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <div>
              <h3 className="font-semibold text-gray-900">{session.title}</h3>
              <p className="text-sm text-gray-500">
                {session.lessons.length} bài học
              </p>
            </div>
            {openSessions.has(session.id) ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {openSessions.has(session.id) && (
            <div className="border-t">
              {session.lessons.map((lesson) => (
                <a
                  key={lesson.id}
                  href={
                    isEnrolled || lesson.isFree
                      ? `/courses/${courseSlug}/lessons/${lesson.id}`
                      : "#"
                  }
                  className={`flex items-center justify-between border-b p-4 last:border-0 ${
                    lesson.isGated && !isEnrolled
                      ? "cursor-not-allowed opacity-60"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {lesson.completed ? (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : lesson.isGated && !isEnrolled ? (
                      <Lock className="h-5 w-5 text-gray-400" />
                    ) : (
                      <PlayCircle className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                      <div className="flex items-center gap-2">
                        {lesson.isFree && !isEnrolled && (
                          <Badge variant="secondary" className="text-xs">Miễn phí</Badge>
                        )}
                        {lesson.duration && (
                          <span className="text-xs text-gray-400">
                            {formatDuration(lesson.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
