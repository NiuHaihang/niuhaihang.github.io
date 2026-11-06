interface Callbacks<T> {
  read: () => T;
  home: () => void;
  restore: (view: T) => void;
}

/** One browser-history entry per learning visit. Questions and results belong
 * to that visit, so Back exits the lesson rather than replaying every answer. */
export function createStudyNavigation<T>({ read, home, restore }: Callbacks<T>) {
  const { history } = window;
  const app = window.location.pathname;
  const id = crypto.randomUUID();
  const previous = history.state?.bunnyStudy;
  let homeY = previous?.app === app ? previous.homeY : window.scrollY;
  let detailY = 0;
  let detail = false;
  let lastView: T;
  let pendingBack = false;
  let scroll: number | null = homeY;
  const originalRestoration = history.scrollRestoration;
  history.scrollRestoration = 'manual';

  const marker = (isDetail: boolean) => ({ app, id, detail: isDetail, homeY });
  history.replaceState({ ...history.state, bunnyStudy: marker(false) }, '');

  function onPop(event: PopStateEvent) {
    const entry = event.state?.bunnyStudy;
    // Other documents/subjects own their own history and must remain navigable.
    if (entry?.id !== id) return;
    pendingBack = false;
    if (entry.detail) {
      detail = true;
      scroll = detailY;
      restore(lastView);
    } else {
      if (detail) {
        lastView = read();
        detailY = window.scrollY;
      }
      detail = false;
      scroll = homeY;
      home();
    }
  }

  function onPageHide() {
    if (detail) detailY = window.scrollY;
    else homeY = window.scrollY;
    history.replaceState({ ...history.state, bunnyStudy: marker(detail) }, '');
  }

  function onPageShow(event: PageTransitionEvent) {
    // A restored document already has its DOM; React need not render again.
    if (event.persisted) window.scrollTo({ top: detail ? detailY : homeY });
  }

  window.addEventListener('popstate', onPop);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);

  return {
    open(action: () => void) {
      if (!detail) {
        // Capture before React replaces the long list and the browser clamps Y.
        homeY = window.scrollY;
        history.replaceState({ ...history.state, bunnyStudy: marker(false) }, '');
        history.pushState({ bunnyStudy: marker(true) }, '');
        detail = true;
      }
      scroll = 0;
      action();
    },
    back() {
      // Repeated taps before popstate must not skip the subject's list entry.
      if (pendingBack) return;
      pendingBack = true;
      history.back();
    },
    restoreScroll() {
      // Called after React commits the destination, when the long list exists.
      if (scroll === null) return;
      window.scrollTo({ top: scroll });
      scroll = null;
    },
    dispose() {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      history.scrollRestoration = originalRestoration;
    },
  };
}
