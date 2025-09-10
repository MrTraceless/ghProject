import { spawnSync, SpawnSyncReturns } from 'child_process';
import { readTimestampFromFile } from './timestamp-helper';
import path from 'path';
import fs from 'fs';

export async function runPlaywrightWithTimestamp(): Promise<void> {
  try {
    // Read timestamp from file
    const timestamp = readTimestampFromFile();
    const outputDir = path.resolve(__dirname, `../playwright-report/report-${timestamp}`);

    console.log(`Running Playwright tests with output directory: ${outputDir}`);

    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true });

    // Run Playwright tests with proper error handling
    const result: SpawnSyncReturns<Buffer> = spawnSync('npx', [
      'playwright',
      'test',
      '--config=playwright.config.ts'
    ], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        REPORT_OUTPUT_DIR: outputDir 
      },
      cwd: path.resolve(__dirname, '..'),
      shell: process.platform === 'win32'
    });

    // Check for errors
    if (result.error) {
      console.error('Failed to spawn process:', result.error.message);
      process.exit(1);
    }

    if (result.stderr && result.stderr.length > 0) {
      console.error('Playwright stderr:', result.stderr.toString());
    }

    if (result.stdout && result.stdout.length > 0) {
      console.log('Playwright stdout:', result.stdout.toString());
    }

    if (result.status !== 0) {
      console.error(`Playwright tests failed with exit code: ${result.status}`);
      // Don't exit with error if tests fail, we still want to publish the report
      console.log('Continuing with report generation despite test failures...');
    } else {
      console.log('Playwright tests completed successfully');
    }

  } catch (error) {
    console.error('Error running Playwright tests:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runPlaywrightWithTimestamp();
}
