const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'github-metrics.json');
const outPath = path.join(__dirname, 'trophy.svg');

function safeGet(o, k, fallback='—') { return o && o[k] !== undefined ? o[k] : fallback }

function buildSvg({commits, prs, issues, topRepo}){
  const title = 'Trophies & Recent Activity';
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="120" viewBox="0 0 540 120" role="img" aria-label="Trophies">\n`+
    `  <rect rx="10" width="540" height="120" fill="#0d0d1a" stroke="#7c3aed" stroke-width="1.5"/>\n`+
    `  <text x="24" y="34" fill="#ffd54f" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="700">🏆 ${title}</text>\n`+
    `  <text x="24" y="64" fill="#e2e8f0" font-family="Segoe UI, Roboto, sans-serif" font-size="13">Commits (7d): <tspan fill="#06b6d4" font-weight="600">${commits}</tspan>  •  PRs (30d): <tspan fill="#06b6d4" font-weight="600">${prs}</tspan>  •  Issues (30d): <tspan fill="#06b6d4" font-weight="600">${issues}</tspan></text>\n`+
    `  <text x="24" y="92" fill="#c4b5fd" font-family="Segoe UI, Roboto, sans-serif" font-size="12">Featured Active Repo: <tspan fill="#10b981" font-weight="600">${topRepo}</tspan></text>\n`+
    `</svg>\n`;
}

function main(){
  let json = {};
  try { json = JSON.parse(fs.readFileSync(dataPath,'utf8')) } catch(e) { /* ignore */ }
  const commits = safeGet(json, 'recentCommits', safeGet(json, 'recent_commits', 0));
  const prs = safeGet(json, 'prsMerged', safeGet(json, 'prsMerged30d', safeGet(json, 'prs_merged', 0)));
  const issues = safeGet(json, 'issuesOpened', safeGet(json, 'issuesOpened30d', safeGet(json, 'issues_opened', 0)));
  const topRepo = (json.topRepos && json.topRepos.length) ? json.topRepos[0].name : (json.top_repos && json.top_repos[0] && json.top_repos[0].name) || '—';

  const svg = buildSvg({commits, prs, issues, topRepo});
  fs.writeFileSync(outPath, svg, 'utf8');
  // Also sync to root trophy.svg if it exists
  const rootTrophy = path.join(__dirname, '..', 'trophy.svg');
  fs.writeFileSync(rootTrophy, svg, 'utf8');
  console.log('Wrote', outPath, 'and', rootTrophy);
}

if (require.main === module) main();
