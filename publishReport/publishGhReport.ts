import dayjs from 'dayjs';
import fs from 'fs-extra';
import simpleGit from 'simple-git';
import { generateIndexHtml } from './htmlGenerator';

const sourceDir = 'playwright-report';
const tempResultsFilePath = 'run_results.json'; // path to test results JSON
const repoBaseUrl = 'https://github.com/your-org/your-repo.git'; // replace with your repo URL
const branch = 'gh-pages';
const tempPublishDir = 'temp-publish-dir';
const metadataFileName = 'report_index_data.json';

async function publishReport() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory ${sourceDir} does not exist. Skipping publish.`);
    return;
  }

  let currentRunResults = null;
  if (fs.existsSync(tempResultsFilePath)) {
    try {
      currentRunResults = JSON.parse(fs.readFileSync(tempResultsFilePath, 'utf-8'));
      console.log('Read current run results', currentRunResults);
    } catch (e) {
      console.error(`Error reading/parsing ${tempResultsFilePath}:`, e);
      return;
    }
  } else {
    console.error(`${tempResultsFilePath} does not exist. Skipping publish.`);
    return;
  }

  // Clean temp publish folder
  if (fs.existsSync(tempPublishDir)) {
    await fs.remove(tempPublishDir);
  }

  console.log('Cloning repo...');
  await simpleGit().clone(repoBaseUrl, tempPublishDir, ['--branch', branch, '--depth', '1', '--single-branch']);

  let reportIndexData: Record<string, any> = {};
  const metadataFilePath = `${tempPublishDir}/${metadataFileName}`;

  if (fs.existsSync(metadataFilePath)) {
    try {
      reportIndexData = JSON.parse(fs.readFileSync(metadataFilePath, 'utf-8'));
    } catch (e) {
      console.error('Error reading/parsing existing metadata:', e);
      reportIndexData = {};
    }
  }

  // Add new current run results with timestamped folder key
  const destDirName = `report-${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
  reportIndexData[destDirName] = currentRunResults;

  // Generate HTML index page
  const allReportDirs = Object.keys(reportIndexData);
  const htmlContent = generateIndexHtml(allReportDirs);

  // Write index.html and metadata JSON
  fs.writeFileSync(`${tempPublishDir}/index.html`, htmlContent, 'utf-8');
  fs.writeFileSync(metadataFilePath, JSON.stringify(reportIndexData, null, 2), 'utf-8');

  // Copy the current report sourceDir contents into tempPublishDir under destDirName
  await fs.copy(sourceDir, `${tempPublishDir}/${destDirName}`);

  // Commit and push changes
  const git = simpleGit(tempPublishDir);
  await git.add(['.']);
  await git.commit(`Publish report ${destDirName} and update index`);
  await git.push('origin', branch);

  // Clean up temp folder
  await fs.remove(tempPublishDir);

  console.log('Published report successfully!');
}

publishReport().catch((err) => {
  console.error('Unhandled error in publishReport:', err);
  process.exit(1);
});
