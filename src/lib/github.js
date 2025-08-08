const GITHUB_USERNAME = 'aparnap2';
const GITHUB_API_URL = 'https://api.github.com';

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

export async function getTopRepositories(count = 5) {
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
          return {
            id: repo.id,
            title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: repo.description || 'No description available',
            readme: readmeContent,
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