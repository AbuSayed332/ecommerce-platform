export interface MetricData {
  id: string;
  name: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  period: string;
  unit?: string;
  description?: string;
}

export interface ChartData {
  label: string;
  value: number;
  date: string;
  category?: string;
}

export interface Chart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: ChartData[];
  options?: {
    color?: string;
    showLegend?: boolean;
    showGrid?: boolean;
  };
}

export interface AnalyticsSummary {
  totalRecords: number;
  period: string;
  lastUpdated: string;
  dataSource?: string;
}

export interface ReportData {
  id: string;
  title: string;
  description?: string;
  data: any[];
  generatedAt: string;
  format: 'table' | 'chart' | 'mixed';
}

export interface AnalyticsData {
  metrics?: MetricData[];
  charts?: Chart[];
  reports?: ReportData[];
  summary?: AnalyticsSummary;
  rawData?: any[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData | null;
  message: string;
  error?: string;
  timestamp?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface EventTrackingData {
  eventType: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, any>;
  timestamp: string;
  source?: string;
}