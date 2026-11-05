import { useState } from 'react';
import { POEMS, type Poem } from './content';
import { completeRound, completeStudy, KEY, loadProgress, type Progress } from './lib/storage';
import { Home } from './components/Home';
import { PoemStudy } from './components/PoemStudy';
import { PoemQuiz } from './components/PoemQuiz';
import { useStarCollection } from '../../english/src/lib/useStarCollection';

type View = { screen: 'home' } | { screen: 'study' | 'quiz'; poem: Poem };

export function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [view, setView] = useState<View>({ screen: 'home' });
  const [round, setRound] = useState(0);
  const collection = useStarCollection('poetry', Object.values(progress.stars).reduce((sum, stars) => sum + stars, 0));

  function update(next: Progress) {
    localStorage.setItem(KEY, JSON.stringify(next));
    setProgress(next);
  }

  function navigate(next: View) {
    if (next.screen === 'quiz') setRound((previous) => previous + 1);
    setView(next);
    window.scrollTo({ top: 0 });
  }

  return <main className="app app-poetry">
    {view.screen === 'home' ? <Home progress={progress} totalStars={collection.total}
      onGrade={(grade) => update({ ...progress, grade })}
      onToggleSound={() => update({ ...progress, sound: !progress.sound })}
      onStudy={(poem) => navigate({ screen: 'study', poem })}
      onQuiz={(poem) => navigate({ screen: 'quiz', poem })} /> : null}
    {view.screen === 'study' ? <PoemStudy key={view.poem.id} poem={view.poem} sound={progress.sound}
      onHome={() => navigate({ screen: 'home' })}
      onComplete={() => {
        update(completeStudy(progress, view.poem.id));
        navigate({ screen: 'home' });
      }}
      onQuiz={() => navigate({ screen: 'quiz', poem: view.poem })} /> : null}
    {view.screen === 'quiz' ? <PoemQuiz key={round} poem={view.poem} totalStars={collection.total}
      onHome={() => navigate({ screen: 'home' })}
      onStudy={() => navigate({ screen: 'study', poem: view.poem })}
      onAgain={() => navigate({ screen: 'quiz', poem: view.poem })}
      onNext={() => {
        const poems = POEMS.filter((poem) => progress.grade === 0 || poem.grade === progress.grade);
        const next = poems[(poems.findIndex((poem) => poem.id === view.poem.id) + 1) % poems.length]!;
        navigate({ screen: 'quiz', poem: next });
      }}
      onFinish={(correct, total, token) => {
        const savedTotal = collection.claim(token, correct);
        update(completeRound(progress, view.poem.id, correct, total));
        return savedTotal;
      }} /> : null}
  </main>;
}
