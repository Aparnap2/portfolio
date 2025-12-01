const GITHUB_USERNAME = 'aparnap2';
const GITHUB_API_URL = 'https://api.github.com';

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
  let repos = [];
  try {
    // Fetch more repositories to account for filtered ones (forks, excluded repos, etc.)
    const fetchCount = Math.min(count * 2, 100); // Fetch double, max 100
    const response = await fetch(
      `${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=${fetchCount}&type=owner`,
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
      // Return empty array instead of throwing to prevent page crash
      return [];
    }
    
    repos = await response.json();
    console.log(`Fetched ${repos.length} repositories from GitHub`);

  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    // Return empty array instead of throwing to prevent page crash
    return [];
  }
  
  const filteredRepos = repos
    .filter(repo => {
      // Skip private repos and specific excluded repos
      if (repo.private || repo.fork || repo.archived) return false;
      if (repo.name === 'portfolio' || repo.name === 'Aparnap2') return false;
      return true;
    })
    .slice(0, count);
  
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
          description: repo.description || 'No description available',
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
  return projects
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
}

export { getLatestCommits, getRepositoryLanguages, getRepositoryIssues };