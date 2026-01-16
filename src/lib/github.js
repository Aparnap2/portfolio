const GITHUB_USERNAME = 'aparnap2';
const GITHUB_API_URL = 'https://api.github.com';

// Custom descriptions for repos without GitHub descriptions
const CUSTOM_DESCRIPTIONS = {
  'Self_Healing_supply_chain_ai': 'AI-powered supply chain automation with self-healing capabilities for production resilience.',
  'docluflow_ai': 'Document processing and workflow automation using AI agents for enterprise operations.',
  'churn_assasin': 'Machine learning system for predicting and preventing customer churn in SaaS businesses.',
  'runway_guard': 'Financial runway monitoring and burn rate analysis for startups and enterprises.',
  'autoadmin-APP': 'Autonomous admin operations agent for IT infrastructure management.',
  'agentstack': 'CLI tool and framework for building and deploying AI agents in production.',
};

// Cache for GitHub API responses
const githubCache = {
  repositories: null,
  lastFetched: null,
  cacheTTL: 5 * 60 * 1000, // 5 minutes cache
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

function clearCache() {
  githubCache.repositories = null;
  githubCache.lastFetched = null;
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

  return {
    heading,
    text: text || 'No preview available.',
  };
}

export async function getReadme(repoName) {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repoName}/readme`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3.json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) return 'No README found.';
      throw new Error(`GitHub API error for README: ${response.status}`);
    }

    const readme = await response.json();
    return Buffer.from(readme.content, 'base64').toString('utf-8');
  } catch (error) {
    console.error(`Error fetching README for ${repoName}:`, error);
    return 'Error fetching README.';
  }
}

async function getLatestCommits(repoName, count = 5) {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repoName}/commits?per_page=${count}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        },
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }
    );

    if (!response.ok) {
      console.error(`GitHub API error for commits: ${response.status} - ${response.statusText}`);
      return [];
    }

    const commits = await response.json();
    return commits.map(commit => ({
      message: commit.commit.message.split('\n')[0],
      fullMessage: commit.commit.message,
      url: commit.html_url,
      sha: commit.sha.substring(0, 7),
      date: commit.commit.author.date,
      author: commit.commit.author.name,
    }));
  } catch (error) {
    console.error(`Error fetching commits for ${repoName}:`, error);
    return [];
  }
}

async function getRepositoryLanguages(repoName) {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repoName}/languages`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        },
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }
    );

    if (!response.ok) {
      console.error(`GitHub API error for languages: ${response.status} - ${response.statusText}`);
      return {};
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching languages for ${repoName}:`, error);
    return {};
  }
}

async function getRepositoryIssues(repoName, count = 5) {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repoName}/issues?state=all&per_page=${count}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        },
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }
    );

    if (!response.ok) {
      console.error(`GitHub API error for issues: ${response.status} - ${response.statusText}`);
      return [];
    }

    const issues = await response.json();
    return issues.filter(issue => !issue.pull_request).map(issue => ({
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      number: issue.number,
      created: issue.created_at,
      labels: issue.labels.map(label => label.name),
    }));
  } catch (error) {
    console.error(`Error fetching issues for ${repoName}:`, error);
    return [];
  }
}

export async function getTopRepositories(count = 6) {
  // Check cache first
  if (shouldUseCache()) {
    console.log('Using cached GitHub repositories');
    return githubCache.repositories;
  }
  let repos = [];
  try {
    // Fetch more repositories to account for filtered ones (forks, excluded repos, etc.)
    const fetchCount = Math.min(count * 3, 100); // Fetch triple to get better repos
    // Sort by stars to get the most interesting repos first
    const response = await fetch(
      `${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos?sort=stargazers_count&per_page=${fetchCount}&type=owner`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        },
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }
    );

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} - ${response.statusText}`);
      // Return fallback data instead of empty array to prevent infinite loops
      return [{
        id: 0,
        name: 'API Error',
        title: 'API Error',
        description: 'GitHub API returned an error',
        readme: null,
        readmePreview: { heading: 'API Error', text: 'Could not fetch GitHub data' },
        commits: [],
        languages: {},
        issues: [],
        url: '#',
        stars: 0,
        forks: 0,
        watchers: 0,
        language: 'None',
        topics: [],
        license: 'No license',
        size: 0,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        pushed: new Date().toISOString(),
        openIssues: 0,
        defaultBranch: 'main',
        visibility: 'public',
        hasWiki: false,
        hasPages: false,
        hasProjects: false,
      }];
    }

    repos = await response.json();
    console.log(`Fetched ${repos.length} repositories from GitHub`);

    // If GitHub API returns empty array, return fallback data
    if (!repos || repos.length === 0) {
      console.warn('GitHub API returned empty array');
      return [{
        id: 0,
        name: 'No Repositories',
        title: 'No Repositories',
        description: 'No GitHub repositories found',
        readme: null,
        readmePreview: { heading: 'No Repositories', text: 'No repositories available' },
        commits: [],
        languages: {},
        issues: [],
        url: '#',
        stars: 0,
        forks: 0,
        watchers: 0,
        language: 'None',
        topics: [],
        license: 'No license',
        size: 0,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        pushed: new Date().toISOString(),
        openIssues: 0,
        defaultBranch: 'main',
        visibility: 'public',
        hasWiki: false,
        hasPages: false,
        hasProjects: false,
      }];
    }

  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    // Return fallback data instead of empty array to prevent infinite loops
    return [{
      id: 0,
      name: 'Network Error',
      title: 'Network Error',
      description: 'Could not connect to GitHub API',
      readme: null,
      readmePreview: { heading: 'Network Error', text: 'Connection failed' },
      commits: [],
      languages: {},
      issues: [],
      url: '#',
      stars: 0,
      forks: 0,
      watchers: 0,
      language: 'None',
      topics: [],
      license: 'No license',
      size: 0,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      pushed: new Date().toISOString(),
      openIssues: 0,
      defaultBranch: 'main',
      visibility: 'public',
      hasWiki: false,
      hasPages: false,
      hasProjects: false,
    }];
  }
  
  const filteredRepos = repos
    .filter(repo => {
      // Skip private repos, forks, archived, and specific excluded repos
      if (repo.private || repo.fork || repo.archived) return false;
      if (repo.name === 'portfolio' || repo.name === GITHUB_USERNAME) return false;
      return true;
    })
    .slice(0, count);

  // Ensure we always return at least some data to prevent infinite loops
  // If all repos were filtered out, return a fallback empty project structure
  if (filteredRepos.length === 0) {
    console.warn('No repositories passed filters, returning fallback data');
    return [{
      id: 0,
      name: 'No Projects Available',
      title: 'No Projects Available',
      description: 'No GitHub projects available at this time',
      readme: null,
      readmePreview: { heading: 'No Projects', text: 'No projects to display' },
      commits: [],
      languages: {},
      issues: [],
      url: '#',
      stars: 0,
      forks: 0,
      watchers: 0,
      language: 'None',
      topics: [],
      license: 'No license',
      size: 0,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      pushed: new Date().toISOString(),
      openIssues: 0,
      defaultBranch: 'main',
      visibility: 'public',
      hasWiki: false,
      hasPages: false,
      hasProjects: false,
    }];
  }
  
  const projects = await Promise.allSettled(
    filteredRepos.map(async (repo) => {
      try {
        const [commits, languages, issues] = await Promise.all([
          getLatestCommits(repo.name),
          getRepositoryLanguages(repo.name),
          getRepositoryIssues(repo.name)
        ]);

        return {
          id: repo.id,
          name: repo.name,
          title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          // Use GitHub description, fallback to custom descriptions, then hide if none
          description: repo.description || CUSTOM_DESCRIPTIONS[repo.name] || null,
          readme: null,
          readmePreview: { heading: 'README', text: 'Click to load preview' },
          commits,
          languages,
          issues,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          language: repo.language,
          topics: repo.topics || [],
          license: repo.license?.name || 'No license',
          size: repo.size,
          created: repo.created_at,
          updated: repo.updated_at,
          pushed: repo.pushed_at,
          openIssues: repo.open_issues_count,
          defaultBranch: repo.default_branch,
          visibility: repo.visibility || 'public',
          hasWiki: repo.has_wiki,
          hasPages: repo.has_pages,
          hasProjects: repo.has_projects,
        };
      } catch (error) {
        console.error(`Error processing repo ${repo.name}:`, error);
        // Return fallback project data
        return {
          id: repo.id,
          name: repo.name,
          title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: repo.description || 'No description available',
          readme: null,
          readmePreview: { heading: 'README', text: 'Error loading preview' },
          commits: [],
          languages: {},
          issues: [],
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
      }
    })
  );

  // Filter out failed promises and return successful projects
  const successfulProjects = projects
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  // Cache the result
  setCache(successfulProjects);
  return successfulProjects;
}

// Export cache management functions
export function clearGitHubCache() {
  clearCache();
}

export function getGitHubCacheStatus() {
  return {
    cached: shouldUseCache(),
    lastFetched: githubCache.lastFetched,
    ttl: githubCache.cacheTTL
  };
}

export { getLatestCommits, getRepositoryLanguages, getRepositoryIssues };