import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas protegidas del cliente que requieren autenticación
const protectedClientRoutes = [
  '/cliente/dashboard',
  '/cliente/appointments',
  '/cliente/packages',
  '/cliente/profile',
  '/cliente/settings',
  '/cliente/explore'
]

// Rutas públicas del cliente (no requieren autenticación)
const publicClientRoutes = [
  '/cliente/login',
  '/cliente/register',
  '/cliente/forgot-password',
  '/cliente/verify-email'
]

// Middleware to handle routing and authentication
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
  
  // Handle cliente (customer) authentication
  if (pathname.startsWith('/cliente/')) {
    const token = request.cookies.get('client-token')?.value
    const isProtectedRoute = protectedClientRoutes.some(route => pathname.startsWith(route))
    const isPublicRoute = publicClientRoutes.some(route => pathname.startsWith(route))
    
    // If it's a protected route and no token, redirect to login
    if (isProtectedRoute && !token) {
      const loginUrl = new URL('/cliente/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // If user has token and is on public route (login/register), redirect to dashboard
    if (isPublicRoute && token) {
      // Validate token is not expired (basic check)
      try {
        // For now, just check if token exists
        // In production, you should validate the JWT properly
        const dashboardUrl = new URL('/cliente/dashboard', request.url)
        const from = request.nextUrl.searchParams.get('from')
        if (from) {
          dashboardUrl.searchParams.set('from', from)
        }
        return NextResponse.redirect(dashboardUrl)
      } catch {
        // If token validation fails, let them continue to login
        const response = NextResponse.next()
        response.cookies.delete('client-token')
        return response
      }
    }
  }
  
  // Always let known app routes pass through
  if (pathname === '/dashboard' ||
      pathname.startsWith('/dashboard/') || 
      pathname.startsWith('/admin/') || 
      pathname.startsWith('/business/') ||
      pathname.startsWith('/business-pages/') ||
      pathname.startsWith('/client/') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/book/') ||
      pathname.startsWith('/confirm') ||
      pathname.startsWith('/directory') ||
      pathname === '/favicon.ico' ||
      pathname.startsWith('/public/') ||
      pathname.startsWith('/assets/')) {
    return NextResponse.next()
  }
  
  // The middleware is no longer needed for custom business pages
  // since we moved them to /[slug] which Next.js handles automatically
  
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
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|public).*)',
  ],
}