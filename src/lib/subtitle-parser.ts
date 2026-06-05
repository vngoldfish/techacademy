export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().replace(",", ".").split(":");
  if (parts.length === 3) {
    const hrs = parseFloat(parts[0]);
    const mins = parseFloat(parts[1]);
    const secs = parseFloat(parts[2]);
    return hrs * 3600 + mins * 60 + secs;
  }
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    return mins * 60 + secs;
  }
  return parseFloat(timeStr) || 0;
}

export function parseSubtitles(content: string, filename: string): SubtitleCue[] {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.endsWith(".json")) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          start: parseFloat(item.start) || 0,
          end: parseFloat(item.end) || 0,
          text: String(item.text || "").trim(),
        }));
      }
    } catch (e) {
      console.error("Failed to parse JSON subtitle content:", e);
    }
    return [];
  }

  // Parse SRT or VTT
  const cues: SubtitleCue[] = [];
  const lines = content.replace(/\r/g, "").split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // Check if line contains timestamp arrow "-->"
    if (line.includes("-->")) {
      const parts = line.split("-->");
      if (parts.length === 2) {
        const start = parseTimeToSeconds(parts[0]);
        const end = parseTimeToSeconds(parts[1]);
        
        // Read text until next blank line or next timestamp
        let text = "";
        i++;
        while (i < lines.length && lines[i].trim() !== "" && !lines[i].includes("-->")) {
          // If the line is a single number before the cue, look ahead to see if next line has -->
          // This avoids treating the next cue number as text
          if (/^\d+$/.test(lines[i].trim()) && i + 1 < lines.length && lines[i + 1].includes("-->")) {
            break;
          }
          text += (text ? " " : "") + lines[i].trim();
          i++;
        }
        
        // Strip out HTML tags or VTT formatting tags if any (e.g. <b>, <i>, <c.class>)
        const cleanText = text
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();

        if (cleanText) {
          cues.push({ start, end, text: cleanText });
        }
        continue;
      }
    }
    i++;
  }
  return cues;
}

function formatTimeToVTT(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  const hrsStr = hrs.toString().padStart(2, "0");
  const minsStr = mins.toString().padStart(2, "0");
  const secsStr = secs.toString().padStart(2, "0");
  const msStr = ms.toString().padStart(3, "0");

  return `${hrsStr}:${minsStr}:${secsStr}.${msStr}`;
}

export function exportToVTT(cues: SubtitleCue[]): string {
  let output = "WEBVTT\n\n";
  cues.forEach((cue, index) => {
    output += `${index + 1}\n`;
    output += `${formatTimeToVTT(cue.start)} --> ${formatTimeToVTT(cue.end)}\n`;
    output += `${cue.text}\n\n`;
  });
  return output.trim() + "\n";
}
