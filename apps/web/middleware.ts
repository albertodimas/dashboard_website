import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Always let API routes pass through without any processing
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Always let Next.js internal routes pass through
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }
  
  // Always let known app routes pass through
  if (pathname.startsWith('/dashboard/') || 
      pathname.startsWith('/admin/') || 
      pathname.startsWith('/business/') ||
      pathname.startsWith('/business-pages/') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/book/') ||
      pathname.startsWith('/confirm') ||
      pathname.startsWith('/directory') ||
      pathname === '/favicon.ico' ||
      pathname.startsWith('/public/') ||
      pathname.startsWith('/assets/')) {
    return NextResponse.next()
  }
  
  // For custom business pages, rewrite to the new location
  if (pathname !== '/' && !pathname.includes('.')) {
    return NextResponse.rewrite(new URL(`/business-pages${pathname}`, request.url))
  }
  
  // For root path and other paths, let them continue normally
  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - MOST IMPORTANT: Exclude all API routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - admin
     * - dashboard
     * - login
     * - register
     * - business (existing business routes)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|public|admin|dashboard|login|register|business).*)',
  ],
}