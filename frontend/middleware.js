import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Secret must match backend. Ideally loaded from env.
const SECRET_KEY = new TextEncoder().encode("supersecretkey");

export async function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // 1. Verify Token
    let payload = null;
    if (token) {
        try {
            const { payload: p } = await jwtVerify(token, SECRET_KEY);
            payload = p;
        } catch (e) {
            // Invalid token
        }
    }

    // 2. Define Rules
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isAdminPage = pathname.startsWith('/admin');
    const isLearningPage = pathname.startsWith('/learning');
    const isDashboard = pathname === '/' || pathname === '/dashboard';

    // Case A: User is NOT logged in
    if (!payload) {
        if (isAdminPage || isLearningPage || isDashboard) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Case B: User IS logged in
    if (payload) {
        if (isAuthPage) {
            // Redirect to role-based home
            if (payload.role?.toUpperCase() === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
            return NextResponse.redirect(new URL('/learning', request.url));
        }

        if (isAdminPage && payload.role?.toUpperCase() !== 'ADMIN') {
            // Student trying to access admin
            return NextResponse.redirect(new URL('/learning', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
