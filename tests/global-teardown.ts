// ปิดการเชื่อมต่อฐานข้อมูล
import { closeDbPool } from './helpers/db';

export default async function globalTeardown() {
    await closeDbPool();
}