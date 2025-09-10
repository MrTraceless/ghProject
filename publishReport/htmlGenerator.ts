import fs from 'fs';
import path from 'path';
import { ReportResults } from './types';

function getResultsFromDir(reportDir: string, basePath: string = '.'): ReportResults | null {
  const resultsPath = path.join(basePath, reportDir, 'results.json');
  
  console.log(`Looking for results in: ${resultsPath}`);
  
  if (!fs.existsSync(resultsPath)) {
    console.warn(`Results file not found: ${resultsPath}`);
    return null;
  }
  
  try {
    const data = fs.readFileSync(resultsPath, 'utf8');
    const parsed = JSON.parse(data);
    
    console.log(`Parsed results from ${reportDir}:`, parsed);
    
    const stats = parsed.stats || parsed;
    
    return {
      passed: stats.passed || stats.expectedCount || 0,
      failed: stats.failed || stats.unexpectedCount || 0,
      timedOut: stats.timedOut || stats.timeout || 0,
      skipped: stats.skipped || stats.skippedCount || 0
    };
  } catch (error) {
    console.error(`Failed to parse results from ${resultsPath}:`, error);
    return null;
  }
}

export function generateIndexHtml(reportDirs: string[], basePath: string = '.'): string {
  console.log('Generating index HTML for directories:', reportDirs);
  
  const listItems = reportDirs.map((dir) => {
    const results = getResultsFromDir(dir, basePath);
    let liClass = '';
    let resultsSpan = '';
    let statusIcon = '';
    
    if (results) {
      if (results.failed > 0) {
        liClass = 'status-failed';
        statusIcon = '❌';
      } else if (results.timedOut > 0) {
        liClass = 'status-timeout';
        statusIcon = '⏰';
      } else if (results.passed > 0) {
        liClass = 'status-passed';
        statusIcon = '✅';
      } else {
        liClass = 'status-nodata';
        statusIcon = '⚪';
      }
      
      resultsSpan = `
        <div class="stats-container">
          <span class="stat-item passed">✅ ${results.passed}</span>
          <span class="stat-item failed">❌ ${results.failed}</span>
          <span class="stat-item timeout">⏰ ${results.timedOut}</span>
          <span class="stat-item skipped">🚫 ${results.skipped}</span>
        </div>
      `;
    } else {
      liClass = 'status-nodata';
      statusIcon = '❔';
      resultsSpan = '<div class="stats-container"><span class="no-data">Results N/A</span></div>';
    }

    const reportDateStr = dir.replace('report-', '');
    return `
      <li class="report-item ${liClass}" data-status="${liClass}">
        <a href="${dir}/index.html" class="report-link">
          <div class="report-header">
            <div class="status-indicator">
              <span class="status-icon">${statusIcon}</span>
            </div>
            <div class="report-info">
              <strong class="report-date">${reportDateStr}</strong>
              <div class="report-time">${formatTimestamp(reportDateStr)}</div>
            </div>
          </div>
          <div class="results-section">
            ${resultsSpan}
          </div>
          <div class="arrow-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </a>
      </li>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎭 Playwright Test Reports</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎭</text></svg>">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg-primary: #0d1117;
            --bg-secondary: #161b22;
            --bg-tertiary: #21262d;
            --border-color: #30363d;
            --text-primary: #f0f6fc;
            --text-secondary: #8b949e;
            --text-muted: #6e7681;
            --success-color: #238636;
            --success-bg: #0d4f1c;
            --error-color: #f85149;
            --error-bg: #490202;
            --warning-color: #f79009;
            --warning-bg: #4a2800;
            --info-color: #58a6ff;
            --accent-color: #7c3aed;
            --hover-bg: #262c36;
            --shadow-light: 0 1px 3px rgba(0, 0, 0, 0.12);
            --shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.1);
            --shadow-heavy: 0 10px 25px rgba(0, 0, 0, 0.2);
            --gradient-primary: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
            --gradient-success: linear-gradient(135deg, #059669 0%, #10b981 100%);
            --gradient-error: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            --gradient-warning: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
            background-image: 
                radial-gradient(circle at 25% 25%, #7c3aed22 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, #3b82f622 0%, transparent 50%);
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem 0;
        }

        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
            animation: slideInDown 0.8s ease-out;
        }

        .header p {
            color: var(--text-secondary);
            font-size: 1.1rem;
            animation: slideInUp 0.8s ease-out 0.2s both;
        }

        .reports-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .report-item {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: fadeInUp 0.6s ease-out both;
        }

        .report-item:nth-child(1) { animation-delay: 0.1s; }
        .report-item:nth-child(2) { animation-delay: 0.15s; }
        .report-item:nth-child(3) { animation-delay: 0.2s; }
        .report-item:nth-child(4) { animation-delay: 0.25s; }
        .report-item:nth-child(5) { animation-delay: 0.3s; }

        .report-item:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-heavy);
            border-color: var(--accent-color);
            background: var(--bg-tertiary);
        }

        .report-item.status-passed:hover {
            border-color: var(--success-color);
            box-shadow: 0 10px 25px rgba(34, 134, 54, 0.15);
        }

        .report-item.status-failed:hover {
            border-color: var(--error-color);
            box-shadow: 0 10px 25px rgba(248, 81, 73, 0.15);
        }

        .report-item.status-timeout:hover {
            border-color: var(--warning-color);
            box-shadow: 0 10px 25px rgba(247, 144, 9, 0.15);
        }

        .report-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem;
            text-decoration: none;
            color: inherit;
            width: 100%;
            gap: 1rem;
        }

        .report-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex: 1;
        }

        .status-indicator {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            transition: all 0.3s ease;
        }

        .status-passed .status-indicator {
            background: var(--success-bg);
            color: var(--success-color);
        }

        .status-failed .status-indicator {
            background: var(--error-bg);
            color: var(--error-color);
        }

        .status-timeout .status-indicator {
            background: var(--warning-bg);
            color: var(--warning-color);
        }

        .status-nodata .status-indicator {
            background: var(--bg-tertiary);
            color: var(--text-muted);
        }

        .report-info {
            flex: 1;
        }

        .report-date {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-primary);
            display: block;
            margin-bottom: 0.25rem;
        }

        .report-time {
            font-size: 0.9rem;
            color: var(--text-secondary);
        }

        .results-section {
            display: flex;
            align-items: center;
        }

        .stats-container {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .stat-item {
            font-size: 0.9rem;
            font-weight: 500;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            background: var(--bg-tertiary);
            color: var(--text-secondary);
            transition: all 0.2s ease;
        }

        .stat-item.passed {
            color: var(--success-color);
            background: var(--success-bg);
        }

        .stat-item.failed {
            color: var(--error-color);
            background: var(--error-bg);
        }

        .stat-item.timeout {
            color: var(--warning-color);
            background: var(--warning-bg);
        }

        .stat-item.skipped {
            color: var(--text-muted);
        }

        .no-data {
            color: var(--text-muted);
            font-style: italic;
        }

        .arrow-icon {
            color: var(--text-muted);
            transition: all 0.3s ease;
        }

        .report-item:hover .arrow-icon {
            color: var(--accent-color);
            transform: translateX(4px);
        }

        .footer {
            text-align: center;
            margin-top: 3rem;
            padding: 2rem 0;
            border-top: 1px solid var(--border-color);
            color: var(--text-muted);
        }

        .footer p {
            font-size: 0.9rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 1rem 0.5rem;
            }

            .header h1 {
                font-size: 2rem;
            }

            .report-link {
                padding: 1rem;
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;
            }

            .report-header {
                justify-content: space-between;
            }

            .stats-container {
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .stat-item {
                font-size: 0.8rem;
            }
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideInDown {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Loading states and micro-interactions */
        .report-item {
            position: relative;
            overflow: hidden;
        }

        .report-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transition: left 0.5s ease;
        }

        .report-item:hover::before {
            left: 100%;
        }

        /* Status indicators glow effect */
        .report-item:hover .status-indicator {
            box-shadow: 0 0 20px currentColor;
            transform: scale(1.05);
        }

        /* Smooth scroll behavior */
        html {
            scroll-behavior: smooth;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🎭 Playwright Test Reports</h1>
            <p>Automated test results dashboard with real-time updates</p>
        </header>

        <main>
            <ul class="reports-list">
                ${listItems}
            </ul>
        </main>

        <footer class="footer">
            <p>Generated automatically • Last updated: ${new Date().toLocaleString()}</p>
        </footer>
    </div>

    <script>
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Add click analytics (optional)
            document.querySelectorAll('.report-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    // Optional: Add analytics tracking here
                    console.log('Report clicked:', this.href);
                });
            });

            // Add keyboard navigation
            document.addEventListener('keydown', function(e) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    const reports = document.querySelectorAll('.report-link');
                    const focused = document.activeElement;
                    const index = Array.from(reports).indexOf(focused);
                    
                    if (index !== -1) {
                        e.preventDefault();
                        const nextIndex = e.key === 'ArrowDown' 
                            ? Math.min(index + 1, reports.length - 1)
                            : Math.max(index - 1, 0);
                        reports[nextIndex].focus();
                    }
                }
            });
        });
    </script>
</body>
</html>`;
}

// Helper function to format timestamp
function formatTimestamp(timestamp: string): string {
  try {
    const parts = timestamp.split('_');
    if (parts.length !== 2) return timestamp;
    
    const [datePart, timePart] = parts;
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split('-');
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return timestamp;
  }
}
