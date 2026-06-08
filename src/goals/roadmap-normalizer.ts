function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

function ensureHttpsUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

function normalizeReadingResource(
  reading: Record<string, unknown>,
  fallbackTitle: string,
  fallbackWhy: string
): { title: string; content: string } {
  const title = asString(reading.title) ?? fallbackTitle;
  const content =
    asString(reading.content) ??
    asString(reading.body) ??
    asString(reading.text) ??
    (asString(reading.url)
      ? `## ${title}\n\n${fallbackWhy}\n\n## Key ideas\n\n- Focus on the core concept for this skill.\n- Practice in short, repeatable sessions.\n- Review what felt difficult before moving on.`
      : null);

  return {
    title,
    content:
      content ??
      `## ${title}\n\n${fallbackWhy}\n\n## Next steps\n\nApply this skill in a short practice session and note what still feels difficult.`,
  };
}

function normalizeVideoResource(
  video: Record<string, unknown>
): { title: string; url?: string; searchQuery?: string } {
  const title = asString(video.title) ?? "Video lesson";
  const rawUrl = asString(video.url);
  const searchQuery = asString(video.searchQuery);

  return {
    title,
    ...(searchQuery ? { searchQuery } : {}),
    ...(rawUrl ? { url: ensureHttpsUrl(rawUrl) } : {}),
  };
}

function normalizePracticeTask(
  practice: Record<string, unknown>,
  fallbackTitle: string
): { title: string; description: string } {
  return {
    title: asString(practice.title) ?? `Practice ${fallbackTitle.toLowerCase()}`,
    description:
      asString(practice.description) ??
      `Spend 20 minutes practicing ${fallbackTitle.toLowerCase()}.`,
  };
}

export function normalizeGeneratedRoadmap(raw: unknown): unknown {
  const root = asRecord(raw);
  if (!root || !Array.isArray(root.skills)) {
    return raw;
  }

  return {
    ...root,
    skills: root.skills.map((skill) => {
      const record = asRecord(skill);
      if (!record) {
        return skill;
      }

      const title = asString(record.title) ?? "Skill";
      const whyItMatters =
        asString(record.whyItMatters) ??
        "This skill is an important step in your learning path.";

      const readingRecord = asRecord(record.readingResource);
      const videoRecord = asRecord(record.videoResource);
      const practiceRecord = asRecord(record.practiceTask);

      return {
        title,
        whyItMatters,
        videoResource: videoRecord
          ? normalizeVideoResource(videoRecord)
          : {
              title: `${title} video`,
              url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
        readingResource: readingRecord
          ? normalizeReadingResource(readingRecord, `${title} guide`, whyItMatters)
          : normalizeReadingResource({}, `${title} guide`, whyItMatters),
        practiceTask: practiceRecord
          ? normalizePracticeTask(practiceRecord, title)
          : normalizePracticeTask({}, title),
      };
    }),
  };
}
