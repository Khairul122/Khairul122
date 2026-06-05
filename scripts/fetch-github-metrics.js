const fs = require('fs');
const fetch = require('node-fetch');

const USER = process.env.GITHUB_USER || 'Khairul122';
const TOKEN = process.env.GITHUB_TOKEN;

function isoDateDaysAgo(days){
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

async function api(path){
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: TOKEN ? `token ${TOKEN}` : undefined
    }
  });
  if(!res.ok){
    throw new Error(`GitHub API error ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json();
}

(async()=>{
  try{
    const since7 = isoDateDaysAgo(7);
    const since30 = isoDateDaysAgo(30);

    // Recent commits via public events
    const events = await api(`/users/${USER}/events/public`);
    const recentCommits = events.filter(e=>e.type==='PushEvent' && new Date(e.created_at) >= new Date(Date.now()-7*24*60*60*1000)).length;

    // PRs merged (30d)
    const prSearch = await api(`/search/issues?q=author:${USER}+is:pr+is:merged+merged:>${since30}&per_page=1`);
    const prsMerged = prSearch.total_count || 0;

    // Issues opened (30d)
    const issuesSearch = await api(`/search/issues?q=author:${USER}+is:issue+created:>${since30}&per_page=1`);
    const issuesOpened = issuesSearch.total_count || 0;

    // Repos list
    const repos = await api(`/users/${USER}/repos?per_page=100&sort=pushed`);
    const topRepos = repos.slice(0,5).map(r=>({name:r.name, pushedAt:r.pushed_at, html_url:r.html_url, description:r.description}));

    // Languages aggregate for top repos
    const languages = {};
    for(const r of repos.slice(0,10)){
      if(r.languages_url){
        const langs = await api(new URL(r.languages_url).pathname);
        for(const [k,v] of Object.entries(langs)) languages[k]=(languages[k]||0)+v;
      }
    }
    const topLangs = Object.entries(languages).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);

    const metrics = {
      lastUpdated: new Date().toISOString(),
      recentCommits,
      prsMerged,
      issuesOpened,
      topRepos,
      topLangs
    };

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
      `- Languages by activity: **${topLangs.join(', ')}**`
    ];
    const newSection = `${markerStart}\n${mdLines.join('\n')}\n\n${markerEnd}`;
    const final = readme.replace(/<!-- GITHUB-METRICS:START -->[\s\S]*?<!-- GITHUB-METRICS:END -->/, newSection);
    if(final !== readme){
      fs.writeFileSync('README.md', final);
      console.log('README updated with new metrics');
    } else {
      console.log('No changes to README');
    }

    console.log('Metrics fetched and written to data/github-metrics.json');
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();