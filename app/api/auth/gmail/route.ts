import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:3000/api/auth/callback&scope=https://www.googleapis.com/auth/gmail.send&response_type=code&access_type=offline&prompt=consent`;
  
  return NextResponse.redirect(authUrl);
}