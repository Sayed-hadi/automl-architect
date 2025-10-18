
export type WorkflowState = 'IDLE' | 'FILE_UPLOADED' | 'ANALYZING' | 'DONE' | 'ERROR';

export type ProblemType = 'CLASSIFICATION' | 'REGRESSION';

export interface ClassificationMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
}

export interface RegressionMetrics {
  mae?: number;
  mse?: number;
  r_squared?: number;
}

export interface Evaluation {
  metrics: ClassificationMetrics | RegressionMetrics;
  confusionMatrix?: number[][];
  classLabels?: string[];
  scatterPlotData?: { actual: number; predicted: number }[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface AutoMLResults {
  problemType: ProblemType;
  analysisSummary: string;
  selectedModel: string;
  evaluation: Evaluation;
  featureImportance: FeatureImportance[];
  pythonCode: string;
}
