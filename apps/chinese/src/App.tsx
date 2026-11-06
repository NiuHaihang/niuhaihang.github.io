import { useState } from 'react';
import { CHARACTER_BY_ID, type Character, type Unit } from './content';
import { buildRound, type Answer, type Question } from './game';
import { completeRound, loadProgress, saveProgress, type Progress } from './lib/storage';
import { randomSeed } from '../../english/src/game/rng';
import { Home } from './components/Home';
import { Learn } from './components/Learn';
import { Quiz } from './components/Quiz';
import { Result } from './components/Result';
import { useStudyNavigation } from '../../english/src/lib/useStudyNavigation';

type View =
  | { screen: 'home' }
  | { screen: 'learn'; unit: Unit }
  | { screen: 'quiz'; questions: Question[]; unit?: Unit }
  | { screen: 'result'; questions: Question[]; answers: Answer[]; unit?: Unit };

export function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [view, setView] = useState<View>({ screen: 'home' });
  const [page, setPage] = useState(0);
  const navigation = useStudyNavigation(view, () => setView({ screen: 'home' }), setView);

  // Save during the action so immediately following another subject link cannot
  // leave before a deferred React effect has persisted the new preference.
  function updateProgress(next: Progress) {
    saveProgress(next);
    setProgress(next);
  }

  function startQuiz(characters: Character[], unit?: Unit) {
    navigation.open(() => setView({ screen: 'quiz', questions: buildRound(characters, randomSeed()), unit }));
  }

  return (
    <main className="app app-chinese">
      {view.screen === 'home' ? (
        <Home
          key={`${progress.grade}-${progress.term}`}
          progress={progress}
          page={page}
          onPage={setPage}
          onTerm={(term) => { setPage(0); updateProgress({ ...progress, term }); }}
          onGrade={(grade) => { setPage(0); updateProgress({ ...progress, grade }); }}
          onStart={(unit) => navigation.open(() => setView({ screen: 'learn', unit }))}
          onReview={() => startQuiz(progress.mistakes.slice(0, 6).map((char) => CHARACTER_BY_ID[char]!))}
          onToggleSound={() => updateProgress({ ...progress, sound: !progress.sound })}
        />
      ) : null}
      {view.screen === 'learn' ? (
        <Learn
          unit={view.unit}
          sound={progress.sound}
          onHome={navigation.back}
          onQuiz={() => startQuiz(view.unit.characters, view.unit)}
        />
      ) : null}
      {view.screen === 'quiz' ? (
        <Quiz
          questions={view.questions}
          sound={progress.sound}
          onHome={navigation.back}
          onFinish={(answers) => {
            // Exiting an unfinished round never changes the saved learning record.
            updateProgress(completeRound(progress, view.questions, answers, view.unit?.id));
            navigation.open(() => setView({ ...view, screen: 'result', answers }));
          }}
        />
      ) : null}
      {view.screen === 'result' ? (
        <Result
          title={view.unit?.title ?? '错字复习'}
          isReview={!view.unit}
          questions={view.questions}
          answers={view.answers}
          sound={progress.sound}
          onHome={navigation.back}
          onReview={(characters) => startQuiz(characters)}
          onAgain={() => {
            if (view.unit) navigation.open(() => setView({ screen: 'learn', unit: view.unit! }));
            else startQuiz([...new Map(view.questions.map((question) => [question.target.id, question.target])).values()]);
          }}
        />
      ) : null}
    </main>
  );
}
