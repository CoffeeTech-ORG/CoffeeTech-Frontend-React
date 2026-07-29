/**
 * The section verdict: the answer that goes at the TOP of the screen. It reduces the diagnosis to
 * one sentence, and to a step-by-step when there is something to apply, so the user does not read
 * the whole card list to answer "is there anything to attend to today?".
 *
 * NO agronomy is written here. The engine publishes no headline or steps, so the headline is the
 * FIRST sentence of the most severe item's `farmer_message`, and the steps QUOTE `action.product`,
 * `action.dose`, `action.method_label` and `action.timing` joined by connectors from i18n. No
 * product means no steps and no CTA: inventing an action to fill the gap destroys trust faster
 * than saying nothing.
 *
 * No React logic on purpose, so it can be read at a glance and tested on its own.
 */
import {
  RecItem,
  RecPayload,
  Severity,
  cap,
  diagnosisItems,
  reminderItems,
} from './recommendationPayload';
import { StatusTone, toneFor } from '../../styles/statusTokens';

export type VerdictState =
  /** At least one item above `info`: something needs attention. */
  | 'attention'
  /** The engine diagnosed and found nothing to attend to. */
  | 'allgood'
  /** The engine answered with no items (`empty_message`). */
  | 'empty'
  /** A record older than the JSON: plain text that cannot be interpreted. */
  | 'legacy';

/**
 * When the steps are NOT a firm instruction. The engine says so in `actionability` and
 * `provisional`; the verdict carries it through so the step-by-step does not read as an order
 * when something has to be confirmed first.
 */
export type VerdictContingency = 'referential' | 'coordinate' | 'confirm' | null;

export interface SectionVerdict {
  state: VerdictState;
  /** How many things need attention today. 0 in the other states. */
  count: number;
  tone: StatusTone;
  severity: Severity | null;
  /** First sentence of the farmer message; the rest goes in `body`. */
  headline: string;
  body: string;
  /** Step-by-step, already translated. Empty when the engine gives no product. */
  steps: string[];
  contingency: VerdictContingency;
  /** What to check first, as the engine words it. */
  verification: string | null;
  /** The governing item; the one the headline rests on. */
  top: RecItem | null;
  /** The nearest reminder, for the "Lo próximo" block of the calm state. */
  next: RecItem | null;
}

export const contingencyOf = (item: RecItem | null): VerdictContingency => {
  if (!item?.action?.product) return null;
  if (item.provisional) return 'referential';
  if (item.actionability === 'consult') return 'coordinate';
  if (item.actionability === 'verify') return 'confirm';
  return null;
};

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Splits the message into headline (first sentence) and body (the rest). Cuts at period + space
 * only when what follows starts uppercase, so decimals ("El fósforo está bajo (12.4)") do not
 * break.
 */
export const splitFirstSentence = (text: string): { headline: string; body: string } => {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return { headline: '', body: '' };

  const match = /\.\s+(?=[¡¿"«A-ZÁÉÍÓÚÑ])/.exec(trimmed);
  if (!match) return { headline: trimmed, body: '' };

  const cut = match.index + 1;
  return {
    headline: trimmed.slice(0, cut).trim(),
    body: trimmed.slice(cut).trim(),
  };
};

/**
 * Steps derived from the engine's action. Each quotes a field; none adds judgement. The
 * disclaimer is not here: it is a technical note and lives in the agronomist detail.
 */
export const stepsFromAction = (item: RecItem | null, t: Translate): string[] => {
  const action = item?.action;
  if (!action?.product) return [];

  const steps: string[] = [t('section.verdict.step.get', { product: action.product })];

  if (action.dose) {
    steps.push(
      action.method_label
        ? t('section.verdict.step.applyWithMethod', {
            dose: action.dose,
            method: action.method_label,
          })
        : t('section.verdict.step.apply', { dose: action.dose })
    );
  }

  if (action.timing) {
    steps.push(t('section.verdict.step.timing', { timing: action.timing }));
  }

  return steps;
};

/** Short subject label for an item ("Potasio", "Broca"), for chips and "Lo próximo". */
export const subjectLabel = (item: RecItem): string => cap(item.subject || item.type_label);

export const buildVerdict = (
  payload: RecPayload | null,
  t: Translate,
  hasLegacyText = false
): SectionVerdict => {
  const base: SectionVerdict = {
    state: 'legacy',
    count: 0,
    tone: 'neutral',
    severity: null,
    headline: '',
    body: '',
    steps: [],
    contingency: null,
    verification: null,
    top: null,
    next: null,
  };

  if (!payload) {
    return { ...base, state: hasLegacyText ? 'legacy' : 'empty' };
  }

  const reminders = reminderItems(payload);
  const next = reminders[0] ?? null;

  if (payload.items.length === 0) {
    return {
      ...base,
      state: 'empty',
      tone: 'neutral',
      headline: payload.empty_message || t('recommendations.noAvailable'),
      next,
    };
  }

  const diagnosis = diagnosisItems(payload);
  const attention = diagnosis.filter((i) => i.severity !== 'info');

  if (attention.length === 0) {
    return {
      ...base,
      state: 'allgood',
      tone: 'ok',
      headline: t('section.verdict.allGood.headline'),
      next,
    };
  }

  const top = attention[0];
  const { headline, body } = splitFirstSentence(top.farmer_message);

  return {
    state: 'attention',
    count: attention.length,
    // `inOptimal` is false by definition here: if something needs attention, it is out of band.
    tone: toneFor(top.severity, false),
    severity: top.severity,
    headline,
    body,
    steps: stepsFromAction(top, t),
    contingency: contingencyOf(top),
    verification: top.verification ?? null,
    top,
    next,
  };
};
