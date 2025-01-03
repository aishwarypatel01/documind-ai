import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/signin' || path === '/signup' || path === '/'

  // Get the token from the session (you might need to adjust this based on how you store the token)
  const isAuthenticated = request.cookies.has('user_token')

  // Redirect logic
  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/', '/chat', '/signin', '/signup']
} 