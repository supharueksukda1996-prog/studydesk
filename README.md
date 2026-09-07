# StudyDesk — PWA

แอปจัดการงาน / โฟกัส / นิสัย / การเงิน สำหรับนักศึกษาแพทย์
ทำงานเป็น **PWA** — ติดตั้งบน iPhone, ใช้ออฟไลน์ได้, ล็อกอิน Gmail และ sync ข้ามเครื่อง (เมื่อตั้งค่า Firebase)

---

## ไฟล์ในโปรเจกต์

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | ตัวแอปทั้งหมด (UI + ลอจิก) |
| `manifest.webmanifest` | ข้อมูลแอปสำหรับติดตั้ง (ชื่อ/ไอคอน/สี) |
| `sw.js` | Service worker — ทำให้ใช้ออฟไลน์ + ติดตั้งได้ |
| `firebase-config.js` | ใส่ค่า Firebase ตรงนี้ (ค่าเริ่มต้นว่าง = ใช้แบบ local) |
| `sync.js` | ล็อกอิน Gmail + sync ข้าม iPhone ↔ คอม (ทำงานเมื่อใส่ config แล้ว) |
| `icon-*.png`, `apple-touch-icon.png` | ไอคอนแอป |

> ถ้ายังไม่ตั้งค่า Firebase แอปก็ใช้งานได้ครบทุกอย่าง แค่ข้อมูลเก็บในเครื่องนั้นเครื่องเดียว (และมีปุ่ม **สำรอง/กู้คืน** ในเมนู 👤 ให้ย้ายเครื่องเองได้)

---

## ขั้นที่ 1 — เอาขึ้นเว็บฟรีด้วย GitHub Pages

1. สร้างบัญชี GitHub (ถ้ายังไม่มี): https://github.com
2. สร้าง repository ใหม่ (เช่นชื่อ `studydesk`) → ตั้งเป็น **Public**
3. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้เข้า repo (ปุ่ม **Add file → Upload files** ลากไฟล์ทั้งหมดลงไป → Commit)
4. ไปที่ repo → **Settings → Pages** → ในหัวข้อ *Branch* เลือก `main` และโฟลเดอร์ `/ (root)` → **Save**
5. รอสักครู่ จะได้ลิงก์ `https://<ชื่อคุณ>.github.io/studydesk/`
6. เปิดลิงก์นั้นใน **Safari บน iPhone** → ปุ่มแชร์ ↑ → **เพิ่มไปยังหน้าจอโฮม** ✅ ได้แอปติดตั้งพร้อมใช้ออฟไลน์

*(ถ้ามี `git` ในเครื่องแล้ว: `git init && git add . && git commit -m "studydesk" && git branch -M main && git remote add origin <repo-url> && git push -u origin main`)*

---

## ขั้นที่ 2 — เปิดล็อกอิน Gmail + sync ข้ามเครื่อง (Firebase ฟรี)

1. ไปที่ https://console.firebase.google.com → **Add project** → ตั้งชื่อ → สร้าง
2. เมนูซ้าย **Build → Authentication → Get started → Sign-in method →** เปิด **Google** → Save
3. เมนูซ้าย **Build → Firestore Database → Create database →** เลือก **Production mode** → เลือก region (เช่น asia-southeast1) → Enable
4. **Firestore → Rules** วางกฎนี้แล้ว **Publish** (ให้แต่ละคนเห็นข้อมูลของตัวเองเท่านั้น):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
5. ⚙️ (มุมซ้ายบน) **Project settings → General → Your apps →** กดไอคอน **Web `</>`** → ตั้งชื่อ → Register app
6. จะเห็นบล็อก `const firebaseConfig = { apiKey: "...", ... }` → เอาค่าพวกนี้มาใส่ใน **`firebase-config.js`**
7. **Authentication → Settings → Authorized domains →** เพิ่มโดเมน GitHub Pages ของคุณ (`<ชื่อคุณ>.github.io`)
8. อัปโหลด `firebase-config.js` ที่แก้แล้วขึ้น GitHub อีกครั้ง

เสร็จแล้ว! เปิดแอป → เมนู 👤 → **เข้าสู่ระบบด้วย Gmail** → ข้อมูลจะ sync ข้ามเครื่องอัตโนมัติ

---

## การแจ้งเตือน

- **ในแอป (เปิดอยู่):** งาน/เวรที่ใส่ "เวลา" จะเด้งเตือนเมื่อถึงเวลา
- **ตอนปิดแอป:** ใช้ปุ่ม 📅 ในแอปเพิ่มงาน/เวร/สอบ เข้า **Google Calendar** แล้วให้ปฏิทินเตือน (เชื่อถือได้สุดบน iPhone)
  - เคล็ดลับ: ตั้ง *default reminder* ใน Google Calendar ครั้งเดียว ทุกอีเวนต์จะได้การเตือนอัตโนมัติ

## หลายผู้ใช้ (multi-account)
- แต่ละคนล็อกอิน **Gmail ของตัวเอง** → ข้อมูลแยกกันสมบูรณ์ (เก็บที่ `users/{uid}` และกฎ Firestore ล็อกให้เห็นเฉพาะของตัวเอง)
- Deploy ครั้งเดียว แชร์ลิงก์เดียว ทุกคนมี StudyDesk ส่วนตัว — เหมาะกับกลุ่มอ่านหนังสือ
- **สลับผู้ใช้บนเครื่องเดียว:** กด **ออกจากระบบ** แล้วแอปจะ**ล้างข้อมูลในเครื่อง + รีโหลด** อัตโนมัติ เพื่อให้คนต่อไปล็อกอินได้สะอาด ไม่ปนกัน (ข้อมูลบนคลาวด์ของแต่ละคนยังอยู่ครบ)

## หมายเหตุ
- รูป (สลิป/รูปงาน) เก็บในเครื่อง (IndexedDB) — ยังไม่ sync ขึ้นคลาวด์ในเวอร์ชันนี้ และจะถูกล้างเมื่อออกจากระบบ (เพื่อความเป็นส่วนตัวบนเครื่องที่ใช้ร่วมกัน)
- ข้อมูลอื่นทั้งหมด sync ผ่าน Firestore เมื่อล็อกอิน
