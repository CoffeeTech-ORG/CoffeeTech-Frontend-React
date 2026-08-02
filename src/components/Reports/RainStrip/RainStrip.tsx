import React from 'react';
import { ReportData } from '../../../types/report.types';
import { useI18n } from '../../../contexts/I18nContext';
import './RainStrip.scss';

interface RainStripProps {
  data: ReportData[];
}

interface Dia {
  fecha: string;
  /** That day's readings. The honest denominator: the day may be measured only in part. */
  total: number;
  conLluvia: number;
  /** First and last instant with rain detected. */
  desde: Date | null;
  hasta: Date | null;
  /** How many times it started raining: tells a steady afternoon from four separate showers. */
  momentos: number;
}

/**
 * How much it rained each day.
 *
 * A box per day, the unit of the irrigation decision, with duration carried by colour intensity and
 * the label. Duration matters by what the Manager is looking for: for irrigation the engine's rule is
 * 24 h and yes/no is enough; for reading the nutrients or judging rust risk, duration is almost
 * everything -- five minutes does not wash the soil or infect a leaf.
 *
 * The line that is not crossed: the sensor SAMPLES. We do not know it rained twenty minutes; we know
 * eleven readings detected it. If the hub was silent for twenty hours, a "% of the day" would be
 * invented. So the label gives two instants that EXIST ("between 14:10 and 14:32") and the count is
 * against that day's readings, never against the day.
 */
export const RainStrip: React.FC<RainStripProps> = ({ data }) => {
  const { t } = useI18n();

  const porDia = new Map<string, Dia>();
  let previaLlovia = false;
  let diaPrevio = '';

  [...data]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach((row) => {
      const d = new Date(row.timestamp);
      if (Number.isNaN(d.getTime())) return;
      const clave = d.toISOString().slice(0, 10);
      const llovio =
        row.precipitationDetected === 1 ||
        row.precipitationDetected === true ||
        row.precipitationDetected === '1';

      const dia =
        porDia.get(clave) ??
        { fecha: clave, total: 0, conLluvia: 0, desde: null, hasta: null, momentos: 0 };

      dia.total += 1;
      if (llovio) {
        dia.conLluvia += 1;
        if (dia.desde === null) dia.desde = d;
        dia.hasta = d;
        // A new spell starts when the previous reading was dry (or it is another day).
        if (!previaLlovia || clave !== diaPrevio) dia.momentos += 1;
      }

      porDia.set(clave, dia);
      previaLlovia = llovio;
      diaPrevio = clave;
    });

  const dias = [...porDia.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (dias.length === 0) return null;

  const diasConLluvia = dias.filter((d) => d.conLluvia > 0).length;
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  // 24 h on purpose: the chart tooltip uses dayjs with `HH:mm`, and the same rain cannot read as
  // "15:40" above and "03:40 p. m." here.
  const hora = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

  /**
   * Three steps, not a continuous gradient: the eye does not tell 12 % from 15 % opacity, and here it
   * only needs to answer "a little or a lot?". The exact detail is in the label.
   */
  const paso = (dia: Dia): 0 | 1 | 2 | 3 => {
    if (dia.conLluvia === 0 || dia.total === 0) return 0;
    const parte = dia.conLluvia / dia.total;
    if (parte <= 0.1) return 1;
    if (parte <= 0.35) return 2;
    return 3;
  };

  const etiqueta = (dia: Dia): string => {
    if (dia.conLluvia === 0 || !dia.desde || !dia.hasta) {
      return `${fmt(dia.fecha)} · ${t('reports.rain.none')}`;
    }
    const cuando =
      dia.momentos > 1
        ? t('reports.rain.spells', {
            n: dia.momentos,
            from: hora(dia.desde),
            to: hora(dia.hasta),
          })
        : t('reports.rain.between', { from: hora(dia.desde), to: hora(dia.hasta) });
    return `${fmt(dia.fecha)} · ${cuando}\n${t('reports.rain.readings', {
      rainy: dia.conLluvia,
      total: dia.total,
    })}`;
  };

  return (
    <section className="rain-strip">
      <header className="rain-strip__head">
        <span className="rain-strip__title">
          <i className="rain-strip__dot" aria-hidden="true" />
          {t('cardData.precipitation')}
        </span>
        <span className="rain-strip__meta">
          {t('reports.rain.summary', { rained: diasConLluvia, total: dias.length })}
        </span>
      </header>

      <div className="rain-strip__days">
        {dias.map((d) => (
          <span
            key={d.fecha}
            className={`rain-strip__day rain-strip__day--${paso(d)}`}
            title={etiqueta(d)}
          >
            <span className="sr-only">{etiqueta(d).replace('\n', '. ')}</span>
          </span>
        ))}
      </div>

      <div className="rain-strip__axis">
        <span>{fmt(dias[0].fecha)}</span>
        {dias.length > 1 && <span>{fmt(dias[dias.length - 1].fecha)}</span>}
      </div>
    </section>
  );
};
