import { GeneratedRoadmapDto } from "../../common/dto/goal.dto";

const PIECE_MOVEMENT_ARTICLE = `## How each piece moves

Chess pieces move in fixed patterns. Learning these patterns is the first step toward playing confidently.

- Pawns move forward one square, or two on their first move, and capture diagonally.
- Rooks move in straight lines across ranks and files.
- Bishops move diagonally any number of squares.
- Knights jump in an L-shape: two squares in one direction, then one square perpendicular.
- Queens combine rook and bishop movement.
- Kings move one square in any direction.

## Why movement matters

If you hesitate on legal moves, you will miss tactics and blunder pieces. Drill each piece type until the patterns feel automatic.`;

const OPENING_ARTICLE = `## Three opening rules

Strong openings do not require memorizing long lines. Follow three principles:

- Control the center with pawns and pieces.
- Develop knights and bishops toward active squares early.
- Castle to keep your king safe.

## Avoid early mistakes

Before every move, ask what your opponent threatens. Most beginner losses come from leaving pieces undefended or ignoring checks.`;

const CHECKMATE_ARTICLE = `## Basic mating ideas

Checkmate ends the game. Beginners should recognize a few reliable patterns:

- Back-rank mate when the king is trapped by its own pawns.
- Queen and king cooperating to drive the enemy king to the edge.
- Rook and king coordinating to cut off escape squares.

## Converting an advantage

Winning material is not enough. Practice converting extra pieces into checkmate by restricting the enemy king step by step.`;

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
        content: PIECE_MOVEMENT_ARTICLE,
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
        content: OPENING_ARTICLE,
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
        content: CHECKMATE_ARTICLE,
      },
      practiceTask: {
        title: "Mate drills",
        description:
          "Complete 10 mate-in-1 puzzles, then 5 mate-in-2 puzzles on a training site.",
      },
    },
  ],
};
