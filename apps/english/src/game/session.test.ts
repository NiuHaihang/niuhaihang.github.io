import { describe, expect, it } from 'vitest';
import { lessonsFor } from '../content';
import { buildLesson } from './exercise';
import { initialState, reducer, summarize } from './session';
import { claimStars, emptyCollection } from '../lib/starCollection';

describe('adventure rewards from actual session answers', () => {
  it('defaults to learning and enters a challenge only when explicitly selected', () => {
    const lesson = lessonsFor(3, 'grammar')[0]!;
    const exercises = buildLesson(lesson, 7);
    const action = { type: 'start', lessonId: lesson.id, lessonTitle: lesson.title, exercises, now: 1 } as const;
    expect(reducer(initialState(), action).mode).toBe('lesson');
    let state = reducer(initialState(), { ...action, mode: 'challenge' });
    expect(state.mode).toBe('challenge');
    state = reducer(state, { type: 'again', exercises, now: 2 });
    expect(state.mode).toBe('challenge');
    expect(reducer(state, action).mode).toBe('lesson');
  });

  it('counts only the first answer, and awards effort after a whole round', () => {
    const lesson = lessonsFor(3, 'grammar')[0]!;
    const exercises = buildLesson(lesson, 7);
    let state = reducer(initialState(), { type: 'start', lessonId: lesson.id, lessonTitle: lesson.title, exercises, now: 1 });
    for (let i = 0; i < exercises.length; i += 1) {
      state = reducer(state, { type: 'answer', value: 'attempt', correct: i !== 0, now: i * 10 + 2 });
      // Trying again after feedback must not turn the first miss into a star.
      state = reducer(state, { type: 'answer', value: 'retry', correct: true, now: i * 10 + 3 });
      state = reducer(state, { type: 'next', now: i * 10 + 4 });
    }
    const summary = summarize(state);
    expect(state.screen).toBe('result');
    expect(summary.total).toBe(exercises.length);
    expect(summary.correct).toBe(exercises.length - 1);
    expect(claimStars(emptyCollection(), 'english', 'lesson-round', summary.correct).total).toBe(exercises.length);
  });

  it('can replay a completed review with the same challenges and no old answers', () => {
    const lesson = lessonsFor(3, 'grammar')[0]!;
    const exercises = buildLesson(lesson, 7).slice(0, 1);
    let state = reducer(initialState(), { type: 'start', mode: 'review', lessonId: 'review', lessonTitle: 'Review', exercises, now: 1 });
    state = reducer(state, { type: 'answer', value: 'answer', correct: true, now: 2 });
    state = reducer(state, { type: 'next', now: 3 });
    const first = claimStars(emptyCollection(), 'english', 'review-1', summarize(state).correct);
    state = reducer(state, { type: 'again', exercises: state.exercises, now: 4 });
    expect(state.screen).toBe('lesson');
    expect(state.mode).toBe('review');
    expect(state.answers).toEqual([]);
    expect(state.exercises).toHaveLength(1);
    state = reducer(state, { type: 'answer', value: 'answer', correct: true, now: 5 });
    state = reducer(state, { type: 'next', now: 6 });
    expect(claimStars(first, 'english', 'review-2', summarize(state).correct).total).toBe(4);
  });
});
