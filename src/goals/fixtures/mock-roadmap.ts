import { GeneratedRoadmapDto } from "../../common/dto/goal.dto";

/** Dev-only fixture when GEMINI_MOCK=true (mirrors frontend sampleGeneratedRoadmap). */
export const MOCK_GENERATED_ROADMAP: GeneratedRoadmapDto = {
  skills: [
    {
      title: "Learn basic piece movement",
      whyItMatters:
        "You cannot play a real game until every piece's movement is automatic.",
      videoResource: {
        title: "Chess basics for beginners",
        url: "https://www.youtube.com/watch?v=example1",
      },
      readingResource: {
        title: "How each chess piece moves",
        url: "https://example.com/chess/piece-movement",
      },
      practiceTask: {
        title: "Movement drills",
        description:
          "Set up an empty board and move each piece type to legal squares for 10 minutes.",
      },
    },
    {
      title: "Avoid blunders in the opening",
      whyItMatters:
        "Most casual games are decided by one early mistake, not deep strategy.",
      videoResource: {
        title: "Opening principles explained",
        url: "https://www.youtube.com/watch?v=example2",
      },
      readingResource: {
        title: "Three opening rules every beginner needs",
        url: "https://example.com/chess/opening-principles",
      },
      practiceTask: {
        title: "Blunder check habit",
        description:
          "Play 3 rapid games and pause before every move to ask: what does my opponent threaten?",
      },
    },
    {
      title: "Basic checkmate patterns",
      whyItMatters:
        "Winning requires converting an advantage into checkmate, not just staying ahead.",
      videoResource: {
        title: "Queen and rook checkmates",
        url: "https://www.youtube.com/watch?v=example3",
      },
      readingResource: {
        title: "Essential mating patterns",
        url: "https://example.com/chess/checkmate-patterns",
      },
      practiceTask: {
        title: "Mate drills",
        description:
          "Complete 10 mate-in-1 puzzles, then 5 mate-in-2 puzzles on a training site.",
      },
    },
  ],
};
