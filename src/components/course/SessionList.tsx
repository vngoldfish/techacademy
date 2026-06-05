"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Lock, PlayCircle, Check, BookOpen } from "lucide-react";
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
  completedLessons?: number;
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
      {sessions.map((session) => {
        const isOpen = openSessions.has(session.id);
        
        return (
          <div 
            key={session.id} 
            className="overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm transition-all duration-300 hover:border-slate-200/80"
          >
            <button
              onClick={() => toggleSession(session.id)}
              className="flex w-full items-center justify-between p-5 text-left bg-slate-50/40 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{session.title}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {session.completedLessons !== undefined
                      ? `${session.completedLessons}/${session.lessons.length} bài học hoàn thành`
                      : `${session.lessons.length} bài học`}
                  </p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg hover:bg-slate-100/80 transition-colors">
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-100/60 bg-white">
                {session.lessons.map((lesson) => {
                  const canAccess = isEnrolled || lesson.isFree;
                  
                  return (
                    <a
                      key={lesson.id}
                      href={canAccess ? `/courses/${courseSlug}/lessons/${lesson.id}` : "#"}
                      className={`flex items-center justify-between p-4 px-5 transition-all duration-300 ${
                        !canAccess
                          ? "cursor-not-allowed opacity-60 bg-slate-50/10"
                          : "hover:bg-slate-50/60 group"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Status Icon */}
                        {lesson.completed ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/10 transition-transform duration-300 group-hover:scale-105">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : !canAccess ? (
                          <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                            <PlayCircle className="h-4 w-4" />
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {lesson.isFree && !isEnrolled && (
                              <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-blue-100 border text-[10px] font-bold px-1.5 py-0 rounded-md">
                                Học thử
                              </Badge>
                            )}
                            {lesson.duration && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                {formatDuration(lesson.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
