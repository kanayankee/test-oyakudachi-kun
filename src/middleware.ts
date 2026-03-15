import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_FILE = /\.[^/]+$/;

function isMaintenanceModeEnabled() {
    return process.env.MAINTENANCE_MODE === 'true';
}

export function middleware(request: NextRequest) {
    const { nextUrl, headers } = request;
    const host = headers.get('host') || '';

    if (PUBLIC_FILE.test(nextUrl.pathname)) {
        return NextResponse.next();
    }

    // 1. Redirect all vercel.app traffic to custom domain /home
    if (host.includes('.vercel.app')) {
        return NextResponse.redirect(new URL('/home', 'https://test-oyakudachi.com'));
    }

    if (isMaintenanceModeEnabled() && nextUrl.pathname !== '/maintenance') {
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // 2. Localhost Convenience: Redirect / to /home
    if (host.includes('localhost') && nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    // 3. Hide test-oyakudachi.com/ (root) with a 404
    // We only do this if the host is exactly the custom domain
    if (nextUrl.pathname === '/') {
        return new NextResponse(null, { status: 404 });
    }

    return NextResponse.next();
}

// Optional: Limit middleware to specific paths for performance
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
