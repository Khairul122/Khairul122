const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'github-metrics.json');
const outPath = path.join(__dirname, 'metrics-badge.svg');

function safeGet(obj, ...keys) {
  for (const k of keys) {
    if (!obj) return undefined;
    if (obj[k] !== undefined) return obj[k];
  }
  return undefined;
}

function buildSvg(commits, topLang) {
  const text = `Commits (7d): ${commits} · Top: ${topLang}`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="28" role="img" aria-label="GitHub metrics badge">\n` +
    `  <rect rx="6" width="420" height="28" fill="#0d0d1a" />\n` +
    `  <text x="14" y="19" fill="#06b6d4" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="12">${text}</text>\n` +
    `</svg>\n`;
}

function main() {
  let json = {};
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    json = JSON.parse(raw);
  } catch (e) {
    console.error('Could not read data/github-metrics.json, using defaults');
  }

  // Heuristics to find fields
  const commits = safeGet(json, 'recentCommits') || safeGet(json, 'recent_commits') || (json.commits && json.commits['7d']) || safeGet(json, 'commits') || 0;
  let topLang = '—';
  if (Array.isArray(json.languages) && json.languages.length) topLang = json.languages[0];
  else if (json.languagesByActivity && Array.isArray(json.languagesByActivity) && json.languagesByActivity.length) topLang = json.languagesByActivity[0];
  else if (json.topLanguage) topLang = json.topLanguage;

  const svg = buildSvg(commits, topLang);
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('Wrote', outPath);
}

if (require.main === module) main();
