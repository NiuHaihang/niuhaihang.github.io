import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStudyNavigation } from './studyNavigation';

/** Native Back is asynchronous. Deliberately clamp Y when a list unmounts,
 * just as a browser does when a long page is replaced by a short lesson. */
function browser() {
  const entries: unknown[] = [{ subject: 'math' }, null];
  let index = 1;
  let pending = 0;
  const history = {
    scrollRestoration: 'auto',
    get state() { return entries[index]; },
    replaceState(state: unknown) { entries[index] = state; },
    pushState(state: unknown) { entries.splice(index + 1); entries.push(state); index += 1; },
    back: vi.fn(() => { pending = -1; }),
    forward() { pending = 1; },
  };
  const win = Object.assign(new EventTarget(), {
    history, location: { pathname: '/english/' }, scrollY: 0,
    scrollTo: vi.fn((position: { top: number }) => { win.scrollY = position.top; }),
  });
  vi.stubGlobal('window', win);
  return { win, history, entries, flush() {
    index += pending;
    pending = 0;
    win.dispatchEvent(Object.assign(new Event('popstate'), { state: history.state }));
  } };
}

afterEach(() => vi.unstubAllGlobals());

describe('learning-page browser navigation', () => {
  it('restores the list position only after the destination DOM is committed', () => {
    const { win, history, flush } = browser();
    let view = 'home';
    const navigation = createStudyNavigation({ read: () => view,
      home: () => { view = 'home'; win.scrollY = 0; }, restore: (saved) => { view = saved; } });
    navigation.restoreScroll();
    win.scrollY = 1450;
    navigation.open(() => { view = 'lesson'; win.scrollY = 0; });
    navigation.restoreScroll();
    expect(win.scrollY).toBe(0);
    navigation.back();
    flush();
    expect(view).toBe('home');
    expect(win.scrollY).toBe(0);
    navigation.restoreScroll();
    expect(win.scrollY).toBe(1450);
    navigation.dispose();
    expect(history.scrollRestoration).toBe('auto');
  });

  it('native Back stops at the subject list; questions do not add history entries', () => {
    const { win, history, entries, flush } = browser();
    let view = 'home';
    const home = vi.fn(() => { view = 'home'; });
    const navigation = createStudyNavigation({ read: () => view, home, restore: (saved) => { view = saved; } });
    win.scrollY = 900;
    navigation.open(() => { view = 'learn'; });
    navigation.restoreScroll();
    for (let i = 0; i < 12; i += 1) navigation.open(() => { view = `question-${i}`; });
    expect(entries).toHaveLength(3);
    history.back();
    flush();
    navigation.restoreScroll();
    expect(view).toBe('home');
    expect(win.scrollY).toBe(900);
    // A further intentional Back can still leave this subject normally.
    history.back();
    flush();
    expect(history.state).toEqual({ subject: 'math' });
    expect(home).toHaveBeenCalledTimes(1);
    navigation.dispose();
  });

  it('coalesces repeated return taps and allows Forward to reopen the lesson', () => {
    const { win, history, flush } = browser();
    let view = 'home';
    const navigation = createStudyNavigation({ read: () => view,
      home: () => { view = 'home'; }, restore: (saved) => { view = saved; } });
    navigation.open(() => { view = 'lesson-17'; });
    navigation.restoreScroll();
    win.scrollY = 210;
    navigation.back();
    navigation.back();
    expect(history.back).toHaveBeenCalledTimes(1);
    flush();
    navigation.restoreScroll();
    // Returning to this home document from another subject can emit popstate
    // again. It must not replace the saved lesson with the home screen.
    win.dispatchEvent(Object.assign(new Event('popstate'), { state: history.state }));
    navigation.restoreScroll();
    history.forward();
    flush();
    navigation.restoreScroll();
    expect(view).toBe('lesson-17');
    expect(win.scrollY).toBe(210);
    navigation.dispose();
  });

  it('restores a cached subject document without forcing another React render', () => {
    const { win } = browser();
    const navigation = createStudyNavigation({ read: () => 'home', home: vi.fn(), restore: vi.fn() });
    navigation.restoreScroll();
    win.scrollY = 1250;
    win.dispatchEvent(new Event('pagehide'));
    win.scrollY = 0;
    win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    expect(win.scrollY).toBe(1250);
    navigation.dispose();
  });
});
