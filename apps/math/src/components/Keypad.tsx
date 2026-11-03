import { useI18n } from '../i18n/I18nProvider';
import type { Phase } from '../game/session';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  onNext: () => void;
  phase: Phase;
  canSubmit: boolean;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function Keypad({ onDigit, onBackspace, onSubmit, onNext, phase, canSubmit }: KeypadProps) {
  const { t } = useI18n();
  const done = phase !== 'input';

  return (
    <div className="keypad" role="group" aria-label={t('aria.keypad')}>
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          className="key key--digit"
          onClick={() => onDigit(digit)}
          disabled={done}
          aria-label={digit}
        >
          {digit}
        </button>
      ))}

      <button
        type="button"
        className="key key--back"
        onClick={onBackspace}
        disabled={done}
        aria-label={t('aria.backspace')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9L2 12l7-7Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 9.5 17 14.5M17 9.5 12 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <button type="button" className="key key--digit" onClick={() => onDigit('0')} disabled={done} aria-label="0">
        0
      </button>

      {done ? (
        <button type="button" className="key key--go" onClick={onNext} aria-label={t('aria.next')}>
          {t('quiz.next')}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          className="key key--go"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label={t('aria.check')}
        >
          {t('quiz.check')}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5 10 17.5 19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
