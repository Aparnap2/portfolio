// src/lib/__tests__/github.test.js
import axios from 'axios';
import { getGithubUserRepos, getGithubRepoReadme } from '../github';

jest.mock('axios');

describe('GitHub API Client', () => {
    const mockToken = 'test-github-token';
    const mockUsername = 'testuser';
    const mockRepo = 'test-repo';

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getGithubUserRepos', () => {
        it('should fetch user repos successfully', async () => {
            const mockReposData = [{ name: 'repo1' }, { name: 'repo2' }];
            axios.get.mockResolvedValue({ data: mockReposData });

            const repos = await getGithubUserRepos(mockToken, mockUsername);

            expect(axios.get).toHaveBeenCalledWith(
                `https://api.github.com/users/${mockUsername}/repos?type=owner&sort=updated&per_page=10`,
                expect.objectContaining({
                    headers: {
                        'Authorization': `token ${mockToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                })
            );
            expect(repos).toEqual(mockReposData);
        });

        it('should return null on API error when fetching repos', async () => {
            axios.get.mockRejectedValue(new Error('API Error'));
            const repos = await getGithubUserRepos(mockToken, mockUsername);
            expect(repos).toBeNull();
        });

        it('should log error details if error.response exists for repos', async () => {
            const errorResponse = { response: { data: 'Error data', status: 500, headers: {} } };
            axios.get.mockRejectedValue(errorResponse);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await getGithubUserRepos(mockToken, mockUsername);

            expect(consoleErrorSpy).toHaveBeenCalledWith(`Error fetching GitHub repos for ${mockUsername}:`);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Data:', 'Error data');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Status:', 500);
            consoleErrorSpy.mockRestore();
        });

        it('should require access token for user repos', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const repos = await getGithubUserRepos(null, mockUsername);
            expect(repos).toBeNull();
            expect(axios.get).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Access Token is required for getGithubUserRepos.');
            consoleErrorSpy.mockRestore();
        });

        it('should require username for user repos', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const repos = await getGithubUserRepos(mockToken, null);
            expect(repos).toBeNull();
            expect(axios.get).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub username is required for getGithubUserRepos.');
            consoleErrorSpy.mockRestore();
        });
    });

    describe('getGithubRepoReadme', () => {
        it('should fetch README content successfully', async () => {
            const mockReadmeContent = '# Test README';
            axios.get.mockResolvedValue({ data: mockReadmeContent });

            const readme = await getGithubRepoReadme(mockToken, mockUsername, mockRepo);

            expect(axios.get).toHaveBeenCalledWith(
                `https://api.github.com/repos/${mockUsername}/${mockRepo}/readme`,
                expect.objectContaining({
                    headers: {
                        'Authorization': `token ${mockToken}`,
                        'Accept': 'application/vnd.github.v3.raw'
                    }
                })
            );
            expect(readme).toEqual(mockReadmeContent);
        });

        it('should return null if README is not found (404)', async () => {
            const error = new Error('Not Found');
            error.response = { status: 404 };
            axios.get.mockRejectedValue(error);
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const readme = await getGithubRepoReadme(mockToken, mockUsername, mockRepo);

            expect(readme).toBeNull();
            expect(consoleLogSpy).toHaveBeenCalledWith(`README not found for repository ${mockUsername}/${mockRepo}. This is often not an error.`);
            consoleLogSpy.mockRestore();
        });

        it('should return null on non-404 API error for README', async () => {
            const error = new Error('Server Error');
            error.response = { status: 500, data: 'Server error details' };
            axios.get.mockRejectedValue(error);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const readme = await getGithubRepoReadme(mockToken, mockUsername, mockRepo);

            expect(readme).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith(`Error fetching GitHub README for ${mockUsername}/${mockRepo}:`);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Data:', 'Server error details');
            consoleErrorSpy.mockRestore();
        });

        it('should require access token for readme', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const readme = await getGithubRepoReadme(null, mockUsername, mockRepo);
            expect(readme).toBeNull();
            expect(axios.get).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Access Token is required for getGithubRepoReadme.');
            consoleErrorSpy.mockRestore();
        });

        it('should require owner for readme', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const readme = await getGithubRepoReadme(mockToken, null, mockRepo);
            expect(readme).toBeNull();
            expect(axios.get).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Repository owner username is required.');
            consoleErrorSpy.mockRestore();
        });

        it('should require repo name for readme', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const readme = await getGithubRepoReadme(mockToken, mockUsername, null);
            expect(readme).toBeNull();
            expect(axios.get).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Repository name is required.');
            consoleErrorSpy.mockRestore();
        });
    });
});
