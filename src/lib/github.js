const GITHUB_USERNAME = 'aparnap2';
const GITHUB_API_URL = 'https://api.github.com';

function createReadmePreview(readmeContent) {
  if (!readmeContent || typeof readmeContent !== 'string') {
    return { heading: 'README', text: 'No preview available.' };
  }

  const lines = readmeContent.split('\n');

  // Find the first heading
  const headingLine = lines.find(line => line.startsWith('#'));
  const heading = headingLine ? headingLine.replace(/#/g, '').trim() : 'README';

  // Find the first non-empty paragraph after the heading
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

async function getReadme(repoName) {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repoName}/readme`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3.json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return 'No README found.';
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const readme = await response.json();
    const content = Buffer.from(readme.content, 'base64').toString('utf-8');
    return content;
  } catch (error) {
    console.error(`Error fetching README for ${repoName}:`, error);
    return 'Error fetching README.';
  }
}

export async function getTopRepositories(count = 6) {
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
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    const projects = await Promise.all(
      repos
        .filter(repo => !repo.fork && !repo.archived)
        .slice(0, count)
        .map(async repo => {
          const readmeContent = await getReadme(repo.name);
          const readmePreview = createReadmePreview(readmeContent);
          return {
            id: repo.id,
            title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: repo.description || 'No description available',
            readme: readmeContent,
            readmePreview,
            url: repo.html_url,
            stars: repo.stargazers_count,
            language: repo.language,
            updated: repo.updated_at,
          };
        })
    );

    return projects;
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return [];
  }
}