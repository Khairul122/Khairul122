const fs = require('fs');

// Use global fetch on Node 18+, otherwise try to require node-fetch
let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try { fetchFn = require('node-fetch'); } catch (e) { /* will fail later */ }
}
if (!fetchFn) {
  throw new Error('Fetch API not available. Run on Node 18+ or install node-fetch');
}

const USER = process.env.GITHUB_USER || 'Khairul122';
const TOKEN = process.env.GITHUB_TOKEN;

function isoDateDaysAgo(days){
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().split('T')[0];
}

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function fetchWithRetries(url, opts={}, retries=3){
  let attempt = 0;
  while(true){
    attempt++;
    const res = await fetchFn(url, opts);
    if(res.status === 429 || res.status === 403){
      const ra = res.headers.get('retry-after');
      const reset = res.headers.get('x-ratelimit-reset');
      if(ra){ await sleep(parseInt(ra,10)*1000); }
      else if(reset){ const wait = Math.max(1, parseInt(reset,10) - Math.floor(Date.now()/1000)); await sleep(wait*1000); }
      else {
        if(attempt > retries) throw new Error(`Rate limited on ${url}`);
        await sleep(1000 * attempt);
      }
      if(attempt > retries) throw new Error(`Failed after ${retries} retries: ${url}`);
      continue;
    }
    if(!res.ok){
      if(attempt <= retries){ await sleep(500 * attempt); continue; }
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    }
    return res;
  }
}

async function api(path){
  const url = `https://api.github.com${path}`;
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if(TOKEN) headers.Authorization = `token ${TOKEN}`;
  const res = await fetchWithRetries(url, { headers });
  return res.json();
}

(async()=>{
  try{
    const since7 = isoDateDaysAgo(7);
    const since30 = isoDateDaysAgo(30);

    // Recent commits via public events
    const events = await api(`/users/${USER}/events/public`);
    const recentCommits = Array.isArray(events) ? events.filter(e=>e.type==='PushEvent' && new Date(e.created_at) >= new Date(Date.now()-7*24*60*60*1000)).length : 0;

    // PRs merged (30d)
    const prSearch = await api(`/search/issues?q=author:${USER}+is:pr+is:merged+merged:>${since30}&per_page=1`);
    const prsMerged = prSearch && prSearch.total_count ? prSearch.total_count : 0;

    // Issues opened (30d)
    const issuesSearch = await api(`/search/issues?q=author:${USER}+is:issue+created:>${since30}&per_page=1`);
    const issuesOpened = issuesSearch && issuesSearch.total_count ? issuesSearch.total_count : 0;

    // Repos list
    const repos = await api(`/users/${USER}/repos?per_page=100&sort=pushed`);
    const topRepos = (Array.isArray(repos) ? repos : []).slice(0,5).map(r=>({name:r.name, pushedAt:r.pushed_at, html_url:r.html_url, description:r.description}));

    // Languages aggregate for top repos (limited, serialized to avoid rate limits)
    const languages = {};
    const toCheck = (Array.isArray(repos) ? repos : []).slice(0,10);
    for(const r of toCheck){
      if(r.languages_url){
        await sleep(120); // small delay to be polite
        try{
          const langs = await api(new URL(r.languages_url).pathname);
          for(const [k,v] of Object.entries(langs||{})) languages[k]=(languages[k]||0)+v;
        }catch(e){ console.warn('Failed to fetch languages for', r.name, e.message); }
      }
    }
    const topLangs = Object.entries(languages).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);

    const metrics = { lastUpdated: new Date().toISOString(), recentCommits, prsMerged, issuesOpened, topRepos, topLangs };

    if(!fs.existsSync('data')) fs.mkdirSync('data');
    fs.writeFileSync('data/github-metrics.json', JSON.stringify(metrics, null, 2));

    // Update README between markers
    const readme = fs.readFileSync('README.md','utf8');
    const markerStart = '<!-- GITHUB-METRICS:START -->';
    const markerEnd = '<!-- GITHUB-METRICS:END -->';
    const mdLines = [
      `- Recent commits (7d): **${recentCommits}**`,
      `- PRs merged (30d): **${prsMerged}**`,
      `- Issues opened (30d): **${issuesOpened}**`,
      `- Top repos (by recent activity):`,
      ...topRepos.map(r=>`  - [${r.name}](${r.html_url}) - ${r.description||''}`),
      `- Languages by activity: **${topLangs.join(', ')}**`,
      `- Last updated: ${metrics.lastUpdated}`
    ];
    const newSection = `${markerStart}\n${mdLines.join('\n')}\n\n${markerEnd}`;
    const final = readme.replace(/<!-- GITHUB-METRICS:START -->[\s\S]*?<!-- GITHUB-METRICS:END -->/, newSection);
    if(final !== readme){ fs.writeFileSync('README.md', final); console.log('README updated with new metrics'); } else { console.log('No changes to README'); }

    console.log('Metrics fetched and written to data/github-metrics.json');
  }catch(err){ console.error(err); process.exit(1); }
})();