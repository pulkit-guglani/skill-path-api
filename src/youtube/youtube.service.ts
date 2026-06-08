import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";

interface YoutubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string };
  }>;
  error?: { message?: string };
}

export interface YoutubeVideoResult {
  url: string;
  title: string;
  videoId: string;
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string | null;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY?.trim() || null;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async searchFirstVideo(query: string): Promise<YoutubeVideoResult | null> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        "YouTube API is not configured. Set YOUTUBE_API_KEY."
      );
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return null;
    }

    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      q: trimmedQuery,
      maxResults: "1",
      safeSearch: "strict",
      relevanceLanguage: "en",
      key: this.apiKey,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | YoutubeSearchResponse
        | null;
      const message =
        body?.error?.message ?? `YouTube API returned ${response.status}`;
      this.logger.error(`YouTube search failed for "${trimmedQuery}": ${message}`);
      return null;
    }

    const data = (await response.json()) as YoutubeSearchResponse;
    const first = data.items?.[0];
    const videoId = first?.id?.videoId?.trim();

    if (!videoId) {
      this.logger.warn(`No YouTube results for query: "${trimmedQuery}"`);
      return null;
    }

    return {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: first?.snippet?.title?.trim() ?? "Video lesson",
    };
  }
}
