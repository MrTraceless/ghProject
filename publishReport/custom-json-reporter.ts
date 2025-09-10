import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

class CustomJSONReporter implements Reporter {
  private outputFile: string;
  private stats = {
    passed: 0,
    failed: 0,
    timedOut: 0,
    skipped: 0,
    total: 0
  };

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile = options.outputFile || 'results.json';
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.stats.total++;
    
    if (result.status === 'passed') {
      this.stats.passed++;
    } else if (result.status === 'failed') {
      this.stats.failed++;
    } else if (result.status === 'timedOut') {
      this.stats.timedOut++;
    } else if (result.status === 'skipped') {
      this.stats.skipped++;
    }
  }

  onEnd(result: FullResult) {
    const outputDir = path.dirname(this.outputFile);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(this.outputFile, JSON.stringify(this.stats, null, 2));
    console.log(`Custom JSON report saved to: ${this.outputFile}`);
    console.log('Test results:', this.stats);
  }
}

export default CustomJSONReporter;
