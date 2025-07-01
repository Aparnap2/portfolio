// src/lib/github.js
import axios from 'axios';
// import { RateLimiter } from 'limiter';

// It's good practice to manage the token securely, e.g., via environment variables.
// const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

// Placeholder for rate limiter configuration.
// GitHub's primary rate limit is typically 5000 requests per hour for authenticated users.
// Consult GitHub documentation for specific limits.
// const limiter = new RateLimiter({ tokensPerInterval: 5000, interval: 'hour', fireImmediately: true });

const GITHUB_API_BASE_URL = 'https://api.github.com';

/**
 * Fetches a user's repositories from GitHub.
 * @param {string} accessToken - GitHub Personal Access Token.
 * @param {string} username - The GitHub username.
 * @returns {Promise<Array|null>} An array of repository objects or null if an error occurs.
 */
export async function getGithubUserRepos(accessToken, username) {
    if (!accessToken) {
        console.error('GitHub Access Token is required for getGithubUserRepos.');
        return null;
    }
    if (!username) {
        console.error('GitHub username is required for getGithubUserRepos.');
        return null;
    }

    // Fetches repositories owned by the user, sorted by last update, limited to 10 for this example.
    const reposUrl = `${GITHUB_API_BASE_URL}/users/${username}/repos?type=owner&sort=updated&per_page=10`;
    console.log(`Fetching GitHub user repos from: ${reposUrl}`);

    try {
        // TODO: Integrate rate limiting if API calls become frequent.
        // Example: if (limiter) await limiter.removeTokens(1);
        const response = await axios.get(reposUrl, {
            headers: {
                'Authorization': `token ${accessToken}`, // or `Bearer ${accessToken}` works too
                'Accept': 'application/vnd.github.v3+json' // Standard header for GitHub API v3
            }
        });
        console.log(`Found ${response.data.length} repositories for user ${username}.`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching GitHub repos for ${username}:`);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Request:', error.request);
        } else {
            console.error('Error Message:', error.message);
        }
        return null;
    }
}

/**
 * Fetches the raw content of a repository's README from GitHub.
 * @param {string} accessToken - GitHub Personal Access Token.
 * @param {string} owner - The username of the repository owner.
 * @param {string} repo - The name of the repository.
 * @returns {Promise<string|null>} The raw README content as a string or null if an error occurs or README is not found.
 */
export async function getGithubRepoReadme(accessToken, owner, repo) {
    if (!accessToken) {
        console.error('GitHub Access Token is required for getGithubRepoReadme.');
        return null;
    }
    if (!owner) {
        console.error('Repository owner username is required.');
        return null;
    }
    if (!repo) {
        console.error('Repository name is required.');
        return null;
    }

    const readmeUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/readme`;
    console.log(`Fetching README from: ${readmeUrl}`);

    try {
        // TODO: Integrate rate limiting.
        // Example: if (limiter) await limiter.removeTokens(1);
        const response = await axios.get(readmeUrl, {
            headers: {
                'Authorization': `token ${accessToken}`,
                // This 'Accept' header is crucial for getting the raw content directly.
                // Without it, the API returns a JSON object with base64 encoded content.
                'Accept': 'application/vnd.github.v3.raw'
            }
        });
        // When 'application/vnd.github.v3.raw' is used, response.data is the raw string content.
        console.log(`Successfully fetched README for ${owner}/${repo}.`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(`README not found for repository ${owner}/${repo}. This is often not an error.`);
            return null; // Or return an empty string: return "";
        }
        console.error(`Error fetching GitHub README for ${owner}/${repo}:`);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Request:', error.request);
        } else {
            console.error('Error Message:', error.message);
        }
        return null;
    }
}

// Example usage (for local testing, ensure .env is configured with GITHUB_ACCESS_TOKEN)
/*
(async () => {
    const token = process.env.GITHUB_ACCESS_TOKEN;
    // Replace with a GitHub username that has public repositories for testing
    const testUsername = 'octocat'; // A common test username like GitHub's octocat

    if (token && testUsername) {
        console.log(`\nTesting GitHub functions with user: ${testUsername}`);
        const repos = await getGithubUserRepos(token, testUsername);

        if (repos && repos.length > 0) {
            console.log(`\nFound ${repos.length} repositories for ${testUsername}. Testing README fetching for a few:`);
            // Test with a few repositories, e.g., the first 2 or a specific one if known
            for (const repo of repos.slice(0, Math.min(2, repos.length))) { // Test with up to 2 repos
                if (repo.name && repo.owner && repo.owner.login) {
                    console.log(`\nFetching README for ${repo.owner.login}/${repo.name}...`);
                    const readmeContent = await getGithubRepoReadme(token, repo.owner.login, repo.name);
                    if (readmeContent !== null) { // Check for null specifically, as empty string is a valid README
                        console.log(`README for ${repo.owner.login}/${repo.name} (first 100 chars):`);
                        console.log(readmeContent.substring(0, 100) + (readmeContent.length > 100 ? '...' : ''));
                    } else {
                        console.log(`No README content returned for ${repo.owner.login}/${repo.name}.`);
                    }
                } else {
                    console.log('Repository object missing name or owner info:', repo);
                }
            }
        } else {
            console.log(`No repositories found for ${testUsername} or an error occurred.`);
        }
    } else {
        let reason = !token ? "GITHUB_ACCESS_TOKEN not found in .env. " : "";
        reason += !testUsername ? "Test username not set. " : "";
        console.log(`Skipping GitHub API tests: ${reason}`);
    }
})();
*/
