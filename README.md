







# CalDay 🥗 (AI-Powered Nutrition & Calorie Tracker)

CalDay คือเว็บแอปพลิเคชันสำหรับการติดตามโภชนาการและการนับแคลอรีในแต่ละวัน ขับเคลื่อนด้วย AI (Google Gemini) ที่ช่วยให้การบันทึกมื้ออาหารเป็นเรื่องง่าย พร้อมระบบจัดการโปรไฟล์ผู้ใช้ คำนวณ BMR/TDEE อัตโนมัติ และระบบ Subscription

โปรเจคนี้ถูกพัฒนาขึ้นด้วย **Next.js 16 (App Router)** และ **React 19** โดยเน้นโครงสร้างแบบ Full-Stack ที่มีประสิทธิภาพ รองรับฐานข้อมูล PostgreSQL และ Redis สำหรับการจัดการแคช/ระบบ Real-time เหมาะสำหรับใช้เป็นกรณีศึกษาหรือพอร์ตโฟลิโอสำหรับการพัฒนาเว็บแอปพลิเคชันสมัยใหม่

## 🌟 ฟีเจอร์หลัก (Key Features)

- **User Authentication:** ระบบล็อกอินที่ปลอดภัยด้วย NextAuth.js รองรับ OAuth (Google, GitHub) และ Credentials

- **Email Verification:** หลังสมัครสมาชิก ผู้ใช้งานจะได้รับลิงก์ยืนยันอีเมลแบบ Secure Token เพื่อยืนยันสิทธิ์การใช้งานก่อนเริ่มใช้งาน

- **Forgot Password & Reset Password:** มีระบบลืมรหัสผ่านที่ส่งลิงก์รีเซ็ตรหัสผ่านทางอีเมล พร้อมการจัดการ token และหมดอายุแบบอัตโนมัติ

- **Smart Profile & BMR/TDEE:** ระบบคำนวณเป้าหมายแคลอรีและโปรตีนต่อวันอัตโนมัติ ตามข้อมูลสุขภาพ เป้าหมาย และระดับการทำกิจกรรม (Exercise Level)

- **Meal & Food Tracking:** บันทึกอาหารแบ่งตามมื้อ (เช้า, กลางวัน, เย็น, ว่าง) พร้อมรายละเอียดแคลอรีและโปรตีน

- **Favorite Meals:** ระบบจัดการรายการอาหารโปรด ช่วยให้ผู้ใช้บันทึกเมนูที่รับประทานเป็นประจำ สามารถนำกลับมาใช้บันทึกมื้ออาหารได้อย่างรวดเร็ว พร้อมรองรับการแก้ไขรายละเอียดและคุณค่าทางโภชนาการของรายการโปรด

- **Daily Summaries:** สรุปผลการกินอาหารรายวัน เปรียบเทียบกับเป้าหมายที่ตั้งไว้

- **AI Integration:** ใช้ Google Generative AI (Gemini) เพื่อช่วยประมวลผลข้อมูล

- **Pro Subscriptions:** ระบบสมัครสมาชิกแบบพรีเมียมเพื่อเข้าถึงฟีเจอร์ขั้นสูง จัดการการชำระเงินและบิลลิ่งด้วย Stripe

- **Real-time Monitoring:** มีระบบ Heartbeat Mechanism เพื่อตรวจสอบสถานะออนไลน์ของผู้ใช้แบบ Real-time ด้วย Redis (Pub/Sub)

- **Error Monitoring & Session Replay:** ติดตั้ง Sentry เพื่อดักจับ Error และ Performance Tracing แบบ Real-time ครอบคลุมทั้งฝั่ง Client, Server (Node.js) และ Edge Runtime

- **Multi-language UI:** รองรับการสลับภาษาไทย/อังกฤษผ่าน Navbar พร้อม fallback อัตโนมัติเป็นภาษาไทยเมื่อ locale ไม่ถูกต้องหรือไม่มีค่า

## 🌐 Internationalization (i18n)

แอปพลิเคชันรองรับภาษาทั้งหมด 2 ภาษา:

- `th` — ภาษาไทย (default)

- `en` — English

### การทำงานของระบบภาษา

- Locale ถูกตรวจสอบและ normalize ด้วย whitelist ที่อนุญาตเฉพาะ `th` และ `en`

- ถ้าผู้ใช้เปิดหน้าโดยไม่มี locale หรือส่ง locale ที่ไม่ถูกต้อง ระบบจะ fallback กลับเป็น `th` อย่างปลอดภัย

- ค่า locale จะถูกเก็บใน cookie เพื่อให้หน้าเว็บคงสภาพภาษาเดิมเมื่อรีเฟรชหรือกลับมาเยี่ยมชมใหม่

- การสลับภาษาเกิดจากปุ่มใน Navbar และจะทำการ refresh locale ตามค่าใหม่ทันที

### ตัวอย่างการใช้

```bash

# ภาษาไทย (default)

GET /

# ภาษาอังกฤษ

Cookie: locale=en

```

หรือสลับผ่าน UI จากปุ่มภาษาใน Navbar โดยเลือกภาษาไทย/English

## 💻 Tech Stack (เทคโนโลยีที่ใช้)

**Frontend:**

