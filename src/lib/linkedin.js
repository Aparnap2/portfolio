// src/lib/linkedin.js
import axios from 'axios';
// import { RateLimiter } from 'limiter';

// TODO: Implement full OAuth 2.0 flow for obtaining accessToken
// and securely manage the token, including refresh tokens.
// const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
// const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// Placeholder for rate limiter configuration
// const limiter = new RateLimiter({ tokensPerInterval: 10, interval: 'minute', fireImmediately: true });

/**
 * Fetches the basic profile of the authenticated user from LinkedIn.
 * @param {string} accessToken - The LinkedIn access token.
 * @returns {Promise<object|null>} The profile data or null if an error occurs.
 */
export async function getLinkedInProfile(accessToken) {
    if (!accessToken) {
        console.error('LinkedIn Access Token is required for getLinkedInProfile.');
        return null;
    }

    // More specific projection to get necessary fields including 'id' for posts
    const profileUrl = 'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams),headline)';

    try {
        // TODO: Integrate rate limiting if API calls become frequent.
        // Example: if (limiter) await limiter.removeTokens(1);
        console.log(`Fetching LinkedIn profile from: ${profileUrl}`);
        const response = await axios.get(profileUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Connection': 'Keep-Alive', // Recommended by LinkedIn for performance
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0' // Good practice for LinkedIn v2 APIs
            }
        });
        console.log('LinkedIn profile data received.');
        return response.data;
    } catch (error) {
        console.error('Error fetching LinkedIn profile:');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error Message:', error.message);
        }
        return null;
    }
}

/**
 * Fetches the posts/shares of the authenticated user from LinkedIn.
 * @param {string} accessToken - The LinkedIn access token.
 * @param {string} personId - The LinkedIn person ID (URN like 'urn:li:person:xxxx').
 * @returns {Promise<Array|null>} An array of post data or null if an error occurs.
 */
export async function getLinkedInPosts(accessToken, personId) {
    if (!accessToken) {
        console.error('LinkedIn Access Token is required for getLinkedInPosts.');
        return null;
    }
    if (!personId) {
        console.error('LinkedIn Person ID (URN) is required for getLinkedInPosts.');
        return null;
    }

    // Construct the URN for the owner
    const ownerUrn = `urn:li:person:${personId}`;
    // API endpoint for fetching shares (posts) by owner. Count can be adjusted.
    const postsUrl = `https://api.linkedin.com/v2/shares?q=owners&owners=${ownerUrn}&count=10&sortBy=LAST_MODIFIED`;

    try {
        // TODO: Integrate rate limiting if API calls become frequent.
        // Example: if (limiter) await limiter.removeTokens(1);
        console.log(`Fetching LinkedIn posts from: ${postsUrl}`);
        const response = await axios.get(postsUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Connection': 'Keep-Alive',
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0' // Important for LinkedIn v2 APIs
            }
        });
        console.log('LinkedIn posts data received.');
        return response.data.elements || []; // Posts are typically in response.data.elements
    } catch (error) {
        console.error('Error fetching LinkedIn posts:');
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

// Example usage (for local testing, ensure .env is configured with LINKEDIN_ACCESS_TOKEN)
/*
(async () => {
    // This is a placeholder for how you might get the token.
    // In a real app, this would come from a secure store or OAuth flow.
    const testAccessToken = process.env.LINKEDIN_ACCESS_TOKEN;

    if (testAccessToken) {
        console.log('Using access token from environment for testing LinkedIn functions.');
        const profile = await getLinkedInProfile(testAccessToken);

        if (profile) {
            console.log('\nTest LinkedIn Profile:');
            console.log(JSON.stringify(profile, null, 2));

            // The profile.id should be the URN like "urn:li:person:xxxxxxx"
            // However, LinkedIn API for /me returns a simple ID, not the URN directly in the 'id' field for shares.
            // The URN is typically urn:li:person:{id from /me}
            // For the shares endpoint, the personId parameter to getLinkedInPosts should be the plain ID string.
            // The function itself constructs the URN.
            if (profile.id) {
                const posts = await getLinkedInPosts(testAccessToken, profile.id);
                if (posts) {
                    console.log('\nTest LinkedIn Posts:');
                    console.log(JSON.stringify(posts, null, 2));
                } else {
                    console.log('Could not fetch LinkedIn posts or no posts found.');
                }
            } else {
                console.log('Profile ID not found, cannot fetch posts.');
            }
        } else {
            console.log('Could not fetch LinkedIn profile.');
        }
    } else {
        console.log('Skipping LinkedIn API tests: LINKEDIN_ACCESS_TOKEN not found in .env');
    }
})();
*/
