import type { AnswerRecord, Item, Round, SkillId } from './types';

export interface SkillRow {
  skill: SkillId;
  correct: number;
  total: number;
}

export interface Mistake {
  item: Item;
  typed: string;
}

export interface Summary {
  correct: number;
  total: number;
  accuracy: number;
  stars: 1 | 2 | 3;
  ms: number;
  skills: SkillRow[];
  mistakes: Mistake[];
  weakest: SkillId | null;
}

export function starsFor(accuracy: number): 1 | 2 | 3 {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  return 1;
}

export function summarize(
  round: Round,
  answers: readonly AnswerRecord[],
  startedAt: number,
  finishedAt: number,
): Summary {
  const byId = new Map(round.items.map((item) => [item.id, item]));
  const skills = new Map<SkillId, SkillRow>();
  const mistakes: Mistake[] = [];
  let correct = 0;

  for (const answer of answers) {
    const row = skills.get(answer.skill) ?? { skill: answer.skill, correct: 0, total: 0 };
    row.total += 1;
    if (answer.correct) {
      row.correct += 1;
      correct += 1;
    } else {
      const item = byId.get(answer.itemId);
      if (item) mistakes.push({ item, typed: answer.typed });
    }
    skills.set(answer.skill, row);
  }

  const total = answers.length;
  const accuracy = total === 0 ? 0 : correct / total;

  const ranked = [...skills.values()].sort(
    (a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total,
  );

  return {
    correct,
    total,
    accuracy,
    stars: starsFor(accuracy),
    ms: Math.max(0, finishedAt - startedAt),
    skills: [...skills.values()].sort((a, b) => b.total - a.total || a.skill.localeCompare(b.skill)),
    mistakes,
    weakest: ranked[0] && ranked[0].correct / ranked[0].total < 1 ? ranked[0].skill : null,
  };
}
