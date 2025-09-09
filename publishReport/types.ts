export interface ReportResults {
  passed: number;
  failed: number;
  timedOut: number;
  skipped?: number;
}

export interface ReportIndexData {
  [reportDirName: string]: ReportResults;
}
