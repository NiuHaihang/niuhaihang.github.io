import type { Grade, Topic } from '../content/types';
import type { Exercise } from './exercise';

export type Screen = 'home' | 'lesson' | 'result';
export type Phase = 'ask' | 'right' | 'wrong';

export interface AnswerRecord {
  exerciseId: string;
  kind: Exercise['kind'];
  correct: boolean;
  ms: number;
  /** What the child actually put in, for the "look again" list. */
  submitted: string;
}

export interface SessionState {
  screen: Screen;
  grade: Grade;
  topic: Topic;
  /** A normal lesson banks stars; review does not (it is revision). */
  mode: 'lesson' | 'review';
  lessonId: string;
  lessonTitle: string;
  exercises: Exercise[];
  index: number;
  phase: Phase;
  /** What the child last submitted (a word, a sentence, a match marker). */
  submitted: string;
  answers: AnswerRecord[];
  startedAt: number;
  questionStartedAt: number;
  finishedAt: number | null;
}

export type Action =
  | { type: 'setGrade'; grade: Grade }
  | { type: 'setTopic'; topic: Topic }
  | {
      type: 'start';
      mode?: 'lesson' | 'review';
      lessonId: string;
      lessonTitle: string;
      exercises: Exercise[];
      now: number;
    }
  | { type: 'answer'; value: string; correct: boolean; now: number }
  | { type: 'next'; now: number }
  | { type: 'again'; exercises: Exercise[]; now: number }
  | { type: 'home' };

export function initialState(grade: Grade = 3, topic: Topic = 'words'): SessionState {
  return {
    screen: 'home',
    grade,
    topic,
    mode: 'lesson',
    lessonId: '',
    lessonTitle: '',
    exercises: [],
    index: 0,
    phase: 'ask',
    submitted: '',
    answers: [],
    startedAt: 0,
    questionStartedAt: 0,
    finishedAt: null,
  };
}

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'setGrade':
      return { ...state, grade: action.grade };
    case 'setTopic':
      return { ...state, topic: action.topic };
    case 'start':
      return {
        ...state,
        screen: 'lesson',
        mode: action.mode ?? 'lesson',
        lessonId: action.lessonId,
        lessonTitle: action.lessonTitle,
        exercises: action.exercises,
        index: 0,
        phase: 'ask',
        submitted: '',
        answers: [],
        startedAt: action.now,
        questionStartedAt: action.now,
        finishedAt: null,
      };
    case 'answer': {
      if (state.phase !== 'ask') return state;
      const exercise = state.exercises[state.index];
      if (!exercise) return state;
      const record: AnswerRecord = {
        exerciseId: exercise.id,
        kind: exercise.kind,
        correct: action.correct,
        ms: action.now - state.questionStartedAt,
        submitted: action.value,
      };
      return {
        ...state,
        phase: action.correct ? 'right' : 'wrong',
        submitted: action.value,
        answers: [...state.answers, record],
      };
    }
    case 'next': {
      const index = state.index + 1;
      if (index >= state.exercises.length) {
        return { ...state, screen: 'result', finishedAt: action.now, phase: 'ask', submitted: '' };
      }
      return { ...state, index, phase: 'ask', submitted: '', questionStartedAt: action.now };
    }
    case 'again':
      return {
        ...state,
        screen: 'lesson',
        exercises: action.exercises,
        index: 0,
        phase: 'ask',
        submitted: '',
        answers: [],
        startedAt: action.now,
        questionStartedAt: action.now,
        finishedAt: null,
      };
    case 'home':
      return { ...state, screen: 'home', exercises: [], index: 0, phase: 'ask', submitted: '' };
  }
}

export interface Summary {
  correct: number;
  total: number;
  accuracy: number;
  stars: number;
  ms: number;
  missed: AnswerRecord[];
}

export function starsFor(accuracy: number): number {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  return 1;
}

export function summarize(state: SessionState): Summary {
  const total = state.answers.length;
  const correct = state.answers.filter((a) => a.correct).length;
  const accuracy = total === 0 ? 0 : correct / total;
  return {
    correct,
    total,
    accuracy,
    stars: starsFor(accuracy),
    ms: (state.finishedAt ?? 0) - state.startedAt,
    missed: state.answers.filter((a) => !a.correct),
  };
}
