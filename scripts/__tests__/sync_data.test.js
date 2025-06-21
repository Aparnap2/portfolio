// scripts/__tests__/sync_data.test.js
import { syncAllData } from '../sync_data';

// Mocking entire modules
jest.mock('../../src/lib/linkedin.js');
jest.mock('../../src/lib/github.js');
jest.mock('../../src/lib/data_processor.js');
jest.mock('../../src/lib/astradb.js');

// Import mocks to configure them
import { getLinkedInProfile, getLinkedInPosts } from '../../src/lib/linkedin.js';
import { getGithubUserRepos, getGithubRepoReadme } from '../../src/lib/github.js';
import { processAndEmbed } from '../../src/lib/data_processor.js';
import { getEmbeddingsCollection } from '../../src/lib/astradb.js';

describe('Data Sync Service', () => {
    const mockLinkedInToken = 'li-token';
    const mockGitHubToken = 'gh-token';
    const mockGitHubUser = 'test-gh-user';

    // Mock AstraDB collection methods
    const mockDeleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
    const mockInsertMany = jest.fn().mockResolvedValue({ status: { insertedIds: ['id1'] } }); // Adjusted for DataAPIClient structure
    const mockCollection = {
        deleteMany: mockDeleteMany,
        insertMany: mockInsertMany,
    };

    let originalEnv;

    beforeAll(() => {
        originalEnv = { ...process.env }; // Store original environment variables
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mock implementations for imported functions
        getLinkedInProfile.mockResolvedValue({
            id: 'li-user123',
            localizedFirstName: 'LinkedIn',
            localizedLastName: 'User',
            headline: 'Test LinkedIn Profile Headline'
            // summary field is not typically in basic profile, headline is more reliable
        });
        getLinkedInPosts.mockResolvedValue([
            { id: 'post1', commentary: 'Test LinkedIn Post 1' },
            { id: 'post2', specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: {text: 'Test LinkedIn Post 2'} } } }
        ]);
        getGithubUserRepos.mockResolvedValue([
            { name: 'repo1', owner: { login: mockGitHubUser }, full_name: `${mockGitHubUser}/repo1` },
            { name: 'repo2', owner: { login: mockGitHubUser }, full_name: `${mockGitHubUser}/repo2` }
        ]);
        getGithubRepoReadme.mockImplementation(async (token, owner, repoName) => {
            if (repoName === 'repo1') return '# Repo1 README Content';
            return null; // repo2 has no README for this test
        });
        processAndEmbed.mockImplementation(async (text, source, metadata) => {
            // Return one chunk per call for simplicity in testing counts
            return [{
                text: `Processed: ${text.substring(0, 20)}...`,
                embedding: [0.1, 0.2, 0.3],
                source,
                metadata,
                pageContent: `Processed: ${text.substring(0, 20)}...`
            }];
        });
        getEmbeddingsCollection.mockResolvedValue(mockCollection);

        // Mock environment variables required by sync_data.js
        process.env.LINKEDIN_ACCESS_TOKEN = mockLinkedInToken;
        process.env.GITHUB_ACCESS_TOKEN = mockGitHubToken;
        process.env.GITHUB_USERNAME = mockGitHubUser;
        process.env.GOOGLE_API_KEY = "test-google-api-key"; // from data_processor
        process.env.ASTRA_DB_APPLICATION_TOKEN = "test-astra-db-token"; // from astradb
        process.env.ASTRA_DB_API_ENDPOINT = "test-astra-db-endpoint"; // from astradb
    });

    afterAll(() => {
        process.env = originalEnv; // Restore original environment variables
    });

    it('should orchestrate fetching, processing, deleting, and storing data', async () => {
        await syncAllData();

        // Check LinkedIn calls
        expect(getLinkedInProfile).toHaveBeenCalledWith(mockLinkedInToken);
        expect(getLinkedInPosts).toHaveBeenCalledWith(mockLinkedInToken, 'li-user123');

        // Check GitHub calls
        expect(getGithubUserRepos).toHaveBeenCalledWith(mockGitHubToken, mockGitHubUser);
        expect(getGithubRepoReadme).toHaveBeenCalledWith(mockGitHubToken, mockGitHubUser, 'repo1');
        expect(getGithubRepoReadme).toHaveBeenCalledWith(mockGitHubToken, mockGitHubUser, 'repo2'); // Called even if it returns null

        // Check processing calls (examples)
        expect(processAndEmbed).toHaveBeenCalledWith(expect.stringContaining('LinkedIn User'), 'linkedin-profile:li-user123', expect.any(Object));
        expect(processAndEmbed).toHaveBeenCalledWith('Test LinkedIn Post 1', 'linkedin-post:li-user123:post1', expect.any(Object));
        expect(processAndEmbed).toHaveBeenCalledWith('Test LinkedIn Post 2', 'linkedin-post:li-user123:post2', expect.any(Object));
        expect(processAndEmbed).toHaveBeenCalledWith('# Repo1 README Content', `github-readme:${mockGitHubUser}/repo1`, expect.any(Object));
        // processAndEmbed should NOT have been called for repo2's README as it was null
        expect(processAndEmbed).not.toHaveBeenCalledWith(null, `github-readme:${mockGitHubUser}/repo2`, expect.any(Object));


        // Check AstraDB calls
        expect(getEmbeddingsCollection).toHaveBeenCalledTimes(1); // Called once at the start

        // Deletion checks
        expect(mockDeleteMany).toHaveBeenCalledWith({ "source": "linkedin-profile:li-user123" });
        expect(mockDeleteMany).toHaveBeenCalledWith({ "source": { "$regex": "^linkedin-post:li-user123" } });
        expect(mockDeleteMany).toHaveBeenCalledWith({ "source": `github-readme:${mockGitHubUser}/repo1` });
        expect(mockDeleteMany).toHaveBeenCalledWith({ "source": `github-readme:${mockGitHubUser}/repo2` }); // Deletion attempted even if no content to insert

        // Insertion checks - ensure $vector is used and data maps correctly
        expect(mockInsertMany).toHaveBeenCalledTimes(3); // Profile, Posts (batched), Repo1 README

        expect(mockInsertMany).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    text: expect.stringContaining('Processed: LinkedIn User'),
                    $vector: [0.1, 0.2, 0.3],
                    source: 'linkedin-profile:li-user123'
                })
            ])
        );
        expect(mockInsertMany).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ source: 'linkedin-post:li-user123:post1' }),
                expect.objectContaining({ source: 'linkedin-post:li-user123:post2' })
            ])
        );
         expect(mockInsertMany).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ source: `github-readme:${mockGitHubUser}/repo1` })
            ])
        );
    });

    it('should handle missing LINKEDIN_ACCESS_TOKEN gracefully', async () => {
        delete process.env.LINKEDIN_ACCESS_TOKEN;
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await syncAllData();

        expect(consoleErrorSpy).toHaveBeenCalledWith('Missing required environment variable: LINKEDIN_ACCESS_TOKEN.');
        // Check that subsequent operations were not attempted
        expect(getLinkedInProfile).not.toHaveBeenCalled();
        expect(getGithubUserRepos).not.toHaveBeenCalled(); // Should not proceed if one critical env var is missing at the start

        consoleErrorSpy.mockRestore();
    });

    it('should proceed with GitHub if LinkedIn profile fetch fails but token was present', async () => {
        getLinkedInProfile.mockResolvedValue(null); // Simulate LinkedIn profile fetch failure

        await syncAllData();

        expect(getLinkedInProfile).toHaveBeenCalledWith(mockLinkedInToken);
        expect(getLinkedInPosts).not.toHaveBeenCalled(); // Since profile failed
        // Deletions for LinkedIn profile/posts might still be called if profile ID was hypothetically known before failure
        // but in this setup, profile.id is needed.
        // Let's check if GitHub part still runs
        expect(getGithubUserRepos).toHaveBeenCalledWith(mockGitHubToken, mockGitHubUser);
        expect(mockDeleteMany).toHaveBeenCalledWith({ "source": `github-readme:${mockGitHubUser}/repo1` });
        expect(mockInsertMany).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ source: `github-readme:${mockGitHubUser}/repo1` })
            ])
        );
    });

    it('should handle errors during LinkedIn processing and continue with GitHub', async () => {
        getLinkedInProfile.mockRejectedValue(new Error("LinkedIn API Down"));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await syncAllData();

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error processing LinkedIn data:", "LinkedIn API Down", expect.any(String)); // Error stack
        // GitHub should still be processed
        expect(getGithubUserRepos).toHaveBeenCalled();
        expect(mockInsertMany).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({source: `github-readme:${mockGitHubUser}/repo1`})])
        );
        consoleErrorSpy.mockRestore();
    });

    it('should handle errors during GitHub processing', async () => {
        getGithubUserRepos.mockRejectedValue(new Error("GitHub API Down"));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await syncAllData();
        // LinkedIn should have been processed
        expect(getLinkedInProfile).toHaveBeenCalled();
        expect(mockInsertMany).toHaveBeenCalledWith(
             expect.arrayContaining([expect.objectContaining({source: 'linkedin-profile:li-user123'})])
        );
        // Error for GitHub
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error processing GitHub data:", "GitHub API Down", expect.any(String));
        consoleErrorSpy.mockRestore();
    });

});
