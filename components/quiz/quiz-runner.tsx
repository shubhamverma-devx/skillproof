'use client';

import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { postJson } from '@/lib/client/api';
import { cn, formatPercent } from '@/lib/utils';
import type { QuizAnswerResponse, QuizStartResponse } from '@/types/api';
import type { ClientQuizQuestion } from '@/types/domain';
import { QuizResult } from './quiz-result';

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

type Feedback = { correct: boolean; correct_index: number; explanation: string };

export function QuizRunner({ profileId, skill }: { profileId: string; skill: string }) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [question, setQuestion] = useState<ClientQuizQuestion | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<ClientQuizQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [result, setResult] = useState<QuizAnswerResponse['result']>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const response = await postJson<QuizStartResponse>(`/api/quiz/${profileId}/start`, { skill });
      if ('error' in response) {
        setError(response.error);
        return;
      }
      setAttemptId(response.data.attempt_id);
      setQuestion(response.data.question);
      setPreviousScore(response.data.previous_score);
    })();
  }, [profileId, skill]);

  async function submitAnswer() {
    if (selected === null || !attemptId) return;
    setBusy(true);
    const response = await postJson<QuizAnswerResponse>(`/api/quiz/${profileId}/answer`, {
      attempt_id: attemptId,
      answer_index: selected,
    });
    setBusy(false);

    if ('error' in response) {
      toast.error(response.error);
      return;
    }

    setFeedback({
      correct: response.data.correct,
      correct_index: response.data.correct_index,
      explanation: response.data.explanation,
    });
    setResult(response.data.result);
    // The next question is held back until the student has read the explanation,
    // otherwise the options under the feedback would already have changed.
    setPendingQuestion(response.data.next);
  }

  function continueToNext() {
    if (pendingQuestion) {
      setQuestion(pendingQuestion);
      setPendingQuestion(null);
    }
    setFeedback(null);
    setSelected(null);
  }

  if (error) {
    return (
      <Panel className="px-5 py-6">
        <h2 className="text-lg">This quiz cannot start</h2>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">{error}</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link href={`/dashboard/${profileId}`}>Back to dashboard</Link>
        </Button>
      </Panel>
    );
  }

  if (result && !feedback) {
    return <QuizResult profileId={profileId} skill={skill} result={result} />;
  }

  if (!question) {
    return (
      <Panel className="px-5 py-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-6 w-full" />
        <div className="mt-5 space-y-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </Panel>
    );
  }

  const showingFeedback = feedback !== null;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
        <div>
          <p className="tabular text-sm text-ink-muted">
            Question {question.index} of {question.total}
          </p>
          <h2 className="text-lg">{skill}</h2>
        </div>
        <div className="flex items-center gap-3">
          {previousScore !== null ? (
            <span className="tabular text-sm text-ink-muted">
              Last attempt {formatPercent(previousScore)}
            </span>
          ) : null}
          <span className="rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-sm">
            {DIFFICULTY_LABEL[question.difficulty]}
          </span>
        </div>
      </div>

      <div className="px-5 py-5">
        <p data-question className="max-w-prose text-base">
          {question.question}
        </p>

        <RadioGroup
          className="mt-5"
          // An empty string keeps the group controlled while nothing is picked.
          // Passing undefined hands control back to Radix, which then remembers
          // the previous question's choice and swallows the next click on that
          // same option, leaving the submit button stuck as disabled.
          value={selected === null ? '' : String(selected)}
          onValueChange={(value) => setSelected(Number(value))}
          disabled={showingFeedback}
          aria-label="Answer options"
        >
          {question.options.map((option, index) => {
            const isCorrect = showingFeedback && index === feedback.correct_index;
            const isWrongPick = showingFeedback && index === selected && !feedback.correct;
            return (
              <label
                key={option}
                // Without htmlFor only the small radio circle is clickable, so
                // the whole option row would look interactive but not be.
                htmlFor={`option-${index}`}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-control border px-4 py-3',
                  selected === index && !showingFeedback && 'border-accent bg-accent/[0.05]',
                  isCorrect && 'border-verified bg-verified-soft/[0.08]',
                  isWrongPick && 'border-danger bg-danger/[0.07]',
                  showingFeedback && 'cursor-default',
                )}
              >
                <RadioGroupItem value={String(index)} id={`option-${index}`} className="mt-0.5" />
                <span className="flex-1 text-sm">{option}</span>
                {isCorrect ? (
                  <Check size={16} className="mt-0.5 text-verified" aria-hidden="true" />
                ) : null}
                {isWrongPick ? (
                  <X size={16} className="mt-0.5 text-danger" aria-hidden="true" />
                ) : null}
              </label>
            );
          })}
        </RadioGroup>

        {showingFeedback ? (
          <div
            className={cn(
              'mt-4 rounded-control px-4 py-3 text-sm',
              feedback.correct ? 'bg-verified-soft/[0.09]' : 'bg-claimed-soft/[0.1]',
            )}
            aria-live="polite"
          >
            <p className="font-medium">{feedback.correct ? 'Correct' : 'Not quite'}</p>
            <p className="mt-1 max-w-prose">{feedback.explanation}</p>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end border-t px-5 py-4">
        {showingFeedback ? (
          <Button onClick={continueToNext}>{result ? 'See your result' : 'Next question'}</Button>
        ) : (
          <Button onClick={submitAnswer} disabled={selected === null || busy}>
            {busy ? 'Checking' : 'Submit answer'}
          </Button>
        )}
      </div>
    </Panel>
  );
}
