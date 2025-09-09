import fs from 'fs';
import fetch from 'node-fetch';

const tempResultsFilePath = 'run_results.json';
const ghPagesBaseUrl = 'https://your-org.github.io/your-repo'; // Replace with your GH Pages URL

async function sendSlackMessage() {
  if (!fs.existsSync(tempResultsFilePath)) {
    console.error('Test results file not found:', tempResultsFilePath);
    return;
  }

  const results = JSON.parse(fs.readFileSync(tempResultsFilePath, 'utf-8'));

  // Construct message text with test pass/fail details
  const passed = results.passed ?? 0;
  const failed = results.failed ?? 0;
  const timedOut = results.timedOut ?? 0;
  const skipped = results.skipped ?? 0;

  // Assuming the latest report folder name is available as in publishGhReport.ts
  // Here you might read from a file or pass it some other way. For this example, just a placeholder:
  const reportLink = `${ghPagesBaseUrl}/index.html`; 

  const message = {
    text: `*Playwright Test Results*\n` +
      `✅ Passed: ${passed}\n` +
      `❌ Failed: ${failed}\n` +
      `⏰ Timed out: ${timedOut}\n` +
      (skipped ? `🚫 Skipped: ${skipped}\n` : '') +
      `View detailed report: ${reportLink}`
  };

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL environment variable is not set');
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify(message),
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.ok) {
    console.log('Slack notification sent successfully');
  } else {
    console.error('Failed to send Slack notification', await response.text());
  }
}

sendSlackMessage().catch(console.error);
