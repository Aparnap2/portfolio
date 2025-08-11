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

async function getLatestCommits(repoName, count = 2) {
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
      throw new Error(`GitHub API error for commits: ${response.status}`);
    }

    const commits = await response.json();
    return commits.map(commit => ({
      message: commit.commit.message.split('\n')[0], // Only the first line
      url: commit.html_url,
      date: commit.commit.author.date,
    }));
  } catch (error) {
    console.error(`Error fetching commits for ${repoName}:`, error);
    return [];
  }
}

export async function getTopRepositories(count = 6) {
  let repos = [];
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=${count}&type=owner`,
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
      throw new Error(`GitHub API error for repos: ${response.status}`);
    }
    
    repos = await response.json();

  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
  
  const projects = repos
    .filter(repo => !repo.fork && !repo.archived)
    .slice(0, count)
    .map(repo => ({
      id: repo.id,
      name: repo.name,
      title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: repo.description || 'No description available',
      readme: null,
      readmePreview: { heading: 'README', text: 'Click to load preview' },
      commits: [],
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language,
      updated: repo.updated_at,
    }));

  return projects;
}
