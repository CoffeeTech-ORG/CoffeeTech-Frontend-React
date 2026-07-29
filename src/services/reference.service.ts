/**
 * The agronomic reference ranges the model publishes. They come from the engine
 * (`GET /reference-ranges`), which derives them from its own literature-anchored bands, rather than
 * a table hard-coded in the chart -- a separate copy drifts and paints "out of range" a 130 mg/kg
 * potassium the diagnosis calls adequate.
 *
 * If the model does not answer, this returns null and the chart is drawn WITHOUT bands: a chart
 * with no reference is honest, one with the wrong reference is not.
 */

const MODEL_BASE_URL = import.meta.env.VITE_MODEL_SERVICE_URL;

export type GrowthStage =
  | 'plantula'
  | 'vegetativo'
  | 'floracion'
  | 'fructificacion'
  | 'maduracion'
  | 'cosecha';

export interface ReferenceBand {
  from: number;
  to: number;
  label: string;
  label_es: string;
  severity: 'info' | 'warning' | 'alert' | 'critical';
}

export interface ReferenceThreshold {
  above?: number;
  below?: number;
  severity: 'info' | 'warning' | 'alert' | 'critical';
  /** Short label, for the chart (the full phrase does not fit and overlaps the others). */
  short_es: string;
  /** Full explanation, for a tooltip or legend. */
  label_es: string;
}

export interface ReferenceMetric {
  /** band = has an optimal range; threshold = risk thresholds only; relative = no fixed band. */
  kind: 'band' | 'threshold' | 'relative';
  unit: string;
  optimal: [number, number] | null;
  domain?: [number, number];
  bands?: ReferenceBand[];
  thresholds?: ReferenceThreshold[];
  /** The engine marks an untraceable proxy (N) this way: drawn as provisional. */
  provisional?: boolean;
  note?: string;
}

export interface ReferenceRanges {
  version: string;
  engine: string;
  stage: GrowthStage | null;
  metrics: {
    N: ReferenceMetric;
    P: ReferenceMetric;
    K: ReferenceMetric;
    temperature: ReferenceMetric;
    air_humidity: ReferenceMetric;
    soil_humidity: ReferenceMetric;
  };
}

/**
 * The backend stores the stage as a display name ("Maduración", "Plántula"). The model expects it
 * without accents and in lowercase.
 */
export const normalizeGrowthStage = (
  displayName?: string
): GrowthStage | undefined => {
  if (!displayName) return undefined;
  const slug = displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const valid: GrowthStage[] = [
    'plantula',
    'vegetativo',
    'floracion',
    'fructificacion',
    'maduracion',
    'cosecha',
  ];
  return valid.find((stage) => stage === slug);
};

export const referenceService = {
  /**
   * Returns the engine ranges, or null if the model is unavailable. Never throws: a missing
   * reference must not break the report.
   */
  async getReferenceRanges(
    stage?: GrowthStage
  ): Promise<ReferenceRanges | null> {
    if (!MODEL_BASE_URL) {
      console.info(
        'VITE_MODEL_SERVICE_URL no configurado: el gráfico se dibuja sin rangos de referencia.'
      );
      return null;
    }

    try {
      const url = new URL(`${MODEL_BASE_URL}/reference-ranges`);
      if (stage) url.searchParams.set('stage', stage);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as ReferenceRanges;
    } catch (error) {
      console.warn(
        'No se pudieron cargar los rangos de referencia del modelo; el gráfico se dibuja sin franjas.',
        error
      );
      return null;
    }
  },
};
