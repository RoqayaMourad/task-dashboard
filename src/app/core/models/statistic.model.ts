export type ChangeType = 'positive' | 'negative' | 'neutral';

export interface Statistic {
  id: string;
  title: string;
  /** Literal emoji character in the source data (e.g. "📊"), not an icon-library key. */
  icon: string;
  value: number;
  change: string;
  changeLabel: string;
  changeType: ChangeType;
  /** Raw hex string, e.g. "#1976D2". */
  color: string;
}
