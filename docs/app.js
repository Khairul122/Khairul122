(async function() {
  const container = document.getElementById('metrics');
  if (!container) return;

  async function loadData() {
    const urls = [
      'data/github-metrics.json',
      '../data/github-metrics.json',
      'https://raw.githubusercontent.com/Khairul122/Khairul122/main/data/github-metrics.json'
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (e) {
        // try next fallback
      }
    }
    throw new Error('Could not fetch metrics from any endpoint');
  }

  try {
    const data = await loadData();
    const topReposList = (data.topRepos || []).map(r => r.name).join(' • ');

    container.innerHTML = `
      <ul class="metric-list">
        <li class="metric-item">
          <span class="metric-label"><i class="fas fa-code-commit" style="color:#06b6d4"></i> Recent Commits (7d)</span>
          <span class="metric-value">${data.recentCommits ?? 0}</span>
        </li>
        <li class="metric-item">
          <span class="metric-label"><i class="fas fa-code-pull-request" style="color:#7c3aed"></i> PRs Merged (30d)</span>
          <span class="metric-value">${data.prsMerged ?? 0}</span>
        </li>
        <li class="metric-item">
          <span class="metric-label"><i class="fas fa-circle-dot" style="color:#10b981"></i> Issues Opened (30d)</span>
          <span class="metric-value">${data.issuesOpened ?? 0}</span>
        </li>
        <li class="metric-item">
          <span class="metric-label"><i class="fas fa-fire" style="color:#f59e0b"></i> Active Repositories</span>
          <span class="metric-value" style="font-size:0.85rem; font-weight:600;">${topReposList || 'None'}</span>
        </li>
        <li class="metric-item">
          <span class="metric-label"><i class="fas fa-laptop-code" style="color:#ec4899"></i> Primary Languages</span>
          <span class="metric-value" style="font-size:0.85rem; font-weight:600;">${(data.topLangs || []).join(', ')}</span>
        </li>
      </ul>
      <p style="margin-top:14px; font-size:0.78rem; color:var(--text-muted); text-align:right;">
        <i class="fas fa-clock"></i> Terakhir diperbarui: ${new Date(data.lastUpdated).toLocaleString('id-ID')}
      </p>
    `;
  } catch (err) {
    container.innerHTML = `
      <div style="color:#f43f5e; padding:12px; font-size:0.9rem;">
        <i class="fas fa-exclamation-triangle"></i> Gagal memuat data statistik live.
      </div>
    `;
  }
})();
