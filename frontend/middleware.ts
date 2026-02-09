import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const settingPath = process.env.NEXT_PUBLIC_SETTING_PATH || 'settings'

  // 如果直接访问 /settings 路径
  if (pathname === '/settings') {
    // 只有当配置的路径就是 'settings' 时才允许直接访问
    if (settingPath !== 'settings') {
      // 否则重定向到首页或返回 404
      // 选项1: 重定向到首页
      return NextResponse.redirect(new URL('/', request.url))
      
      // 选项2: 返回 404 (取消注释下面这行，注释上面那行)
      // return new NextResponse(null, { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  // 只匹配 /settings 路径
  matcher: '/settings',
}
