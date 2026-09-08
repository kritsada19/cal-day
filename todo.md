# แผนการ Caching API (CalDay)

> สรุปแผนจากการวิเคราะห์ API ทั้งหมด + การตัดสินใจหลัก (interview เมื่อ 2026-09-08)

## เป้าหมาย

ลด load ที่ PostgreSQL สำหรับ GET endpoints ที่อ่านข้อมูลซ้ำๆ (dashboard, calendar, analytics, profile) โดยใช้ **Redis** เป็น cache layer — โปรเจคมี Redis อยู่แล้ว (rate-limit, AI quota, webhook idempotency) ไม่ต้องเพิ่ม dependency ใหม่

## การตัดสินใจหลัก (Decisions)

1. **Redis เป็น cache layer หลัก** — เขียน helper ใหม่ใน `lib/cache.ts` ใช้ ioredis ที่มีอยู่
2. **Invalidate-on-write** — cache จะเปลี่ยนก็ต่อเมื่อข้อมูลเปลี่ยน: ทุกจุดที่สร้าง/ลบ/แก้ข้อมูล ต้องลบ Redis key ที่เกี่ยวข้องเพื่อบังคับให้ดึงข้อมูลใหม่ ไม่พึ่ง TTL เป็นหลัก (TTL เป็น safety net เท่านั้น)
3. **ไม่ cache ผลลัพธ์ AI analysis** — `analyzeFood()` ยังถูกเรียกทุกครั้ง (เพื่อไม่ให้ quota semantics เพี้ยน) แต่อาจ cache *food dictionary* (query `foodEntry.findMany distinct`) ซึ่งเป็น DB query ธรรมดา ไม่ใช่ AI
4. **Cache เฉพาะ GET ที่เป็นข้อมูลผู้ใช้** — key ต้องมี `userId` เสมอ เพื่อป้องกัน data leak ข้าม user
5. **Cache เฉพาะ response 200** — ห้าม cache 401/429/5xx
6. **Fail-open** — ถ้า Redis ล่ม ให้ข้าม cache แล้ว query DB ตรงๆ (แบบเดียวกับ `checkRateLimit`)
7. **Next.js ชั้น Route Handler ไม่ต้องแก้** — GET handlers เป็น dynamic อยู่แล้วตั้งแต่ v15 (docs `route.md`: default caching เปลี่ยนเป็น dynamic ตั้งแต่ v15.0.0-RC) ดังนั้นไม่ต้องเพิ่ม `export const dynamic` อะไร

## Endpoints ที่จะ cache

| Endpoint | ข้อมูล | ทำไม cache ได้ |
|---|---|---|
| `GET /api/meals?year&month` | monthly daily summaries (calendar) | อ่านซ้ำ, เปลี่ยนเฉพาะเมื่อบันทึก/ลบ meal |
| `GET /api/meals/daily?date` | meals + foodEntries ของวัน | อ่านซ้ำ, เปลี่ยนเฉพาะวันนั้นๆ |
| `GET /api/analytics?days=N` | weekly data + stats | คำนวณจาก summaries ซ้ำทุกครั้งที่เปิดหน้า |
| `GET /api/profile` | user + profile + summary + ai quota | อ่านซ้ำทุกหน้า (dashboard, profile) |

**ไม่ cache:** `POST /api/meals`, `DELETE /api/meals/[id]`, `POST /api/profile`, `POST /api/checkout`, `POST /api/webhook`, `POST /api/auth/signup`, NextAuth routes, `GET /api/health` (force-dynamic อยู่แล้ว)

## Cache Key Schema

Prefix เดียวต่อ user เพื่อให้ลบง่าย: `cache:user:{userId}:{scope}`

| Scope | Key | TTL (safety net) | หมายเหตุ |
|---|---|---|---|
| Monthly summaries | `cache:user:{userId}:meals:month:{year}:{month}` | 300 | |
| Daily meals | `cache:user:{userId}:meals:daily:{date}` | 60 | เปลี่ยนบ่อยที่สุด (วันนี้) |
| Analytics | `cache:user:{userId}:analytics:{days}` | 300 | key ตามค่า `days` |
| Profile | `cache:user:{userId}:profile` | 60 | `aiUsage` เปลี่ยนทุกครั้งที่ใช้ AI → TTL สั้น |

### Helper ใน `lib/cache.ts`

```ts
getCache<T>(key: string): Promise<T | null>      // redis.get + JSON.parse
setCache(key: string, value: unknown, ttlSec: number): Promise<void>  // redis.set + EX
deleteUserCache(userId: number): Promise<void>    // SCAN match `cache:user:{userId}:*` + DEL
```

