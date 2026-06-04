export interface DailyMetricPoint {
  date: string;
  value: number;
}

export interface OverviewMetrics {
  deploymentFrequency: number;
  leadTimeHours: number;
  changeFailureRate: number;
  deploymentFrequencyTrend: number;
  leadTimeTrend: number;
  changeFailureRateTrend: number;
  timeSeries: {
    date: string;
    deploymentFrequency: number;
    leadTimeHours: number;
    changeFailureRate: number;
  }[];
}

export interface PrMetrics {
  totalMerged: number;
  avgPrSize: number;
  percentMergedWithin24h: number;
  cycleTimeTrend: DailyMetricPoint[];
  prsOpenedVsMerged: {
    date: string;
    opened: number;
    merged: number;
  }[];
  timeToFirstReviewTrend: DailyMetricPoint[];
}

export interface ReviewMetrics {
  totalReviews: number;
  topReviewer: string;
  reviewsPerReviewer: { login: string; count: number }[];
  reviewsPerDay: DailyMetricPoint[];
}

export interface DeploymentMetrics {
  frequencyPerDay: number;
  successRate: number;
  totalFailures: number;
  deploymentsPerDay: DailyMetricPoint[];
  successVsFailure: {
    date: string;
    success: number;
    failure: number;
  }[];
}

export interface AuthorMetrics {
  login: string;
  prsMerged: number;
  avgCycleTimeSeconds: number;
  avgPrSize: number;
  reviewsGiven: number;
  reviewsReceived: number;
}
