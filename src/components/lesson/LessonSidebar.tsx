"use client";

import Link from "next/link";
import { CheckCircle, Circle, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonItem {
  id: string;
  title: string;
  orderIndex: number;
  isGated: boolean;
  isFree: boolean;
  completed: boolean;
  isCurrent: boolean;
}

interface SessionGroup {
  id: string;
  title: string;
  orderIndex: number;
  lessons: LessonItem[];
}

interface LessonSidebarProps {
  sessions: SessionGroup[];
  courseId: string;
  currentLessonId: string;
}

export function LessonSidebar({ sessions, courseId, currentLessonId }: LessonSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Link href={`/courses`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Khóa học
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {sessions.map((session) => (
          <div key={session.id} className="mb-2">
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {session.title}
              </h3>
            </div>
            <ul className="space-y-0.5">
              {session.lessons.map((lesson) => {
                const isLocked = lesson.isGated && !lesson.completed && !lesson.isCurrent;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={isLocked ? "#" : `/learn/${courseId}/lesson/${lesson.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        lesson.isCurrent
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : lesson.completed
                            ? "text-gray-600 hover:bg-gray-50"
                            : isLocked
                              ? "cursor-not-allowed text-gray-400"
                              : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {lesson.completed ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                      ) : isLocked ? (
                        <Lock className="h-4 w-4 shrink-0" />
                      ) : lesson.isCurrent ? (
                        <PlayCircle className="h-4 w-4 shrink-0 text-blue-600" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0" />
                      )}
                      <span className="line-clamp-2">{lesson.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
