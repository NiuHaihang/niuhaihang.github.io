import { useState } from 'react';
import type { Poem } from './content';
import { completeRound, KEY, loadProgress, type Progress } from './lib/storage';
import { Home } from './components/Home';
import { PoemStudy } from './components/PoemStudy';
import { PoemQuiz } from './components/PoemQuiz';

type View = { screen: 'home' } | { screen: 'study' | 'quiz'; poem: Poem };

export function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [view, setView] = useState<View>({ screen: 'home' });

  function update(next: Progress) {
    localStorage.setItem(KEY, JSON.stringify(next));
    setProgress(next);
  }

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0 });
  }

  return <main className="app app-poetry">
    {view.screen === 'home' ? <Home progress={progress}
      onGrade={(grade) => update({ ...progress, grade })}
      onToggleSound={() => update({ ...progress, sound: !progress.sound })}
      onStart={(poem) => navigate({ screen: 'study', poem })} /> : null}
    {view.screen === 'study' ? <PoemStudy key={view.poem.id} poem={view.poem} sound={progress.sound}
      onHome={() => navigate({ screen: 'home' })}
      onQuiz={() => navigate({ screen: 'quiz', poem: view.poem })} /> : null}
    {view.screen === 'quiz' ? <PoemQuiz poem={view.poem}
      onHome={() => navigate({ screen: 'home' })}
      onStudy={() => navigate({ screen: 'study', poem: view.poem })}
      onFinish={(correct, total) => update(completeRound(progress, view.poem.id, correct, total))} /> : null}
  </main>;
}
