"use client";

// นำ ThemeProvider ของ next-themes มาใช้จัดการธีม Light / Dark
import { ThemeProvider as NextThemeProvider } from "next-themes";

// Component สำหรับครอบทั้งแอป เพื่อให้ทุกส่วนสามารถใช้ระบบ Theme ได้
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemeProvider
            // เปลี่ยนธีมโดยใช้ class เช่น <html class="dark">
            attribute="class"

            // ค่าเริ่มต้นใช้ธีมตามระบบของเครื่อง
            defaultTheme="system"

            // เปิดให้ตรวจจับ Light / Dark จากระบบอัตโนมัติ
            enableSystem

            // ป้องกัน animation/transition กระตุกตอนเปลี่ยนธีม
            disableTransitionOnChange
        >
            {children}
        </NextThemeProvider>
    )
}