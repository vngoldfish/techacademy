"use client";

import { useEffect } from "react";

interface TrackCourseViewProps {
  category: string;
  slug: string;
}

export function TrackCourseView({ category, slug }: TrackCourseViewProps) {
  useEffect(() => {
    if (!category || !slug) return;

    // Check sessionStorage to prevent repeated view tracking of the same course in the same session
    const sessionKey = `tracked_course_view_${slug}`;
    if (sessionStorage.getItem(sessionKey)) return;

    // Retrieve existing interests from cookie
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() ?? null;
      }
      return null;
    };

    let interests: Record<string, number> = {};
    const rawCookie = getCookie("user_interests");

    if (rawCookie) {
      try {
        let cleanedCookie = rawCookie.trim();
        if (cleanedCookie.startsWith('"') && cleanedCookie.endsWith('"')) {
          cleanedCookie = cleanedCookie.substring(1, cleanedCookie.length - 1);
        }
        const decoded = decodeURIComponent(cleanedCookie);
        interests = JSON.parse(decoded);
        if (typeof interests !== "object" || interests === null) {
          interests = {};
        }
      } catch (e) {
        console.error("[TrackCourseView] Failed to parse interests cookie:", e);
        interests = {};
      }
    }

    // Increment current category views
    interests[category] = (interests[category] || 0) + 1;

    // Keep it bounded so one category doesn't dominate infinitely
    // Maximum 20 view weight per category
    if (interests[category] > 20) {
      interests[category] = 20;
    }

    // Set cookie with 30 days expiration
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    document.cookie = `user_interests=${encodeURIComponent(
      JSON.stringify(interests)
    )}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

    // Mark as tracked for this session
    sessionStorage.setItem(sessionKey, "true");
  }, [category, slug]);

  return null;
}
