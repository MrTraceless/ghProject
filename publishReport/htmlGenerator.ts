import fs from 'fs';
import path from 'path';

export function getResultsFromDir(dir: string) {
  const resultsFilePath = path.join(dir, 'some-results-file.json'); // Adjust to your result filename
  if (!fs.existsSync(resultsFilePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(resultsFilePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    console.error(`Failed to read or parse results from ${resultsFilePath}`);
    return null;
  }
}


export function generateIndexHtml(reportDirs: string[]) {
  const listItems = reportDirs
    .map((dir) => {
      // results приходять з діректори (приклад об'єкта)
      const results = getResultsFromDir(dir);

      let liClass = "";
      let resultsSpan = "";

      if (results) {
        if (results.failed > 0) liClass = "status-failed";
        else if (results.timedOut > 0) liClass = "status-timeout";
        else if (results.passed > 0 && results.failed === 0 && results.timedOut === 0) liClass = "status-passed";
        else liClass = "status-nodata";

        resultsSpan = `<span class="results-summary">
          <span class="icon-passed" title="Passed">✅ ${results.passed}</span>
          <span class="icon-failed" title="Failed">❌ ${results.failed}</span>
          <span class="icon-timeout" title="Timeout">⏰ ${results.timedOut}</span>
          ${
            results.skipped !== undefined
              ? `<span class="icon-skipped" title="Skipped">🚫 ${results.skipped}</span>`
              : ""
          }
        </span>`;
      } else {
        liClass = "status-nodata";
        resultsSpan = '<span class="results-summary">Results N/A</span>';
      }

      const reportDateStr = dir.replace('report-', '');
      return `<li class="${liClass}">
                <a href="./${dir}/index.html" title="Report from ${reportDateStr}">${reportDateStr}</a>
                ${resultsSpan}
              </li>`;
    })
    .join("\n");

  const cssStyles = `
:root {
  --bg-color: #1e1e1e; --text-color: #cccccc; --title-color: #e8e8e8;
  --container-bg: #252526; --link-color: #4fc1ff; --link-hover-color: #ffffff;
  --border-color: #333333; --font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --content-max-width: 960px; --border-radius: 6px;

  --status-passed-color: #4CAF50; --status-failed-color: #F44336;
  --status-timeout-color: #FFB667; --status-skipped-color: #99E9E9;
  --status-bg-opacity: 0.15; --status-nodata-color: #444444;
}
html, body { margin: 0; padding: 0; background-color: var(--bg-color); color: var(--text-color); font-family: var(--font-family); line-height: 1.6; font-size: 16px;}
.container { max-width: var(--content-max-width); margin: auto; padding: 1.5em 2.5em; background-color: var(--container-bg); border-radius: var(--border-radius);}
h3 { color: var(--title-color); text-align: center; font-weight: 400;}
ul.report-list { list-style: none; margin-top: 0.5em; margin-bottom: 1.2em; border-bottom: 1px solid var(--border-color);}
li { border-color: var(--border-color); padding-bottom: 0.5em; }
li { display: flex; justify-content: space-between; align-items: center; padding: 0.6em 1em; border-radius: var(--border-radius); border-left: 5px solid transparent; transition: border-color 0.2s ease, background-color 0.2s ease; background-color: rgba(255,255,255,0.03);}
li:hover { background-color: rgba(19,193,255,0.1);}
li a { color: var(--link-color); text-decoration: none; font-weight: 500; margin-right: 1.5em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
li a:hover { color: var(--link-hover-color);}
.results-summary span { display: inline-block; margin-right: 0.5em; }
.icon-passed { color: var(--status-passed-color); }
.icon-failed { color: var(--status-failed-color); }
.icon-timeout { color: var(--status-timeout-color); }
.icon-skipped { color: var(--status-skipped-color); }
li.status-passed { background-color: rgba(var(--status-passed-color), var(--status-bg-opacity)); border-left-color: var(--status-passed-color);}
li.status-failed { background-color: rgba(var(--status-failed-color), var(--status-bg-opacity)); border-left-color: var(--status-failed-color);}
li.status-timeout { background-color: rgba(var(--status-timeout-color), var(--status-bg-opacity)); border-left-color: var(--status-timeout-color);}
li.status-nodata { border-left-color: var(--status-nodata-color); opacity: 0.8;}
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Automation Reports</title>
  <style>${cssStyles}</style>
</head>
<body>
  <div class="container">
    <h3>Test Automation Reports</h3>
    <ul class="report-list">
      ${listItems}
    </ul>
  </div>
</body>
</html>
`;
}
