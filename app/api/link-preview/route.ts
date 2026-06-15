import { NextRequest, NextResponse } from 'next/server';

// Validate and sanitize URL to prevent SSRF attacks
function isValidExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow HTTP(S) protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // Block private/internal IP ranges and localhost
    const hostname = url.hostname.toLowerCase();

    // Block localhost and loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }

    // Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname)) {
      return false;
    }

    // Block link-local addresses (169.254.0.0/16) - AWS metadata service
    if (/^169\.254\./.test(hostname)) {
      return false;
    }

    // Block IPv6 private addresses
    if (hostname.startsWith('fc') || hostname.startsWith('fd')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  // Validate URL to prevent SSRF
  if (!isValidExternalUrl(url)) {
    return NextResponse.json({ error: 'Invalid or forbidden URL' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
      },
      // Add timeout and redirect limits
      signal: AbortSignal.timeout(5000), // 5 second timeout
      redirect: 'follow',
    });
    
    if (!res.ok) {
        throw new Error('Failed to fetch');
    }

    const html = await res.text();

    // Simple regex to extract OG tags
    const getMetaTag = (name: string) => {
      const match = html.match(
        new RegExp(`<meta property="${name}" content="([^"]*)"`, 'i')
      ) || html.match(
        new RegExp(`<meta name="${name}" content="([^"]*)"`, 'i')
      );
      return match ? match[1] : null;
    };
    
    const getTitle = () => {
        const match = html.match(/<title>([^<]*)<\/title>/i);
        return match ? match[1] : null;
    }

    const title = getMetaTag('og:title') || getTitle();
    const description = getMetaTag('og:description') || getMetaTag('description');
    const image = getMetaTag('og:image');

    return NextResponse.json({ title, description, image, url });
  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
