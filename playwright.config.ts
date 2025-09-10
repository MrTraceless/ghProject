import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const outputDir = process.env.REPORT_OUTPUT_DIR || 'playwright-report/latest-run';
const resultsJson = `${outputDir}/results.json`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  /* Put test artifacts outside of report directory completely */
  outputDir: path.resolve(__dirname, 'temp-test-results', path.basename(outputDir || '')),
  
  reporter: [
    ['html', { outputFolder: outputDir, open: 'never' }],
    [path.resolve(__dirname, 'publishReport/custom-json-reporter.ts'), { outputFile: resultsJson }],
  ],
  
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
