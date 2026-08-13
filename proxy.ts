// ใช้ดึง JWT token จาก next-auth
import { getToken } from 'next-auth/jwt';

// ใช้จัดการ request / response ของ Next.js
import { NextResponse, NextRequest } from 'next/server';


// middleware หลัก
export async function proxy(request: NextRequest) {

    // response ปกติ (ให้ request ไปต่อ)
    const response = NextResponse.next();


    // path ปัจจุบัน
    const { pathname } = request.nextUrl;

    // ---------------------------
    // ข้าม path ที่ไม่ต้องตรวจ auth
    // ---------------------------

    // _next => static files ของ next.js
    // api => api routes
    // . => ไฟล์ เช่น favicon.ico
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.')
    ) {
        return response;
    }

    // ---------------------------
    // path ที่ต้อง login
    // ---------------------------

    const isProtectedPath =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/subscription') ||
        pathname.startsWith('/admin');

    // ถ้าเป็น protected route
    if (isProtectedPath) {

        // ดึง JWT token จาก cookie
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        // ถ้าไม่มี token => ยังไม่ได้ login
        if (!token) {

            // redirect ไป signin
            return NextResponse.redirect(new URL('/signin', request.url));
        }

        // ---------------------------
        // ตรวจ admin permission
        // ---------------------------

        // ถ้าเข้า /admin แต่ role ไม่ใช่ ADMIN
        if (
            pathname.startsWith('/admin') &&
            token.role !== 'ADMIN'
        ) {

            // เด้งกลับหน้าแรก
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // ผ่านทุกอย่าง => เข้า page ได้
    return response;
}


// config ของ middleware
export const config = {

    // ใช้ middleware กับทุก route
    // ยกเว้น:
    // - api
    // - _next
    // - _vercel
    // - ไฟล์ static
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};