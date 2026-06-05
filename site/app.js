(async function(){
  try{
    const res = await fetch('/data/github-metrics.json');
    if(!res.ok) throw new Error('Unable to load metrics');
    const data = await res.json();
    const el = document.getElementById('metrics');
    el.innerHTML = `
      <ul>
        <li>Recent commits (7d): <strong>${data.recentCommits}</strong></li>
        <li>PRs merged (30d): <strong>${data.prsMerged}</strong></li>
        <li>Issues opened (30d): <strong>${data.issuesOpened}</strong></li>
        <li>Top repos:<ul>${data.topRepos.map(r=>`<li><a href="${r.html_url}" target="_blank">${r.name}</a> - ${r.description||''}</li>`).join('')}</ul></li>
        <li>Languages: <strong>${data.topLangs.join(', ')}</strong></li>
      </ul>
      <p><em>Last updated: ${new Date(data.lastUpdated).toLocaleString()}</em></p>
    `;
  }catch(e){
    document.getElementById('metrics').textContent = 'Metrics unavailable.';
  }
})();
