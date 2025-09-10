import dayjs from 'dayjs';
import fs from 'fs-extra';
import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import { generateIndexHtml } from './htmlGenerator';
import { ReportResults, ReportIndexData } from './types';

const sourceDir = path.resolve(__dirname, '../playwright-report');
const tempResultsFilePath = path.resolve(__dirname, '../run_results.json');
const repoBaseUrl = 'https://github.com/MrTraceless/ghProject.git';
const branch = 'gh-pages';
const tempPublishDir = path.resolve(__dirname, '../temp-publish-dir');
const metadataFileName = 'report_index_data.json';

export async function publishReport(): Promise<void> {
  try {
    console.log('Starting report publication process...');

    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory ${sourceDir} does not exist`);
    }

    if (!fs.existsSync(tempResultsFilePath)) {
      throw new Error(`${tempResultsFilePath} does not exist`);
    }

    let currentRunResults: ReportResults;
    try {
      const resultsContent = fs.readFileSync(tempResultsFilePath, 'utf-8');
      currentRunResults = JSON.parse(resultsContent);
      console.log('Read current run results:', currentRunResults);
    } catch (error) {
      throw new Error(`Error reading/parsing ${tempResultsFilePath}: ${error}`);
    }

    if (fs.existsSync(tempPublishDir)) {
      await fs.remove(tempPublishDir);
      console.log('Cleaned existing temp directory');
    }

    console.log('Cloning repository...');
    const git = simpleGit();
    
    try {
      await git.clone(repoBaseUrl, tempPublishDir, [
        '--branch', branch, 
        '--depth', '1', 
        '--single-branch'
      ]);
    } catch (error) {
      console.log('gh-pages branch may not exist, creating it...');
      await git.clone(repoBaseUrl, tempPublishDir, ['--depth', '1']);
      const tempGit = simpleGit(tempPublishDir);
      await tempGit.checkoutLocalBranch(branch);
    }

    let reportIndexData: ReportIndexData = {};
    const metadataFilePath = path.join(tempPublishDir, metadataFileName);
    
    if (fs.existsSync(metadataFilePath)) {
      try {
        const metadataContent = fs.readFileSync(metadataFilePath, 'utf-8');
        reportIndexData = JSON.parse(metadataContent);
        console.log('Loaded existing metadata');
      } catch (error) {
        console.warn('Error reading existing metadata, starting fresh:', error);
        reportIndexData = {};
      }
    }

    // Find the most recent report directory to copy
const reportDirs = fs.readdirSync(sourceDir)
  .filter(d => d.startsWith('report-') && !d.includes('-artifacts'))
  .map(d => ({
    name: d,
    fullPath: path.join(sourceDir, d),
    mtime: fs.statSync(path.join(sourceDir, d)).mtimeMs
  }))
  .sort((a, b) => b.mtime - a.mtime);

    if (reportDirs.length === 0) {
      throw new Error('No report directories found in source');
    }

    const latestReportDir = reportDirs[0];
    console.log(`Using latest report directory: ${latestReportDir.name}`);

    // USE THE ACTUAL DIRECTORY NAME instead of creating a new timestamp
    const destDirName = latestReportDir.name; // This is the key fix!
    reportIndexData[destDirName] = currentRunResults;

    // Copy ALL existing reports to temp directory first
    for (const reportDir of reportDirs) {
      const tempReportPath = path.join(tempPublishDir, reportDir.name);
      if (!fs.existsSync(tempReportPath)) {
        await fs.copy(reportDir.fullPath, tempReportPath);
        
        // Ensure results.json exists in copied directory
        const resultsJsonPath = path.join(tempReportPath, 'results.json');
        if (!fs.existsSync(resultsJsonPath) && reportIndexData[reportDir.name]) {
          fs.writeFileSync(resultsJsonPath, JSON.stringify(reportIndexData[reportDir.name], null, 2));
        }
      }
    }

    // Generate HTML with temp directory as working directory
    const originalCwd = process.cwd();
    process.chdir(tempPublishDir);
    
    const allReportDirs = Object.keys(reportIndexData).sort().reverse();
    const htmlContent = generateIndexHtml(allReportDirs);
    
    process.chdir(originalCwd);

    // Write files to temp directory
    fs.writeFileSync(path.join(tempPublishDir, 'index.html'), htmlContent, 'utf-8');
    fs.writeFileSync(metadataFilePath, JSON.stringify(reportIndexData, null, 2), 'utf-8');

    // Copy the latest report to the destination directory (should already be there from above loop)
    const destPath = path.join(tempPublishDir, destDirName);
    if (!fs.existsSync(destPath)) {
      await fs.copy(latestReportDir.fullPath, destPath);
      console.log(`Copied report from ${latestReportDir.fullPath} to ${destPath}`);
    }

    // Commit and push changes
    const tempGit = simpleGit(tempPublishDir);
    
    try {
      await tempGit.addConfig('user.name', 'GitHub Actions');
      await tempGit.addConfig('user.email', 'actions@github.com');
    } catch (error) {
      console.warn('Could not configure git user (may already be configured)');
    }

    await tempGit.add('.');
    
    const commitMessage = `Publish report ${destDirName} and update index`;
    await tempGit.commit(commitMessage);
    
    console.log('Pushing to remote...');
    await tempGit.push('origin', branch);

    await fs.remove(tempPublishDir);
    console.log('Published report successfully and cleaned up temp directory!');

  } catch (error) {
    console.error('Error in publishReport:', error);
    
    if (fs.existsSync(tempPublishDir)) {
      await fs.remove(tempPublishDir);
    }
    
    throw error;
  }
}

if (require.main === module) {
  publishReport().catch((error) => {
    console.error('Unhandled error in publishReport:', error);
    process.exit(1);
  });
}