- `deleteUserCache` ใช้ SCAN (ไม่ใช้ KEYS — ไม่ปลอดภัยตอน Redis มีข้อมูลเยอะ) แล้ว DEL ทีละ key
- ระวัง **Date serialization**: `dailySummary.date` เป็น `Date` object → ผ่าน `JSON.stringify` กลายเป็น ISO string; โหลดกลับด้วย `JSON.parse` ได้เลย (response ยังเป็น JSON เดิม)

## Invalidation Matrix (เขียนที่ไหน → ลบอะไร)

| จุดที่เขียนข้อมูล | ลบ key อะไร | เหตุผล |
|---|---|---|
| `POST /api/meals` (สร้าง meal + update summary) | `deleteUserCache(userId)` ทั้งหมด | month, daily, analytics, profile ล้วนพึ่ง summaries/meals |
| `DELETE /api/meals/[id]` | `deleteUserCache(userId)` ทั้งหมด | ลบ meal → ข้อมูลทุกหน้าขาด |
| `POST /api/profile` (แก้ target) | `deleteUserCache(userId)` ทั้งหมด | profile + analytics ใช้ target |
| `POST /api/webhook` (subscription เปลี่ยน) | `cache:user:{userId}:profile` | plan เปลี่ยน → aiLimit เปลี่ยน (แค่ profile ก็พอ) |

> ⚠️ **Bug ที่เจอระหว่างวิเคราะห์:** `DELETE /api/meals/[id]` ลบ meal แล้ว **ไม่ recalulate `dailySummary`** — ตัวเลขใน summary จะค้างอยู่ ในขั้นตอน implement ควรแก้ด้วย (ลบ meal แล้ว recalc หรือลบ summary วันที่นั้น) ไม่งั้น cache จะยิ่งซ่อนความไม่สดของข้อมูล

## ขั้นตอน (Tasks)

- [ ] **1. สร้าง `lib/cache.ts`** — helper `getCache` / `setCache` / `deleteUserCache` (SCAN + DEL) + ค่า TTL คงที่
- [ ] **2. Cache `GET /api/meals`** — เช็ค cache ด้วย key `meals:month:{year}:{month}` → miss แล้ว query DB → `setCache`
- [ ] **3. Cache `GET /api/meals/daily`** — key `meals:daily:{date}`
- [ ] **4. Cache `GET /api/analytics`** — key `analytics:{days}`
- [ ] **5. Cache `GET /api/profile`** — key `profile` (TTL สั้น 60s เพราะ aiUsage)
- [ ] **6. Invalidate on write** — เรียก `deleteUserCache` ใน `POST /api/meals`, `DELETE /api/meals/[id]`, `POST /api/profile`; ลบแค่ `profile` key ใน webhook (กรณี subscription เปลี่ยน)
- [ ] **7. (แนะนำ) Cache food dictionary** — query `foodEntry.findMany({ distinct: ["foodName"] })` ใน `POST /api/meals` เป็น global key `cache:food-dictionary` TTL 300s (query นี้รันทุกครั้งที่บันทึก meal และอ่านทั้งตาราง — ประหยัดชัดเจน)
- [ ] **8. แก้ bug `DELETE /api/meals/[id]`** — recalculate/lb dailySummary ของวันที่ meal นั้น (ทำคู่กับ task 6)
- [ ] **9. ทดสอบ** — อัปเดต `vitest.setup.ts` (mock redis ให้รองรับ `get`/`set`/`scan`/`del`), เขียน unit test ให้ `lib/cache.ts` (hit/miss, deleteUserCache ลบครบ), รัน `npm test` ให้ integration tests ยังเขียว (mock cache เป็น miss)
- [ ] **10. Verify** — `npx tsc --noEmit` + `npm run lint` + `npm test`

## ข้อควรระวัง

- **Data leak:** key ต้องมี `userId` ทุกตัว — ห้ามใช้ key global สำหรับข้อมูลผู้ใช้
- **Fail-open:** ถ้า `redis.get`/`set` throw → catch แล้ว query DB ตรงๆ (เลียนแบบ `checkRateLimit`)
- **ไม่ cache response ที่ไม่ใช่ 200** — ตรวจ `status` ก่อน `setCache`
- **TTL เป็นแค่ safety net** — อย่าไว้ใจ TTL ให้ความสดของข้อมูล; invalidation คือตัวรับประกันหลัก (ตามที่ตกลงกัน)
- **Next.js caching layer:** ไม่ต้องไปยุ่งกับ `unstable_cache`/`revalidateTag` เพราะเราจัดการ cache เองที่ Redis (decision #1) — กันสับสนระหว่าง cache 2 ชั้น