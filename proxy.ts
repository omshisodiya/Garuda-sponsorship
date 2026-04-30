import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "garuda-os-dev-secret-replace-in-production-with-32-char-min"
)

const PUBLIC_PATHS = ["/login", "/api/auth/login"]

const ROLE_HOME: Record<string, string> = {
  superadmin: "/superadmin",
  admin: "/admin",
  team: "/team",
}

// Paths each role is NOT allowed to visit
const BLOCKED: Record<string, string[]> = {
  team:  ["/superadmin", "/admin", "/assign", "/users", "/alerts"],
  admin: ["/superadmin"],
}

function isAllowed(pathname: string, role: string): boolean {
  const blocked = BLOCKED[role] ?? []
  return !blocked.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"))
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get("g_session")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = (payload as { role?: string }).role ?? "team"
    const home = ROLE_HOME[role] ?? "/team"

    // Redirect root to role's home dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL(home, req.url))
    }

    // Redirect unauthorized page access to role's home
    if (!isAllowed(pathname, role)) {
      return NextResponse.redirect(new URL(home, req.url))
    }

    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url))
    res.cookies.set("g_session", "", { maxAge: 0, path: "/" })
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
