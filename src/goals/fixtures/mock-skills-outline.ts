import { GeneratedSkillsOutlineDto } from "../../common/dto/goal.dto";

/** Dev-only fixture when GEMINI_MOCK=true — phase 1 skills list only. */
export const MOCK_SKILLS_OUTLINE: GeneratedSkillsOutlineDto = {
  skills: [
    {
      title: "Learn basic piece movement",
      whyItMatters:
        "You cannot play a real game until every piece's movement is automatic.",
    },
    {
      title: "Avoid blunders in the opening",
      whyItMatters:
        "Most casual games are decided by one early mistake, not deep strategy.",
    },
    {
      title: "Basic checkmate patterns",
      whyItMatters:
        "Winning requires converting an advantage into checkmate, not just staying ahead.",
    },
  ],
};