- [Next.js 16](https://nextjs.org/) (App Router)

- [React 19](https://react.dev/)

- [Tailwind CSS v4](https://tailwindcss.com/)

- [Lucide React](https://lucide.dev/) (Icons)

- [Next Themes](https://github.com/pacocoursey/next-themes) (Dark/Light mode)

**Backend & Database:**

- [PostgreSQL](https://www.postgresql.org/) (ผ่าน Docker)

- [Prisma ORM](https://www.prisma.io/)

- [Redis](https://redis.io/) (`ioredis`) (ผ่าน Docker)

**Authentication & Payment:**

- [NextAuth.js](https://next-auth.js.org/)

- [Stripe](https://stripe.com/)

**AI & Utilities:**

- [Google Generative AI](https://ai.google.dev/) (Gemini)

- [Zod](https://zod.dev/) (Schema Validation)

- [Pino](https://getpino.io/) (Logging)

- [Sentry](https://sentry.io/) (Error Monitoring & Session Replay)

**DevTools & Testing:**

- [Docker & Docker Compose](https://www.docker.com/)

- [Vitest](https://vitest.dev/) (Unit / Integration Testing)

- [Playwright](https://playwright.dev/) (E2E Testing)

- [ESLint](https://eslint.org/)

## 🚀 เริ่มต้นการใช้งาน (Getting Started)

คู่มือการติดตั้งและรันโปรเจกต์แบบทีละขั้นตอนอย่างละเอียด

### 1. สิ่งที่ต้องเตรียมก่อนติดตั้ง (Prerequisites)

- **Node.js**: เวอร์ชัน 20.x ขึ้นไป (แนะนำ LTS) ([ดาวน์โหลด Node.js](https://nodejs.org/))

- **Docker Desktop**: ติดตั้งและเปิดใช้งานอยู่ สำหรับรัน PostgreSQL และ Redis ([ดาวน์โหลด Docker Desktop](https://www.docker.com/products/docker-desktop/))

- **Git**: สำหรับ clone โครงการ

- **Stripe CLI** *(ทางเลือก)*: สำหรับทดสอบ Stripe Webhooks ในเครื่อง Local

---

### 2. การติดตั้งโปรเจกต์ (Installation)

1. **Clone Repository:**

   ```bash

   git clone https://github.com/yourusername/calday.git

   cd calday

   ```

2. **ติดตั้ง Dependencies:**

   ```bash

   npm install

   ```

---

### 3. ตั้งค่า Environment Variables (`.env`)

คัดลอกไฟล์ตัวอย่าง `.env.example` ไปเป็น `.env`:

```bash

cp .env.example .env

```

*(สำหรับ Windows PowerShell: `Copy-Item .env.example .env`)*

เปิดไฟล์ `.env` และกำหนดค่าดังนี้:

| ตัวแปร (Variable) | คำอธิบาย & ค่าตัวอย่างสำหรับ Local Dev |

|---|---|

| `NEXT_PUBLIC_APP_URL` | URL ของเว็บ เช่น `http://localhost:3000` |

| `NEXTAUTH_URL` | URL ของ Auth callback เช่น `http://localhost:3000` |

| `NEXTAUTH_SECRET` | คีย์เข้ารหัสเซสชัน สุ่มได้ด้วยคำสั่ง `openssl rand -base64 32` |

| `DATABASE_URL` | เชื่อมต่อ Postgres (ตาม docker-compose): `postgresql://calday:calday123@localhost:7777/calday?schema=public` |

| `REDIS_URL` | เชื่อมต่อ Redis (ตาม docker-compose): `redis://localhost:6379` |

| `GOOGLE_GENERATIVE_AI_API_KEY` | API Key จาก [Google AI Studio](https://aistudio.google.com/) สำหรับฟีเจอร์ AI วิเคราะห์อาหาร |

| `GOOGLE_CLIENT_ID` | Client ID จาก Google Cloud Console (หากต้องการทดสอบ Google Login) |

| `GOOGLE_CLIENT_SECRET` | Client Secret จาก Google Cloud Console |

| `STRIPE_SECRET_KEY` | Secret Key จาก Stripe Dashboard (โหมด Test: `sk_test_...`) |

| `STRIPE_WEBHOOK_SECRET` | Webhook Signing Secret (ได้จากการรัน Stripe CLI listen) |

| `STRIPE_PRO_PRICE_ID` | Price ID ของ Subscription Plan จาก Stripe Dashboard (เช่น `price_...`) |

| `EMAIL_USER` | อีเมลสำหรับส่ง OTP / ลิงก์ยืนยันตัวตน (เช่น Gmail) |

| `EMAIL_PASS` | รหัสผ่าน App Password 16 หลักของ Gmail ([วิธีสร้าง App Password](https://myaccount.google.com/apppasswords)) |

> 💡 **Tip:** สำหรับการทดสอบเบื้องต้น ค่าที่จำเป็นต้องมีทันทีคือ `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, และ `GOOGLE_GENERATIVE_AI_API_KEY`

---

### 4. รัน Database และ Redis ด้วย Docker

สั่งเปิดคอนเทนเนอร์ฐานข้อมูล PostgreSQL และ Redis:

```bash

docker compose up -d

```

> ระบบจะเปิด:

> - **PostgreSQL:** พอร์ต `7777` (User: `calday`, Pass: `calday123`, DB: `calday`)

> - **Redis:** พอร์ต `6379`

ตรวจสอบสถานะว่า container รันสำเร็จหรือไม่:

```bash

docker compose ps

```

---

### 5. ตั้งค่า Database & รัน Migration (Prisma)

1. **สร้าง Tables และ Schema ใน Database:**

   ```bash

   npx prisma db push

   ```

   *(หรือใช้ `npx prisma migrate dev` เมื่อมีการปรับเปลี่ยน schema ใน `prisma/schema.prisma`)*

2. **Generate Prisma Client:**

   ```bash

   npx prisma generate

   ```

3. **เติมข้อมูลตั้งต้นสำหรับทดสอบ (Seed Database):**

   ```bash

   npx prisma db seed

   ```

   เมื่อ Seed เสร็จสิ้น จะได้บัญชีทดสอบทันที:

   - **User ทั่วไป:** `test@example.com` / รหัสผ่าน: `password123`

   - **Admin:** `admin@example.com` / รหัสผ่าน: `admin123`

4. *(ทางเลือก)* **เปิดดูข้อมูลผ่าน Prisma Studio GUI:**

   ```bash

   npx prisma studio

   ```

   เปิดที่ [http://localhost:5555](http://localhost:5555) เพื่อดู/แก้ไขข้อมูลในฐานข้อมูลได้โดยตรง

---

### 6. เริ่มต้น Development Server

รัน Next.js dev server:

```bash

npm run dev

```

เปิดเบราว์เซอร์แล้วเข้าใช้งานได้ที่:

👉 **[http://localhost:3000](http://localhost:3000)**

---

### 7. (Optional) การทดสอบระบบ Stripe Webhook ในเครื่อง Local

หากต้องการทดสอบระบบสมัครสมาชิก (Subscription) และการรับ Webhook:

1. ติดตั้ง [Stripe CLI](https://docs.stripe.com/stripe-cli)

2. ล็อกอิน Stripe:

   ```bash

   stripe login

   ```

3. ส่งต่อ Webhook เข้าเครื่อง Local:

   ```bash

   stripe listen --forward-to localhost:3000/api/stripe/webhook

   ```

4. คัดลอก `webhook signing secret` ที่ Stripe CLI แสดง (`whsec_...`) มาใส่ใน `STRIPE_WEBHOOK_SECRET` ในไฟล์ `.env`

## 🚢 การนำขึ้น Production (Production Deployment)

ส่วนนี้ครอบคลุมแนวทางและขั้นตอนการนำ CalDay ขึ้น Production ทั้งแบบ Platform-as-a-Service (เช่น Vercel + Managed Database) และแบบ Self-Hosted (เช่น VPS / Docker / PM2)

---

### 1. การแบ่งแยกสภาพแวดล้อม (Staging vs. Production Environment Split)

การแยกสภาพแวดล้อมระหว่าง **Staging** และ **Production** อย่างเด็ดขาดช่วยป้องกันปัญหาข้อผิดพลาดจากการทดสอบไปกระทบผู้ใช้จริง โดยมีหลักการแบ่งแยกทรัพยากรและคอนฟิกดังนี้:

| ทรัพยากร / บริการ | Staging Environment | Production Environment | หมายเหตุ & ข้อควรระวัง |

|---|---|---|---|

| **Branch / Trigger** | `staging` หรือ `develop` branch | `main` branch (หรือ Release Tags) | Deploy อัตโนมัติหลังผ่าน CI/CD tests |

| **โดเมน & URL** | `https://staging.yourdomain.com` | `https://yourdomain.com` | ใช้แยก `NEXT_PUBLIC_APP_URL` และ `NEXTAUTH_URL` |

| **ฐานข้อมูล (PostgreSQL)** | Staging Database (แยก Instance/Cluster) | Production Database (Cluster หลัก + Replicas) | **ห้ามใช้ Database ร่วมกันเด็ดขาด** เพื่อความปลอดภัยของข้อมูลจริง |

| **Redis Cache** | Staging Redis (แยก Instance หรือ DB index) | Production Redis | ป้องกัน cache key ชนกันและการ invalidate ข้ามระบบ |

| **Stripe (Payment)** | **Test Mode** (`sk_test_...`, `price_test_...`) | **Live Mode** (`sk_live_...`, `price_live_...`) | Staging ใช้ทดสอบบัตรเครดิตเสมือนจริงของ Stripe ได้ปลอดภัย |

| **Google OAuth** | Redirect URI: `.../api/auth/callback/google` (Staging URL) | Redirect URI: `.../api/auth/callback/google` (Prod URL) | แยก OAuth Client ID/Secret หรือเพิ่ม Authorized Redirect URIs ทั้ง 2 URL |

| **Gemini AI API Key** | Dev/Test API Key (จำกัด Quota/Budget) | Production API Key (เปิดโควต้าเต็มรูปแบบ) | ป้องกันโควต้า AI บน Production หมดจากการรันเทสต์ |

| **Email Service** | Ethereal Email, Mailtrap หรือ Test Inbox | Production SMTP / Transactional Email | ป้องกันการส่งอีเมลทดสอบไปถึงผู้ใช้งานจริง |

| **Sentry Monitoring** | Environment tag: `environment=staging` | Environment tag: `environment=production` | กรอง Error log ใน Sentry Dashboard เพื่อแยกบั๊กจากการเทสต์ |

#### 🔄 Deployment Pipeline & Promotion Flow

1. **Develop & PR:** พัฒนาฟีเจอร์ใหม่บน feature branch -> รัน Vitest & E2E Tests ผ่าน CI

2. **Deploy to Staging:** Merge เข้า `staging` branch -> ทำ DB Migration บน Staging DB -> ทำ User Acceptance Test (UAT) และทดสอบ Subscription ด้วย Stripe Test Card

3. **Promote to Production:** เมื่อ Staging ผ่านการตรวจสอบครบถ้วน -> ทำ PR Merge เข้า `main` -> รัน `prisma migrate deploy` บน Production DB -> Deploy Production Web App

---

### 2. Checklist ความพร้อมก่อน Deploy (Pre-flight Checklist)

- [ ] **Environment Variables:** ตั้งค่าตัวแปรระดับ Production ครบถ้วน (เปลี่ยน secret และ URL ทั้งหมดเป็น production values)

- [ ] **HTTPS / Domain:** โดเมนมีใบรับรอง SSL/TLS (จำเป็นสำหรับ Secure Cookies ของ NextAuth, Stripe Webhooks, และ OAuth Callbacks)

- [ ] **Google OAuth:** เพิ่ม Production Domain และ Callback URL ลงใน Google Cloud Console (เช่น `https://yourdomain.com/api/auth/callback/google`)

- [ ] **Stripe Live Mode:**

  - เปลี่ยนคีย์เป็น `pk_live_...`, `sk_live_...`

  - ตั้งค่า Endpoint รับ Webhook ใน Stripe Dashboard ไปยัง `https://yourdomain.com/api/stripe/webhook` พร้อมเลือกฟัง events:

    - `checkout.session.completed`

    - `customer.subscription.updated`

    - `customer.subscription.deleted`

    - `invoice.payment_succeeded`

    - `invoice.payment_failed`

  - นำ `whsec_...` จากแดชบอร์ดมาใส่ใน `STRIPE_WEBHOOK_SECRET`

- [ ] **Sentry Monitoring:** ตั้งค่า `SENTRY_AUTH_TOKEN` ใน Build Environment เพื่ออัปโหลด Source Maps และตรวจสอบว่ามี DSN ครบถ้วน

---

### 3. ทางเลือกที่ 1: Deploy ผ่าน Vercel (แนะนำสำหรับ Next.js)

เหมาะสำหรับการ Deploy ที่ง่าย รวดเร็ว และรองรับ Serverless/Edge อัตโนมัติ:

#### ขั้นตอน:

1. **เตรียม Managed Database & Redis:**

   - **PostgreSQL:** แนะนำ [Neon](https://neon.tech/), [Supabase](https://supabase.com/), หรือ AWS RDS

   - **Redis:** แนะนำ [Upstash Redis](https://upstash.com/) (เชื่อมต่อง่ายและเหมาะกับ Serverless)

2. **Push Code ไปยัง GitHub / GitLab:**

   ```bash

   git push origin main

   ```

3. **Import Project ใน Vercel:**

   - เข้า [Vercel Dashboard](https://vercel.com/) แล้วเลือก **Add New Project** -> เลือก repository `calday`

4. **ตั้งค่า Environment Variables ใน Vercel Dashboard:**

   ใส่ Environment Variables ทั้งหมดที่จำเป็น:

   - `NEXT_PUBLIC_APP_URL`: `https://yourdomain.com`

   - `NEXTAUTH_URL`: `https://yourdomain.com`

   - `NEXTAUTH_SECRET`: สุ่มรหัสความยาวสูง

   - `DATABASE_URL`: Connection string จาก Managed PostgreSQL (แนะนำให้ใช้ Connection Pooling เช่น `?pgbouncer=true` หากใช้ Serverless)

   - `REDIS_URL`: URL ของ Redis (เช่น Upstash)

   - `GOOGLE_GENERATIVE_AI_API_KEY`

   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRO_PRICE_ID`

   - `EMAIL_USER` / `EMAIL_PASS`

   - `SENTRY_AUTH_TOKEN` (สำหรับ Release build)

5. **ตั้งค่า Build & Deployment Settings:**

   - **Build Command:** `prisma generate && next build`

   - **Install Command:** `npm install`

6. **Deploy Database Migration:**

   ก่อนทราฟฟิกเข้าจริง ให้รัน Migration ผ่าน CI/CD หรือเครื่อง Local ด้วยคำสั่ง:

   ```bash

   DATABASE_URL="<PROD_DATABASE_URL>" npx prisma migrate deploy

   ```

   *(หมายเหตุ: บน Production ใช้ `prisma migrate deploy` เสมอ ห้ามใช้ `db push` เพื่อความปลอดภัยของข้อมูล)*

---

### 4. ทางเลือกที่ 2: Self-Hosted บน VPS (Ubuntu / Docker / PM2)

เหมาะสำหรับผู้ที่ต้องการควบคุม Infrastructure เองทั้งหมดผ่าน Cloud Server (เช่น DigitalOcean, AWS EC2, Hetzner, GCP)

#### ก. การ Build และรันด้วย Node.js + PM2 (Direct Server Deployment)

1. **ติดตั้ง Dependencies บน Server:**

   - Node.js (v20+), PostgreSQL, Redis, PM2, Nginx, Certbot (SSL)

   ```bash

   npm install -g pm2

   ```

2. **Clone & เตรียม Environment:**

   ```bash

   git clone https://github.com/yourusername/calday.git /var/www/calday

   cd /var/www/calday

   npm ci

   cp .env.example .env.production

   # แก้ไขไฟล์ .env.production ให้เป็นค่า production จริง

   ```

3. **รัน Database Migration & Generate:**

   ```bash

   npx prisma generate

   npx prisma migrate deploy

   ```

4. **Build โครงการ:**

   ```bash

   npm run build

   ```

5. **Start แอปพลิเคชันด้วย PM2:**

   ```bash

   pm2 start npm --name "calday" -- start -- -p 3000

   pm2 save

   pm2 startup

   ```

6. **ตั้งค่า Nginx Reverse Proxy & SSL:**

   สร้าง config ที่ `/etc/nginx/sites-available/calday`:

   ```nginx

   server {

       server_name yourdomain.com;

       location / {

           proxy_pass http://localhost:3000;

           proxy_http_version 1.1;

           proxy_set_header Upgrade $http_upgrade;

           proxy_set_header Connection 'upgrade';

           proxy_set_header Host $host;

           proxy_set_header X-Real-IP $remote_addr;

           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

           proxy_set_header X-Forwarded-Proto $scheme;

           proxy_cache_bypass $http_upgrade;

       }

   }

   ```

   เปิดใช้งานและขอ SSL ด้วย Let's Encrypt:

   ```bash

   ln -s /etc/nginx/sites-available/calday /etc/nginx/sites-enabled/

   nginx -t && systemctl reload nginx

   certbot --nginx -d yourdomain.com

   ```

---

### 5. Database Migration & Deployment Workflow

ขั้นตอนและ Checklist มาตรฐานสำหรับการอัปเดตโครงสร้างฐานข้อมูล เพื่อความปลอดภัยของข้อมูลและป้องกันปัญหา Downtime

#### 🔄 ความแตกต่างของคำสั่ง Prisma (สำคัญมาก!)

| สภาพแวดล้อม | คำสั่งที่ใช้ | วัตถุประสงค์ / พฤติกรรม |

|---|---|---|

| **Local Development** | `npx prisma db push` | ซิงก์ schema เข้า DB ชั่วคราวอย่างรวดเร็ว (ไม่ต้องสร้าง migration file) |

| **สร้าง Migration ใหม่** | `npx prisma migrate dev --name <migration_name>` | เปรียบเทียบ schema, สร้างไฟล์ SQL migration ใน `prisma/migrations/`, แล้วรันลง local DB |

| **Production / Staging** | `npx prisma migrate deploy` | **ต้องใช้คำสั่งนี้เท่านั้น!** รันเฉพาะไฟล์ migration ที่ยังไม่เคยรัน โดยไม่ลบ/รีเซ็ตข้อมูลและไม่สร้างไฟล์ใหม่ |

> ⚠️ **คำเตือนความปลอดภัย:** **ห้ามรัน** `prisma db push` หรือ `prisma migrate reset` บน Production เด็ดขาด เพราะอาจทำให้เกิด Data Loss หรือโครงสร้างตารางถูกเขียนทับได้

---

#### 📋 Database Migration Checklist (ขั้นตอนการ Migration สู่ Production)

##### 1. ก่อนการทำ Migration (Pre-Migration)

- [ ] **ทดสอบบน Local/Staging:** รัน `npx prisma migrate dev` และทดสอบแอปพลิเคชันว่าไม่มี Query หรือ Relation ไหนพัง

- [ ] **ตรวจสอบไฟล์ SQL ที่ถูกสร้าง:** เปิดดูไฟล์ใน `prisma/migrations/<timestamp>_<name>/migration.sql` เพื่อตรวจดูว่ามีคำสั่งที่เป็นอันตรายหรือไม่ (เช่น `DROP COLUMN`, `DROP TABLE`, หรือ `NOT NULL` บนคอลัมน์ที่มีข้อมูลเดิมอยู่แล้ว)

- [ ] **ทำ Backward Compatibility:**

  - หากเป็นการเปลี่ยนชื่อคอลัมน์ แนะนำให้ใช้วิธี Multi-step migration (เพิ่มคอลัมน์ใหม่ -> ซิงก์ข้อมูล -> อัปเดตโค้ด -> จึงลบคอลัมน์เก่า) เพื่อไม่ให้กระทบผู้ใช้ขณะ Deploy

- [ ] **Full Database Backup:** สำรองข้อมูลล่าสุดก่อนรัน Migration เสมอ:

  ```bash

  pg_dump -U <db_user> -h <db_host> -d <db_name> -F c -b -v -f "./backup_pre_migration_$(date +%Y%m%d_%H%M%S).dump"

  ```

##### 2. ระหว่างดำเนินการ (Execution)

- [ ] **ตรวจสอบสถานะ Migration เดิม:** ตรวจสอบว่ามี migration ใดค้างหรือล้มเหลวอยู่หรือไม่

  ```bash

  npx prisma migrate status

  ```

- [ ] **รัน Migration ไปยัง Production Database:**

  ```bash

  npx prisma migrate deploy

  ```

- [ ] **อัปเดต Prisma Client:** สร้าง client ให้ตรงกับ schema ล่าสุด

  ```bash

  npx prisma generate

  ```

##### 3. หลังการทำ Migration (Post-Migration Verification & Rollback Plan)

- [ ] **ตรวจสอบสถานะ:** รัน `npx prisma migrate status` อีกครั้ง ต้องขึ้นว่า *"Database schema is up to date"*

- [ ] **Smoke Test แอปพลิเคชัน:** ทดสอบ Login, บันทึกอาหาร, และดึงข้อมูล Profile เพื่อให้มั่นใจว่า Database ทำงานได้ราบรื่น

- [ ] **แผนรับมือกรณีเกิดปัญหา (Rollback Strategy):**

  - **หาก Migration ล้มเหลว:** แก้ไขปัญหาตาม error log หรือทำเครื่องหมาย `mark-unapplied` / `resolve`:

    ```bash

    npx prisma migrate resolve --rolled-back "<failed_migration_name>"

    ```

  - **หากข้อมูลผิดพลาดรุนแรง:** Restore ข้อมูลกลับจาก Backup Dump:

    ```bash

    pg_restore -U <db_user> -h <db_host> -d <db_name> -c -v "./backup_pre_migration_xxx.dump"

    ```

---

---

### 6. ขั้นตอนการ Rollback ระบบ (Comprehensive Rollback Procedures)

เมื่อเกิดเหตุขัดข้องหลัง Deploy (เช่น Critical Bug, API พัง, หรือ Database Error) ให้ปฏิบัติตามคู่มือ Rollback ตามแต่ละสถานการณ์ด้านล่างอย่างเป็นลำดับขั้น:

#### สถานการณ์ A: Rollback โค้ดเว็บแอปพลิเคชัน (Application Code Rollback)

*(ใช้เมื่อโค้ดมีบั๊ก แต่โครงสร้าง Database ไม่ได้รับผลกระทบ)*

- **บน Vercel:**

  1. ไปที่ Dashboard -> โครงการ `calday` -> แท็บ **Deployments**

  2. เลือก Deployment ก่อนหน้าที่ทำงานได้ปกติ (Instant Rollback)

  3. คลิกปุ่มเมนู `...` -> เลือก **Promote to Production** หรือกด **Instant Rollback**

  4. ระบบจะสลับ Traffic ไปยังเวอร์ชันเก่าทันทีโดยไม่ต้อง Build ใหม่

- **บน VPS / PM2:**

  1. ย้อนกลับ Git commit ไปยัง commit หรือ tag ที่เสถียรล่าสุด:

     ```bash

     cd /var/www/calday

     git checkout <last-stable-commit-or-tag>

     ```

  2. ติดตั้ง dependencies และ build ใหม่:

     ```bash

     npm ci

     npm run build

     ```

  3. Reload Process แบบ Zero-Downtime ผ่าน PM2:

     ```bash

     pm2 reload calday

     ```

---

#### สถานการณ์ B: Rollback การย้ายฐานข้อมูล (Database Migration Rollback)

*(ใช้เมื่อ Migration สคริปต์ทำงานล้มเหลว หรือโครงสร้างตารางใหม่มีปัญหา)*

Prisma ไม่มีคำสั่ง `migrate down` อัตโนมัติ ดังนั้นการย้อนสถานะจึงแบ่งเป็น 2 กรณี:

##### กรณีที่ 1: Migration คำสั่งล้มเหลวครึ่งทาง (Failed Migration)

หาก `prisma migrate deploy` หยุดชะงักและเกิด Error ขึ้นระหว่างรัน ตาราง `_prisma_migrations` จะบันทึกสถานะว่า Failed:

1. วิเคราะห์ข้อผิดพลาดผ่านสถานะ:

   ```bash

   npx prisma migrate status

   ```

2. แก้ไข Schema หรือตารางใน Database ด้วยคำสั่ง SQL ให้กลับสู่สภาพก่อนรัน

3. แจ้งให้ Prisma ทราบว่าได้ Rollback รายการที่มีปัญหาแล้ว:

   ```bash

   npx prisma migrate resolve --rolled-back "<failed_migration_folder_name>"

   ```

4. ตรวจสอบสถานะอีกครั้ง: `npx prisma migrate status`

##### กรณีที่ 2: Migration รันสำเร็จแล้ว แต่ต้องการย้อนกลับ (Revert Applied Migration)

แนวทางมาตรฐาน Production คือการสร้าง **Down Migration (Reverting Migration)** เพื่อก้าวไปข้างหน้าอย่างปลอดภัย:

1. แก้ไขไฟล์ `prisma/schema.prisma` ย้อนกลับเป็นโครงสร้างเดิม

2. สร้าง Migration สคริปต์สำหรับการ Revert:

   ```bash

   npx prisma migrate dev --name revert_<feature_name>

   ```

3. ตรวจสอบไฟล์ SQL ที่ถูกสร้างในโฟลเดอร์ migration ใหม่ว่าทำการย้อนคำสั่งถูกต้อง (เช่น `DROP COLUMN` ที่เพิ่งเพิ่มมา)

4. Deploy การย้อนกลับขึ้น Production:

   ```bash

   npx prisma migrate deploy

   npx prisma generate

   ```

---

#### สถานการณ์ C: การกู้คืนข้อมูลฉุกเฉิน (Disaster Recovery / Full Database Restore)

*(ใช้เมื่อเกิด Data Corruption หรือมีคำสั่งลบข้อมูลสำคัญโดยไม่ตั้งใจ)*

1. **หยุด Traffic ชั่วคราว (Maintenance Mode):**

   เพื่อป้องกันไม่ให้มีข้อมูลใหม่เข้ามาทับซ้อนขณะกำลัง Restore:

   ```bash

   # หากใช้ PM2

   pm2 stop calday

   ```

2. **สร้างฐานข้อมูลสำรองของสถานะปัจจุบันก่อน (Safety Dump):**

   ```bash

   pg_dump -U calday -h localhost calday -F c -f "./calday_broken_state_$(date +%Y%m%d_%H%M%S).dump"

   ```

3. **Restore ข้อมูลจากไฟล์ Backup ก่อนเกิดเหตุ:**

   - **กรณีไฟล์ `.dump` (Custom Format):**

     ```bash

     pg_restore -U calday -h localhost -d calday -c -v "./backup_pre_migration_20261116.dump"

     ```

     *(แฟล็ก `-c` หรือ `--clean` จะล้างตารางเดิมก่อนกู้คืนข้อมูล)*

   - **กรณีไฟล์ `.sql` หรือ `.sql.gz`:**

     ```bash

     gunzip -c /var/backups/calday_20261116.sql.gz | psql -U calday -h localhost -d calday

     ```

4. **เปิดระบบและเริ่มให้บริการใหม่:**

   ```bash

   pm2 start calday

   # หรือ pm2 restart calday

   ```

5. **ทดสอบระบบหลัก (Sanity Check):** ล็อกอิน, ตรวจสอบมื้ออาหาร, และเช็ค Sentry เพื่อยืนยันว่าไม่มี Error ตกค้าง

---

### 7. การจัดการความปลอดภัยและคีย์ลับ (Secrets Management & Security Guidelines)

การจัดการ Secret และ API Keys เป็นหัวใจสำคัญของความปลอดภัยในระดับ Production เพื่อป้องกันไม่ให้ข้อมูลสำคัญรั่วไหล:

#### 🔒 กฎเหล็กด้านความปลอดภัย (Core Security Rules)

1. **ห้าม Commit ไฟล์ `.env` ลงใน Git เด็ดขาด:**

   - ตรวจสอบว่า `.env`, `.env.local`, และ `.env.production` อยู่ในไฟล์ `.gitignore` เสมอ

   - ใช้เฉพาะ `.env.example` (ที่มีเพียงโครงสร้างและ dummy value) ในการ push ขึ้น remote repository

2. **แยกแยะ Public และ Server-Only Environment Variables:**

   - ตัวแปรที่มี `NEXT_PUBLIC_` นำหน้า (เช่น `NEXT_PUBLIC_APP_URL`) จะถูก inline เข้าไปใน Client JavaScript Bundle ซึ่งผู้ใช้สามารถเปิดดูได้ใน Browser DevTools

   - **ห้ามใส่ Secret Key ใดๆ** (เช่น `STRIPE_SECRET_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `DATABASE_URL`) ในตัวแปรที่มี `NEXT_PUBLIC_` นำหน้าโดยเด็ดขาด

#### 🛠️ แนะนำวิธีการจัดเก็บ Secrets ตาม Platform

| รูปแบบ Platform | เครื่องมือ / วิธีการแนะนำ | แนวปฏิบัติ |

|---|---|---|

| **Vercel** | **Vercel Environment Variables** | กำหนดค่าผ่าน Dashboard หรือ Vercel CLI โดยแยก Scope ชัดเจนระหว่าง `Production`, `Preview`, และ `Development` พร้อมเปิดโหมด Sensitive เพื่อซ่อนค่า |

| **Self-Hosted VPS** | **System Environment / Protected File** | เก็บไฟล์ `.env.production` นอก webroot หรือจำกัดสิทธิ์อ่านเฉพาะ user ที่รัน service เช่น `chmod 600 .env.production` |

| **Enterprise / Cloud** | **Secret Manager Services** | ใช้บริการเช่น **AWS Secrets Manager**, **Google Secret Manager**, หรือ **Doppler / HashiCorp Vault** เพื่อดึงค่าขณะรันหรือ deploy |

#### 🔄 วงรอบการสลับคีย์ (Key Rotation Policy)

- **กำหนดรอบเปลี่ยนประจำ:** ควรวางแผนสลับคีย์ภายนอก (Stripe Secret, AI API Keys, Email App Passwords) ทุก 90-180 วัน

- **เมื่อสงสัยว่าคีย์รั่วไหล (Incident Response):**

  1. Revoke / ลบคีย์เก่าใน Dashboard ของ Provider นั้นๆ ทันที

  2. Generate คีย์ใหม่และอัปเดตลงใน Environment Variables ของ Production

  3. สั่ง Restart หรือ Redeploy แอปพลิเคชัน (`pm2 restart calday` หรือ Trigger Redeploy บน Vercel)

  4. หากเป็น `NEXTAUTH_SECRET` การเปลี่ยนคีย์จะทำให้ผู้ใช้เดิมทุกคนต้องล็อกอินใหม่ทันที ซึ่งปลอดภัยต่อการถูกขโมย Session

---

### 8. Database Maintenance & Backup Operations

- **ตั้ง Cron Job สำหรับ Auto Backup รายวัน (PostgreSQL):**

  ```bash

  # สำรองข้อมูลทุกวันเวลาตี 02:00

  0 2 * * * pg_dump -U calday -h localhost calday | gzip > /var/backups/calday_$(date +\%Y\%m\%d).sql.gz

  ```

- **Connection Pooling:** หากผู้ใช้เพิ่มขึ้น แนะนำให้เปิดใช้งาน PgBouncer หรือ Connection Pooler เพื่อควบคุมจำนวนการเชื่อมต่อ Database ไม่ให้เต็มโควต้า

- **Health Checks & Monitoring:** ตรวจสอบ Log และ Performance สม่ำเสมอผ่าน Sentry Dashboard และ PM2 monitoring (`pm2 monit`)

---

## 🔐 Authentication Flow (กระบวนการยืนยันตัวตน)

- **สมัครสมาชิก (Sign Up):** ผู้ใช้กรอกอีเมลและรหัสผ่าน เพื่อสร้างบัญชีใหม่

- **ส่งอีเมลยืนยัน (Verify Email):** ระบบจะสร้าง token สำหรับยืนยันอีเมล และส่งลิงก์ไปที่อีเมลของผู้ใช้

- **ยืนยันอีเมล:** ผู้ใช้เปิดลิงก์ `/verify-email?token=...` เพื่อยืนยันบัญชี

- **ลืมรหัสผ่าน (Forgot Password):** ผู้ใช้กรอกอีเมลที่ลงทะเบียนแล้ว ระบบจะส่งลิงก์ reset password ไปทางอีเมล

- **รีเซ็ตรหัสผ่าน:** ผู้ใช้เปิด `/reset-password?token=...` เพื่อกำหนดรหัสผ่านใหม่

- **ความปลอดภัย:** ระบบมีการจำกัดจำนวนคำขอ (rate limiting), token ที่หมดอายุอัตโนมัติ และการลบ token เก่าเมื่อใช้งานเสร็จแล้ว

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema) & การปรับปรุงประสิทธิภาพ

- **`User` & `Account`:** บริหารจัดการผู้ใช้และช่องทางการล็อกอิน

- **`Profile`:** เก็บข้อมูลพื้นฐาน (น้ำหนัก, ส่วนสูง, เป้าหมาย) และเก็บค่า BMR / TDEE

- **`Meal` & `FoodEntry`:** บันทึกข้อมูลมื้ออาหารแต่ละมื้อ และรายการย่อยในมื้อนั้นๆ พร้อมคุณค่าทางโภชนาการ

- **`FavoriteMeal`:** จัดเก็บรายการอาหารโปรดของผู้ใช้ พร้อมรายละเอียดเมนูและข้อมูลโภชนาการ เพื่อให้สามารถนำกลับมาใช้งานซ้ำได้

- **`DailySummary`:** สรุปยอดรวมแคลอรีและสารอาหารประจำวัน

- **`Subscription`:** ดูแลสถานะบัญชี Pro / Free ของผู้ใช้งาน

### 🚀 Database Indexing & Query Optimization

มีการออกแบบ Database Indexing เพื่อรองรับการค้นหาและดึงข้อมูลตามผู้ใช้และช่วงเวลาได้อย่างรวดเร็ว (ป้องกัน Full Table Scan):

- **`Meal`: `@@index([userId, createdAt])`** — Composite Index เพื่อเพิ่มประสิทธิภาพการค้นหาและกรองประวัติมื้ออาหารตามผู้ใช้และช่วงวันที่/เวลา

- **`DailySummary`: `@@unique([userId, date])`** — Compound Unique Constraint ที่ทำหน้าที่เป็น Composite Index ในตัว ช่วยเพิ่มความเร็วในการ Query สรุปผลรายวัน พร้อมทั้งป้องกันข้อมูลซ้ำซ้อนในวันเดียวกันของผู้ใช้แต่ละคน

## ⚡ Database Query Performance Monitoring

CalDay ใช้ Prisma Query Extension ร่วมกับ Pino เพื่อวัดระยะเวลาของ Prisma Model Operations โดยอัตโนมัติ โดยไม่ต้องเขียนตัวจับเวลาแยกในแต่ละ Repository หรือ API Route

### การทำงาน

Prisma รับ Model Operation เช่น findMany, findUnique, create หรือ update
Query Extension บันทึกเวลาเริ่มต้นด้วย performance.now()
ส่ง Query ให้ Prisma ดำเนินการตามปกติ
เมื่อ Query เสร็จสิ้น ระบบคำนวณระยะเวลาที่ใช้และส่งข้อมูลให้ Pino Logger
ใช้ finally เพื่อให้บันทึกระยะเวลาได้ทั้งกรณี Query สำเร็จและเกิด Error
### ข้อมูลที่บันทึก

Field	คำอธิบาย
model	Prisma Model ที่เรียกใช้งาน เช่น DailySummary
operation	ประเภท Operation เช่น findFirst หรือ findMany
duration	ระยะเวลาที่ Prisma Operation ใช้ หน่วยเป็น milliseconds
ตัวอย่าง Log แบบ JSON:

{
  "level": 30,
  "model": "DailySummary",
  "operation": "findFirst",
  "duration": 25.02,
  "msg": "Database Query Performance"
}
### การจัดรูปแบบ Log

ใช้ pino-pretty เป็น Pino Transport เฉพาะ Development เพื่อแปลง JSON Log ให้อ่านง่ายใน Terminal โดยตั้งค่า colorize เพื่อแสดงสี, translateTime เพื่อแสดงเวลาให้อ่านง่าย และ ignore เพื่อซ่อน Field ที่ไม่จำเป็น เช่น pid และ hostname

ใน Production จะไม่เปิดใช้ pino-pretty และคงรูปแบบ JSON เพื่อให้ระบบ Log Aggregation สามารถนำข้อมูลไปค้นหาและวิเคราะห์ต่อได้

### ข้อจำกัด

Monitoring นี้ครอบคลุม Prisma Model Operations ที่ผ่าน $allModels.$allOperations
Raw Queries เช่น $queryRaw และ $executeRaw ไม่ถูกรวมอยู่ในการวัดด้วย Extension ชุดนี้
duration คือเวลาที่วัดได้รอบ Prisma Operation ไม่ใช่เวลาประมวลผล SQL ภายใน PostgreSQL เพียงอย่างเดียว
การวัดนี้ใช้สำหรับตรวจสอบ Query ที่ใช้เวลานานและช่วยระบุจุดที่ควรนำไปวิเคราะห์เพิ่มเติม ไม่ได้เปลี่ยนพฤติกรรมของ Query
## 🛡️ Resilience: AI Circuit Breaker

CalDay มีระบบ Circuit Breaker สำหรับการเรียกใช้ Google Gemini เพื่อป้องกันความล้มเหลวแบบต่อเนื่องจาก AI Provider

- หาก AI ล้มซ้ำหลายครั้งภายในช่วงเวลาเดียวกัน ระบบจะปิดวงจร (open circuit) และปฏิเสธ request ทันที

- หลังผ่านช่วง cooldown จะเข้าสู่ half-open state เพื่อลองตรวจสอบสถานะอีกครั้งแบบจำกัด

- ใช้ร่วมกับ provider boundary ใน `lib/services/ai.ts` และ state machine ใน `lib/resilience/circuit-breaker.ts`

- กรณี provider ขัดข้องหรือถูก rate limit จะตอบกลับด้วย error แบบแอปพลิเคชัน เช่น `AI_PROVIDER_UNAVAILABLE` และ `AI_QUOTA_EXCEEDED`

หลักการทำงาน:

- Closed: request ปกติ

- Open: fail fast เพื่อป้องกัน overload

- Half-open: เปิดให้มีการ probe จำกัดเพื่อลองกู้คืน

- Cooldown: เมื่อ circuit เปิดแล้ว รอจนกว่าจะเริ่ม recover

การออกแบบนี้ช่วยให้แอปไม่ล่มตามไปด้วยเมื่อ Gemini มีปัญหา และยังให้ระบบกลับมาใช้งานได้โดยอัตโนมัติเมื่อ provider ฟื้นตัว

## ⚡ Redis Cache

- ระบบ Redis cache ยังใช้ TTL jitter ใน `lib/cache.ts` เพื่อป้องกัน cache stampede: เวลา expiry ถูกสุ่มเพิ่ม 0–60 วินาที ทำให้แต่ละ instance หมดอายุไม่พร้อมกัน และลดการ refresh พร้อมกันเมื่อ cache หมดอายุ

**## ⚡ Request Deduplication

มี Utility สำหรับป้องกันการส่ง HTTP Request ซ้ำซ้อนในช่วงเวลาที่ Request เดิมยังทำงานอยู่ โดยใช้ In-memory `Map<string, Promise<unknown>>` ใน `lib/http/request-deduplication.ts`

เมื่อมี Request ที่ใช้ Key เดียวกันและยังไม่เสร็จ ระบบจะคืน Promise เดิมให้ผู้เรียกใช้ แทนการเรียก API ซ้ำ

เมื่อ Request สำเร็จหรือล้มเหลว จะลบ Key ออกจาก Map เพื่อให้ Request ครั้งถัดไปสามารถทำงานได้ตามปกติ

เหมาะกับการใช้งานกับ GET Request ที่มีเงื่อนไขและผลลัพธ์ที่คาดหวังเหมือนกัน เช่น การดึงข้อมูล Profile

Key ต้องแยกตามบริบทที่มีผลต่อผลลัพธ์ เช่น ผู้ใช้, Query Parameters หรือ Locale เพื่อไม่ให้ Request คนละบริบทใช้ Promise ร่วมกัน

เป็นการป้องกันเฉพาะ Request ที่ทำงานพร้อมกัน ไม่ใช่ Cache และไม่ใช่ Idempotency จึงไม่ควรใช้แทนกลไกป้องกันการทำรายการซ้ำฝั่ง Server สำหรับ POST ที่มีผลข้างเคียง

มี Unit Tests ด้วย Vitest เพื่อทดสอบการใช้ Promise ร่วมกัน, การแยก Request ต่าง Key, การ Retry หลัง Request ล้มเหลว และการ Deduplicate Request ที่เกิดขึ้นพร้อมกัน

🚨 Error Monitoring & Observability (Sentry)**

โปรเจกต์นี้ติดตั้งและเชื่อมต่อระบบติดตามข้อผิดพลาดและประสิทธิภาพด้วย **[Sentry](https://sentry.io/)** แบบ Full-stack:

- **Client-Side Monitoring (`instrumentation-client.ts`):** ดักจับ JavaScript Error บนเบราว์เซอร์ของผู้ใช้ พร้อมฟีเจอร์ **Session Replay** ที่บันทึกคลิปจำลองการใช้งานของผู้ใช้ก่อนเกิด Error (ตั้งค่าบันทึก 100% เมื่อเกิด Error) ช่วยให้ Debug ได้ง่ายและตรงจุด

- **Server-Side Monitoring (`sentry.server.config.ts`):** ดักจับ Error ที่เกิดขึ้นบน Node.js Server เช่น API Routes, Server Actions และ Database Queries

- **Edge Runtime Monitoring (`sentry.edge.config.ts`):** ดักจับ Error ในส่วน Middleware และ Edge Functions

- **Global Error Handling (`app/global-error.tsx`):** มี Error Boundary ดักจับ Error ระดับ Root Layout และส่ง Exception ไปยัง Sentry ทันที

- **Source Maps & Tunneling (`next.config.ts`):** ปรับแต่ง Build Plugin ให้อัปโหลด Source Maps เพื่อให้ Stack Trace แสดงชื่อไฟล์และบรรทัดใน TypeScript ตรงเป๊ะ พร้อมระบบ `/monitoring` Tunnel ป้องกันไม่ให้เบราว์เซอร์ที่มี Ad-blocker บล็อกการส่งข้อมูล Error ไปยัง Sentry

## 🧪 การรันเทสต์ (Testing)

โปรเจคนี้มีระบบทดสอบ 2 ระดับ:

### Unit / Integration Tests — [Vitest](https://vitest.dev/)

ใช้สำหรับทดสอบ API Routes, Business Logic, และ Utilities

```bash

npm run test

```

### End-to-End Tests — [Playwright](https://playwright.dev/)

ใช้สำหรับทดสอบ User Flow บนเบราว์เซอร์จริง (Chromium, Firefox)

ไฟล์เทสต์อยู่ในโฟลเดอร์ `tests/`

> **หมายเหตุ:** ต้องรัน Development Server ก่อน หรือ Playwright จะเปิดให้อัตโนมัติผ่าน `webServer` ใน `playwright.config.ts`

```bash

# รันเทสต์ทั้งหมด

npx playwright test

# รันพร้อม UI Mode (แนะนำสำหรับ Debug)

npx playwright test --ui

# ดูรายงานผลเทสต์ล่าสุด

npx playwright show-report

```





