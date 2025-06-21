// scripts/sync_data.js
import dotenv from 'dotenv';
// Assuming .env is in the project root, and this script is in /scripts
dotenv.config({ path: '../.env' });

import { getLinkedInProfile, getLinkedInPosts } from '../src/lib/linkedin.js';
import { getGithubUserRepos, getGithubRepoReadme } from '../src/lib/github.js';
import { processAndEmbed } from '../src/lib/data_processor.js';
import { getEmbeddingsCollection } from '../src/lib/astradb.js';

async function syncAllData() {
    console.log('Starting data synchronization process...');

    const { LINKEDIN_ACCESS_TOKEN, GITHUB_ACCESS_TOKEN, GITHUB_USERNAME, GOOGLE_API_KEY, ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT } = process.env;

    if (!LINKEDIN_ACCESS_TOKEN) {
        console.error('Missing required environment variable: LINKEDIN_ACCESS_TOKEN.');
        return;
    }
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

    // 1. LinkedIn Data
    console.log('\n--- Processing LinkedIn Data ---');
    try {
        const profile = await getLinkedInProfile(LINKEDIN_ACCESS_TOKEN);
        if (profile && profile.id) {
            const profileSource = `linkedin-profile:${profile.id}`;
            console.log(`Processing LinkedIn profile for ID: ${profile.id}. Source: ${profileSource}`);
            console.log(`Name: ${profile.localizedFirstName} ${profile.localizedLastName}`);

            // Delete existing data for this specific profile source
            console.log(`Deleting existing documents for source: ${profileSource}`);
            const deleteProfileResult = await collection.deleteMany({ "source": profileSource });
            console.log(`Deleted ${deleteProfileResult.deletedCount || 0} old profile documents for ${profileSource}.`);

            let profileTextContent = `${profile.localizedFirstName} ${profile.localizedLastName}\n`;
            profileTextContent += `Headline: ${profile.headline || ''}\n`;
            // Add other fields as necessary, e.g., profile.summary if available and desired

            if (profileTextContent.trim().length > (profile.localizedFirstName + " " + profile.localizedLastName).length + 2) {
                const processedProfileDocs = await processAndEmbed(
                    profileTextContent,
                    profileSource,
                    { userId: profile.id, type: 'profile' }
                );
                if (processedProfileDocs && processedProfileDocs.length > 0) {
                    const documentsForAstra = processedProfileDocs.map(doc => ({
                        text: doc.pageContent, $vector: doc.embedding, source: doc.source, ...doc.metadata
                    }));
                    const insertResult = await collection.insertMany(documentsForAstra);
                    console.log(`Inserted ${insertResult.status?.insertedIds?.length || 0} new documents for ${profileSource}.`);
                }
            } else {
                console.log("LinkedIn profile text content is minimal, skipping embedding and insertion for profile summary.");
            }

            // Process LinkedIn Posts
            const postsSourcePrefix = `linkedin-post:${profile.id}`; // Prefix for all posts of this user
            console.log(`Deleting existing posts for user ${profile.id} (source prefix: ${postsSourcePrefix}*)`);
            const deletePostsResult = await collection.deleteMany({ "source": { "$regex": `^${postsSourcePrefix}` } });
            console.log(`Deleted ${deletePostsResult.deletedCount || 0} old post documents for user ${profile.id}.`);

            const posts = await getLinkedInPosts(LINKEDIN_ACCESS_TOKEN, profile.id);
            if (posts && posts.length > 0) {
                console.log(`Fetched ${posts.length} LinkedIn posts/shares for user ${profile.id}.`);
                let newPostDocsToInsert = [];
                for (const post of posts) {
                    const postSource = `linkedin-post:${profile.id}:${post.id}`; // Specific source for this post
                    let postText = "";
                    if (post.specificContent && post.specificContent['com.linkedin.ugc.ShareContent'] && post.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary) {
                        postText = post.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text;
                    } else if (post.text && post.text.text) {
                        postText = post.text.text;
                    } else if (typeof post.commentary === 'string') {
                        postText = post.commentary;
                    }

                    if (postText && postText.trim()) {
                        const processedPostDocs = await processAndEmbed(
                            postText,
                            postSource,
                            { userId: profile.id, postId: post.id, type: 'post' }
                        );
                        if (processedPostDocs && processedPostDocs.length > 0) {
                            newPostDocsToInsert.push(...processedPostDocs);
                        }
                    } else {
                        console.log(`Post ${post.id} (source: ${postSource}) has no extractable text content, skipping.`);
                    }
                }
                if (newPostDocsToInsert.length > 0) {
                    const documentsForAstra = newPostDocsToInsert.map(doc => ({
                        text: doc.pageContent, $vector: doc.embedding, source: doc.source, ...doc.metadata
                    }));
                    const insertPostsResult = await collection.insertMany(documentsForAstra);
                    console.log(`Inserted ${insertPostsResult.status?.insertedIds?.length || 0} new post document chunks for user ${profile.id}.`);
                } else {
                     console.log(`No new LinkedIn post documents to insert for user ${profile.id}.`);
                }
            } else {
                console.log(`No posts found or fetched for LinkedIn user ${profile.id}.`);
            }
        } else {
            console.warn('Could not fetch LinkedIn profile or profile ID is missing. Skipping LinkedIn data sync.');
        }
    } catch (error) {
        console.error('Error processing LinkedIn data:', error.message || error, error.stack);
    }

    // 2. GitHub Data
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
