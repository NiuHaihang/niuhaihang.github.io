import { generatePractice, generateRound } from './generator';
import { levelForSkill } from './levels';
import type { AnswerRecord, LevelId, Round, SkillId, Track } from './types';

export type Screen = 'home' | 'quiz' | 'result';
export type Mode = 'round' | 'practice';
export type Phase = 'input' | 'correct' | 'wrong';

export interface SessionState {
  screen: Screen;
  /** The quiz set picked on the home screen. */
  track: Track;
  level: LevelId;
  mode: Mode;
  practiceSkill: SkillId | null;
  round: Round | null;
  index: number;
  typed: string;
  phase: Phase;
  answers: AnswerRecord[];
  hint: boolean;
  startedAt: number;
  questionStartedAt: number;
  finishedAt: number | null;
}

export function initialState(level: LevelId, track: Track = 'addsub'): SessionState {
  return {
    screen: 'home',
    track,
    level,
    mode: 'round',
    practiceSkill: null,
    round: null,
    index: 0,
    typed: '',
    phase: 'input',
    answers: [],
    hint: false,
    startedAt: 0,
    questionStartedAt: 0,
    finishedAt: null,
  };
}

export type Action =
  | { type: 'restore'; state: SessionState }
  | { type: 'start'; level: LevelId; seed: number; now: number }
  | { type: 'startPractice'; skill: SkillId; seed: number; now: number }
  | { type: 'playAgain'; seed: number; now: number }
  | { type: 'digit'; digit: string; now: number }
  | { type: 'backspace' }
  | { type: 'submit'; now: number }
  | { type: 'next'; now: number }
  | { type: 'hint' }
  | { type: 'home' }
  | { type: 'setLevel'; level: LevelId }
  | { type: 'setTrack'; track: Track };

const MAX_DIGITS = 3;

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'restore':
      return action.state;
    case 'start': {
      const round = generateRound(state.track, action.level, action.seed);
      return {
        ...state,
        screen: 'quiz',
        level: action.level,
        mode: 'round',
        practiceSkill: null,
        round,
        index: 0,
        typed: '',
        phase: 'input',
        answers: [],
        hint: false,
        startedAt: action.now,
        questionStartedAt: action.now,
        finishedAt: null,
      };
    }

    case 'startPractice': {
      const round = generatePractice(action.skill, action.seed);
      return {
        ...state,
        screen: 'quiz',
        track: round.track,
        level: round.level,
        mode: 'practice',
        practiceSkill: action.skill,
        round,
        index: 0,
        typed: '',
        phase: 'input',
        answers: [],
        hint: false,
        startedAt: action.now,
        questionStartedAt: action.now,
        finishedAt: null,
      };
    }

    case 'playAgain': {
      if (!state.round) return state;
      if (state.mode === 'practice' && state.practiceSkill) {
        return reducer(state, {
          type: 'startPractice',
          skill: state.practiceSkill,
          seed: action.seed,
          now: action.now,
        });
      }
      return reducer(state, { type: 'start', level: state.level, seed: action.seed, now: action.now });
    }

    case 'digit': {
      if (state.screen !== 'quiz' || state.phase !== 'input') return state;
      if (state.typed.length >= MAX_DIGITS) return state;
      if (state.typed === '0') return { ...state, typed: action.digit };
      if (state.typed === '' && action.digit === '0') return state;
      return { ...state, typed: state.typed + action.digit };
    }

    case 'backspace': {
      if (state.phase !== 'input') return state;
      return { ...state, typed: state.typed.slice(0, -1) };
    }

    case 'submit': {
      if (state.screen !== 'quiz' || state.phase !== 'input') return state;
      const item = state.round?.items[state.index];
      if (!item || state.typed === '') return state;
      const correct = Number(state.typed) === item.answer;
      const answer: AnswerRecord = {
        itemId: item.id,
        skill: item.skill,
        difficulty: item.difficulty,
        typed: state.typed,
        correct,
        ms: Math.max(0, action.now - state.questionStartedAt),
      };
      return {
        ...state,
        typed: state.typed,
        phase: correct ? 'correct' : 'wrong',
        answers: [...state.answers, answer],
      };
    }

    case 'next': {
      if (state.screen !== 'quiz' || state.phase === 'input') return state;
      const total = state.round?.items.length ?? 0;
      if (state.index + 1 >= total) {
        return { ...state, screen: 'result', finishedAt: action.now };
      }
      return {
        ...state,
        index: state.index + 1,
        typed: '',
        phase: 'input',
        hint: false,
        questionStartedAt: action.now,
      };
    }

    case 'hint':
      return state.screen === 'quiz' ? { ...state, hint: true } : state;

    case 'home':
      return { ...state, screen: 'home', typed: '', phase: 'input', hint: false };

    case 'setLevel':
      return { ...state, level: action.level };

    case 'setTrack':
      return { ...state, track: action.track };

    default:
      return state;
  }
}

/** Consecutive correct answers ending at the current question. */
export function currentStreak(answers: readonly AnswerRecord[]): number {
  let streak = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i]?.correct) streak++;
    else break;
  }
  return streak;
}

export { levelForSkill };
