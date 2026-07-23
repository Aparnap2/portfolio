const GITHUB_USERNAME = 'aparnap2';

const CUSTOM_DESCRIPTIONS = {
  'Self_Healing_supply_chain_ai': 'AI-powered supply chain automation with self-healing capabilities for production resilience.',
  'docluflow_ai': 'Document processing and workflow automation using AI agents for enterprise operations.',
  'churn_assasin': 'Machine learning system for predicting and preventing customer churn in SaaS businesses.',
  'runway_guard': 'Financial runway monitoring and burn rate analysis for startups and enterprises.',
  'autoadmin-APP': 'Autonomous admin operations agent for IT infrastructure management.',
  'agentstack': 'CLI tool and framework for building and deploying AI agents in production.',
  'ontologyai': 'Self-serve FDE companion and multi-agent OS turning messy business inputs into shared truth and governed workflow specs.',
  'opscore': 'Manufacturing control tower detecting PO/GRN/invoice mismatches before payment blocks occur.',
  'finsight': 'LangGraph agent pipeline for ingestion, variance detection, root-cause investigation, and scenario reforecasting.',
  'support_triage_agent': 'AI agent for product discovery, case management, draft replies, and escalation with HITL.',
};

const githubCache = {
  repositories: null,
  lastFetched: null,
  cacheTTL: 60 * 1000,
};

function shouldUseCache() {
  return githubCache.repositories &&
         githubCache.lastFetched &&
         (Date.now() - githubCache.lastFetched < githubCache.cacheTTL);
}

function setCache(repositories) {
  githubCache.repositories = repositories;
  githubCache.lastFetched = Date.now();
}

function createReadmePreview(readmeContent) {
  if (!readmeContent || typeof readmeContent !== 'string') {
    return { heading: 'README', text: 'No preview available.' };
  }

  const lines = readmeContent.split('\n');
  const headingLine = lines.find(line => line.startsWith('#'));
  const heading = headingLine ? headingLine.replace(/#/g, '').trim() : 'README';

  let text = '';
  const headingIndex = headingLine ? lines.indexOf(headingLine) : -1;
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.startsWith('!') && !line.startsWith('[') && !line.startsWith('|')) {
      text = line;
      break;
    }
  }

  return { heading, text: text || 'No preview available.' };
}

async function apiFetch(endpoint, repo) {
  try {
    const params = new URLSearchParams({ endpoint });
    if (repo) params.set('repo', repo);
    if (endpoint === 'repos') params.set('per_page', '30');

    const response = await fetch(`/api/github?${params.toString()}`);
    if (response.status === 429) {
      return { error: 'rate_limited' };
    }
    if (!response.ok) {
      console.error(`API error for ${endpoint}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch error for ${endpoint}:`, error.message);
    return null;
  }
}

async function getReadme(repoName) {
  const data = await apiFetch('readme', repoName);
  if (!data || data.error) return null;
  try {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

async function getLatestCommits(repoName, count = 5) {
  const data = await apiFetch('commits', repoName);
  if (!data || !Array.isArray(data)) return [];
  return data.slice(0, count).map(commit => ({
    message: commit.commit.message.split('\n')[0],
    fullMessage: commit.commit.message,
    url: commit.html_url,
    sha: commit.sha.substring(0, 7),
    date: commit.commit.author.date,
    author: commit.commit.author.name,
  }));
}

async function getRepositoryLanguages(repoName) {
  const data = await apiFetch('languages', repoName);
  return data || {};
}

async function getRepositoryIssues(repoName, count = 5) {
  const data = await apiFetch('issues', repoName);
  if (!data || !Array.isArray(data)) return [];
  return data.filter(issue => !issue.pull_request).slice(0, count).map(issue => ({
    title: issue.title,
    state: issue.state,
    url: issue.html_url,
    number: issue.number,
    created: issue.created_at,
    labels: issue.labels.map(label => label.name),
  }));
}

function createFallbackProject(name, description, url) {
  return {
    id: 0, name, title: name, description,
    readme: null, readmePreview: { heading: name, text: description },
    commits: [], languages: {}, issues: [],
    url: url || '#', stars: 0, forks: 0, watchers: 0,
    language: 'None', topics: [], license: 'No license',
    size: 0, created: new Date().toISOString(),
    updated: new Date().toISOString(), pushed: new Date().toISOString(),
    openIssues: 0, defaultBranch: 'main', visibility: 'public',
    hasWiki: false, hasPages: false, hasProjects: false,
  };
}

export async function getTopRepositories(count = 8) {
  if (shouldUseCache()) {
    console.log('Using cached GitHub repositories');
    return githubCache.repositories;
  }

  const reposData = await apiFetch('repos');

  if (!reposData || !Array.isArray(reposData) || reposData.length === 0 || reposData.error) {
    return [{ _rateLimited: true }];
  }
    return [createFallbackProject('GitHub Unavailable', 'Could not fetch repositories. Try refreshing.', '#')];
  }

  const filteredRepos = reposData
    .filter(repo => {
      if (repo.private || repo.fork || repo.archived) return false;
      if (repo.name === 'portfolio' || repo.name === GITHUB_USERNAME) return false;
      return true;
    })
    .slice(0, count);

  if (filteredRepos.length === 0) {
    return [createFallbackProject('No Projects', 'No public repositories found', '#')];
  }

  const projects = await Promise.allSettled(
    filteredRepos.map(async (repo) => {
      const [commits, languages, issues, readme] = await Promise.all([
        getLatestCommits(repo.name),
        getRepositoryLanguages(repo.name),
        getRepositoryIssues(repo.name),
        getReadme(repo.name)
      ]);

      return {
        id: repo.id,
        name: repo.name,
        title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: repo.description || CUSTOM_DESCRIPTIONS[repo.name] || null,
        readme,
        readmePreview: createReadmePreview(readme),
        commits, languages, issues,
        url: repo.html_url,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        watchers: repo.watchers_count || 0,
        language: repo.language,
        topics: repo.topics || [],
        license: repo.license?.name || 'No license',
        size: repo.size || 0,
        created: repo.created_at,
        updated: repo.updated_at,
        pushed: repo.pushed_at,
        openIssues: repo.open_issues_count || 0,
        defaultBranch: repo.default_branch,
        visibility: repo.visibility || 'public',
        hasWiki: repo.has_wiki || false,
        hasPages: repo.has_pages || false,
        hasProjects: repo.has_projects || false,
      };
    })
  );

  const successfulProjects = projects
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  if (successfulProjects.length > 0) {
    setCache(successfulProjects);
  }

  return successfulProjects.length > 0 ? successfulProjects : [createFallbackProject('Error', 'Failed to load projects', '#')];
}

export function clearGitHubCache() {
  githubCache.repositories = null;
  githubCache.lastFetched = null;
}

export function getGitHubCacheStatus() {
  return { cached: shouldUseCache(), lastFetched: githubCache.lastFetched, ttl: githubCache.cacheTTL };
}

export { getLatestCommits, getRepositoryLanguages, getRepositoryIssues };
