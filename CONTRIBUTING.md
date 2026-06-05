CONTRIBUTING

This repository includes an automated GitHub Action (fetch-github-metrics) that periodically fetches public GitHub performance metrics and updates the README and a data file (data/github-metrics.json).

Security & Secrets
- The Action uses the built-in GITHUB_TOKEN for public data and to push commits. No external API keys are required for public GitHub data.
- To include private-data (private repos, private activity), set a Personal Access Token (PAT) with appropriate scopes as a repository secret (e.g., name: GH_PAT) and update the workflow to use it. Do this only if you understand the security implications.

Rate limits
- The script uses GitHub REST API and respects basic rate limits. If you hit rate limits, consider increasing the cron interval.

How to run locally
- Requires Node.js 18+ (for global fetch) or install node-fetch and adjust script.
- Run: node scripts/fetch-github-metrics.js

How to contribute
- Open issues or PRs. If modifying workflows or scripts, ensure you do not commit secrets.