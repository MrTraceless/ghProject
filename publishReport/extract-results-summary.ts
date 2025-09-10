import fs from 'fs';
import path from 'path';
import { ReportResults } from './types';

interface DirectoryInfo {
  name: string;
  fullPath: string;
  mtime: number;
}

export function extractResultsSummary(): ReportResults {
  try {
    const reportRoot = path.resolve(__dirname, '../playwright-report');
    
    if (!fs.existsSync(reportRoot)) {
      console.error('Report root directory does not exist:', reportRoot);
      process.exit(1);
    }

    // Find all report directories, excluding artifacts directories
    const dirs: DirectoryInfo[] = fs.readdirSync(reportRoot)
      .filter(d => d.startsWith('report-') && !d.includes('-artifacts') && fs.statSync(path.join(reportRoot, d)).isDirectory())
      .map(d => ({
        name: d,
        fullPath: path.join(reportRoot, d),
        mtime: fs.statSync(path.join(reportRoot, d)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (dirs.length === 0) {
      console.error('No report directories found');
      process.exit(1);
    }

    const latestDir: DirectoryInfo = dirs[0];
    console.log(`Using latest report directory: ${latestDir.name}`);

    // Look for results.json in the latest directory
    const resultsPath = path.join(latestDir.fullPath, 'results.json');
    
    let summary: ReportResults;
    
    if (!fs.existsSync(resultsPath)) {
      console.warn('No results.json found in latest report folder:', resultsPath);
      // Try to extract from HTML report or create default
      summary = extractFromHtmlOrDefault(latestDir.fullPath);
    } else {
      // Parse existing results.json
      const resultsContent = fs.readFileSync(resultsPath, 'utf-8');
      const resultsRaw = JSON.parse(resultsContent);
      
      // Handle different JSON structures from Playwright
      const stats = resultsRaw.stats || resultsRaw;
      
      summary = {
        passed: stats.passed || stats.expectedCount || 0,
        failed: stats.failed || stats.unexpectedCount || 0,
        timedOut: stats.timedOut || stats.timeout || 0,
        skipped: stats.skipped || stats.skippedCount || 0
      };
    }

    // Save summary to file
    const summaryPath = path.resolve(__dirname, '../run_results.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    
    console.log('Saved run_results.json with:', summary);
    return summary;

  } catch (error) {
    console.error('Error extracting results summary:', error);
    process.exit(1);
  }
}

function extractFromHtmlOrDefault(reportDir: string): ReportResults {
  // Try to find index.html and extract basic info
  const indexPath = path.join(reportDir, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    try {
      const htmlContent = fs.readFileSync(indexPath, 'utf-8');
      
      // Basic regex to extract test counts from HTML (this is a fallback)
      const passedMatch = htmlContent.match(/(\d+)\s*passed/i);
      const failedMatch = htmlContent.match(/(\d+)\s*failed/i);
      const skippedMatch = htmlContent.match(/(\d+)\s*skipped/i);
      
      return {
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        timedOut: 0,
        skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0
      };
    } catch (error) {
      console.warn('Could not extract from HTML, using defaults');
    }
  }
  
  // Default fallback
  return {
    passed: 0,
    failed: 0,
    timedOut: 0,
    skipped: 0
  };
}

// Run if called directly
if (require.main === module) {
  extractResultsSummary();
}
