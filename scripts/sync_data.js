// scripts/sync_data.js
import dotenv from 'dotenv';
// Assuming .env is in the project root, and this script is in /scripts
dotenv.config({ path: '../.env' });

// import { getLinkedInProfile, getLinkedInPosts } from '../src/lib/linkedin.js'; // LinkedIn removed
import { getGithubUserRepos, getGithubRepoReadme } from '../src/lib/github.js';
import { processAndEmbed } from '../src/lib/data_processor.js';
import { getEmbeddingsCollection } from '../src/lib/astradb.js';

async function syncAllData() {
    console.log('Starting data synchronization process...');

    // LINKEDIN_ACCESS_TOKEN removed
    const { GITHUB_ACCESS_TOKEN, GITHUB_USERNAME, GOOGLE_API_KEY, ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT } = process.env;

    // LinkedIn check removed
    if (!GITHUB_ACCESS_TOKEN) {
        console.error('Missing required environment variable: GITHUB_ACCESS_TOKEN.');
        return;
    }
    if (!GITHUB_USERNAME) {
        console.error('Missing required environment variable: GITHUB_USERNAME.');
        return;
    }
    if (!GOOGLE_API_KEY) { // Required by data_processor
        console.error('Missing required environment variable: GOOGLE_API_KEY.');
        return;
    }
    if (!ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_API_ENDPOINT) { // Required by astradb
        console.error('Missing required environment variables for AstraDB: ASTRA_DB_APPLICATION_TOKEN and/or ASTRA_DB_API_ENDPOINT.');
        return;
    }


    const collection = await getEmbeddingsCollection(); // Get collection early for deletions

    // LinkedIn Data Section Removed

    // GitHub Data (Adjusted numbering if any)
    console.log('\n--- Processing GitHub Data ---');
    try {
        const repos = await getGithubUserRepos(GITHUB_ACCESS_TOKEN, GITHUB_USERNAME);
        if (repos && repos.length > 0) {
            console.log(`Fetched ${repos.length} GitHub repositories for user ${GITHUB_USERNAME}.`);
            for (const repo of repos) {
                if (repo.name && repo.owner && repo.owner.login) {
                    const repoSource = `github-readme:${repo.full_name}`; // Use full_name for uniqueness
                    console.log(`Processing GitHub repo: ${repo.full_name}. Source: ${repoSource}`);

                    // Delete existing data for this specific repo's README
                    console.log(`Deleting existing documents for source: ${repoSource}`);
                    const deleteRepoResult = await collection.deleteMany({ "source": repoSource });
                    console.log(`Deleted ${deleteRepoResult.deletedCount || 0} old documents for ${repoSource}.`);

                    const readmeContent = await getGithubRepoReadme(GITHUB_ACCESS_TOKEN, repo.owner.login, repo.name);
                    if (readmeContent && readmeContent.trim()) {
                        const processedReadmeDocs = await processAndEmbed(
                            readmeContent,
                            repoSource,
                            { repository: repo.full_name, type: 'readme', private: repo.private }
                        );
                        if (processedReadmeDocs && processedReadmeDocs.length > 0) {
                           const documentsForAstra = processedReadmeDocs.map(doc => ({
                                text: doc.pageContent, $vector: doc.embedding, source: doc.source, ...doc.metadata
                           }));
                           const insertReadmeResult = await collection.insertMany(documentsForAstra);
                           console.log(`Inserted ${insertReadmeResult.status?.insertedIds?.length || 0} new README document chunks for ${repoSource}.`);
                        }
                    } else {
                        console.log(`No README content for ${repo.full_name} or content is empty. No new documents inserted.`);
                    }
                } else {
                     console.warn('Skipping a repository due to missing name or owner information.');
                }
            }
        } else {
            console.warn(`Could not fetch GitHub repositories for ${GITHUB_USERNAME} or no repositories found.`);
        }
    } catch (error) {
        console.error('Error processing GitHub data:', error.message || error, error.stack);
    }

    // Note: Overall insertion summary is removed as insertions are now per-section.
    console.log('\nData synchronization process finished.');
}

// Export for testing and conditional execution
export { syncAllData };

// Guard direct execution: only run if executed directly, not when imported
if (process.argv[1] && process.argv[1].endsWith('sync_data.js')) { // More robust check than require.main
    syncAllData().catch(error => {
        console.error('Unhandled critical error during the sync process:', error.message || error, error.stack);
        if (error.stack) { // error.stack is already logged by the above line if present.
            // console.error(error.stack); // This would be redundant.
        }
        process.exit(1);
    });
}
