// src/lib/__tests__/linkedin.test.js
import axios from 'axios';
import { getLinkedInProfile, getLinkedInPosts } from '../linkedin';

jest.mock('axios');

describe('LinkedIn API Client', () => {
    const mockToken = 'test-linkedin-token';
    const mockPersonId = 'test-person-id';

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getLinkedInProfile', () => {
        it('should fetch profile data successfully', async () => {
            const mockProfileData = { id: mockPersonId, localizedFirstName: 'Test', localizedLastName: 'User', headline: "Headline" };
            axios.get.mockResolvedValue({ data: mockProfileData });

            const profile = await getLinkedInProfile(mockToken);

            expect(axios.get).toHaveBeenCalledWith(
                // Using stringContaining because the exact projection might change but base URL should be consistent
                expect.stringContaining('https://api.linkedin.com/v2/me'),
                expect.objectContaining({
                    headers: {
                        'Authorization': `Bearer ${mockToken}`,
                        'Connection': 'Keep-Alive',
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                })
            );
            expect(profile).toEqual(mockProfileData);
        });

        it('should return null on API error when fetching profile', async () => {
            axios.get.mockRejectedValue(new Error('API Error'));
            const profile = await getLinkedInProfile(mockToken);
            expect(profile).toBeNull();
            // Verify console.error was called (optional, but good for checking error handling)
            // const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            // expect(consoleErrorSpy).toHaveBeenCalled();
            // consoleErrorSpy.mockRestore();
        });

        it('should log error details if error.response exists', async () => {
            const errorResponse = {
                response: {
                    data: 'Error data',
                    status: 500,
                    headers: {}
                }
            };
            axios.get.mockRejectedValue(errorResponse);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await getLinkedInProfile(mockToken);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching LinkedIn profile:');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Data:', 'Error data');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Status:', 500);
            consoleErrorSpy.mockRestore();
        });


        it('should require an access token for profile', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const profile = await getLinkedInProfile(null);
            expect(profile).toBeNull();
            expect(axios.get).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('LinkedIn Access Token is required for getLinkedInProfile.');
            consoleErrorSpy.mockRestore();
        });
    });

    describe('getLinkedInPosts', () => {
        it('should fetch posts successfully', async () => {
            const mockPostsData = { elements: [{ id: 'post1' }, { id: 'post2' }] };
            axios.get.mockResolvedValue({ data: mockPostsData });

            const posts = await getLinkedInPosts(mockToken, mockPersonId);

            expect(axios.get).toHaveBeenCalledWith(
                `https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:person:${mockPersonId}&count=10&sortBy=LAST_MODIFIED`,
                expect.objectContaining({
                    headers: {
                        'Authorization': `Bearer ${mockToken}`,
                        'Connection': 'Keep-Alive',
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                })
            );
            expect(posts).toEqual(mockPostsData.elements);
        });

        it('should return null on API error when fetching posts', async () => {
            axios.get.mockRejectedValue(new Error('API Error'));
            const posts = await getLinkedInPosts(mockToken, mockPersonId);
            expect(posts).toBeNull();
        });

        it('should require an access token for posts', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const posts = await getLinkedInPosts(null, mockPersonId);
            expect(posts).toBeNull();
            expect(axios.get).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('LinkedIn Access Token is required for getLinkedInPosts.');
            consoleErrorSpy.mockRestore();
        });

        it('should require a personId for posts', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const posts = await getLinkedInPosts(mockToken, null);
            expect(posts).toBeNull();
            expect(axios.get).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('LinkedIn Person ID (URN) is required for getLinkedInPosts.');
            consoleErrorSpy.mockRestore();
        });
         it('should return empty array if posts data elements are not found', async () => {
            const mockPostsData = { elementsNotPresent: [] }; // Simulate missing 'elements'
            axios.get.mockResolvedValue({ data: mockPostsData });
            const posts = await getLinkedInPosts(mockToken, mockPersonId);
            expect(posts).toEqual([]); // linkedin.js returns elements || []
        });
    });
});
