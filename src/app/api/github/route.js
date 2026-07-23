import { NextResponse } from 'next/server';

const GITHUB_USERNAME = 'aparnap2';
const GITHUB_API_URL = 'https://api.github';

function getHeaders() {
  return {
    'Accept': 'application/vnd.github.v3+json',
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const repo = searchParams.get('repo');
  const per_page = searchParams.get('per_page') || '30';

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }

  let url;
  switch (endpoint) {
    case 'repos':
      url = `${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos?sort=pushed&direction=desc&per_page=${per_page}&type=owner`;
      break;
    case 'readme':
      if (!repo) return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
      url = `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repo}/readme`;
      break;
    case 'commits':
      if (!repo) return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
      url = `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repo}/commits?per_page=${per_page}`;
      break;
    case 'languages':
      if (!repo) return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
      url = `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repo}/languages`;
      break;
    case 'issues':
      if (!repo) return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
      url = `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${repo}/issues?state=all&per_page=${per_page}`;
      break;
    default:
      return NextResponse.json({ error: 'Unknown endpoint' }, { status: 400 });
  }

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (response.status === 403 || response.status === 429) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'GitHub API rate limit exceeded' },
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const res = NextResponse.json(data);
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch from GitHub' }, { status: 500 });
  }
}
