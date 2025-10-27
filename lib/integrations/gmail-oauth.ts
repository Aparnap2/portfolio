export async function getGmailAccessToken(): Promise<string | null> {
  try {
    // For serverless, we'll use a refresh token approach
    // First, you need to get a refresh token by visiting this URL:
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:3000/auth/callback&scope=https://www.googleapis.com/auth/gmail.send&response_type=code&access_type=offline&prompt=consent`;
    
    console.log('[Gmail OAuth] Visit this URL to get authorization code:', authUrl);
    
    // For now, return null to use fallback logging
    return null;
    
  } catch (error) {
    console.error('[Gmail OAuth] Error:', error);
    return null;
  }
}

export async function exchangeCodeForTokens(code: string): Promise<any> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/auth/callback'
      })
    });

    const tokens = await response.json();
    console.log('[Gmail OAuth] Tokens received:', tokens);
    return tokens;
    
  } catch (error) {
    console.error('[Gmail OAuth] Token exchange error:', error);
    return null;
  }
}