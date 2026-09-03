import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    // plugins: ติดตั้ง plugin เพื่อรองรับ React (JSX/TSX) และการใช้งาน path alias (@/...) 
    plugins: [react(), tsconfigPaths()],
    test: {
        // environment: ใช้ 'jsdom' เพื่อจำลอง DOM API (เช่น window, document, FormData)
        // ซึ่งจำเป็นสำหรับการทดสอบ Next.js Server Actions และ Component
        environment: 'jsdom',

        // setupFiles: ระบุไฟล์ที่จะให้ Vitest รัน "ก่อน" เริ่มเทสทุกครั้ง 
        // ในที่นี้คือ vitest.setup.ts สำหรับการ Load Env และ Global Mocks
        setupFiles: ['./vitest.setup.ts'],

        // globals: เปิดใช้งาน global variables สำหรับการเทส (describe, it, expect, vi)
        // ทำให้ไม่ต้องคอย import { describe, it... } ทุกไฟล์
        globals: true,

        // env: ตั้งค่า environment variable สำหรับตอนรันเทสโดยเฉพาะ
        env: {
            NODE_ENV: 'test',
        },

        // fileParallelism: ปิดการรันไฟล์เทสหลายตัวพร้อมกัน (Parallel)
        // **สำคัญมาก** เพราะใน Integration Test เรามีการล้างข้อมูลใน Database ตัวเดียวกันใน beforeEach
        // หากรันพร้อมกัน ไฟล์หนึ่งจะไปลบข้อมูลที่อีกไฟล์เพิ่งสร้าง ทำให้เทสพังแบบสุ่ม (Flaky Tests)
        fileParallelism: false,
    },
})


