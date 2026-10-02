# Shamsiddin portfolio — tayyor mustaqil loyiha

React + Vite frontend, Express backend, SQLite ma’lumotlar bazasi, serverda saqlanadigan rasmlar. ChatGPT hisobiga kirish kerak emas. /admin uchun o‘zingiz tanlagan parol ishlaydi.

## 1. Kompyuterda eng oson ishga tushirish

1. ZIPni to‘liq oching (Извлечь всё). ZIP ichidan to‘g‘ridan-to‘g‘ri ishga tushirmang.
2. Node.js **22.13 yoki yangi** versiyasi kerak. Node 24 ham mos.
3. Windowsda **ISHGA-TUSHIRISH.bat** faylini ikki marta bosing.
4. Birinchi ochilishda paketlar o‘rnatiladi. Admin parolini ikki marta kiriting: kamida 12 belgi. Terminalda kiritgan parolingiz ko‘rinadi; o‘zingizning kompyuteringizda bajaring.
5. Brauzerda **http://localhost:3000** ni oching.
6. Admin panel: **http://localhost:3000/admin**.

Terminal orqali, aynan package.json turgan papkada:

```sh
npm install
npm start
```

Birinchi ishga tushishda parol sozlanadi va frontend avtomatik yig‘iladi. Keyingi safar faqat `npm start`. Internet paketlarni birinchi marta o‘rnatish uchun kerak. Sayt ishlashi uchun terminal ochiq turadi. To‘xtatish: Ctrl+C.

Agar parolni oldindan sozlamoqchi bo‘lsangiz: `npm run setup`.

## 2. Render’da joylash — doimiy saqlash bilan

**Muhim: ushbu SQLite versiyasi Render’da pullik Web Service va persistent disk talab qiladi.** Bepul Render diski vaqtinchalik: restart/deployda baza va rasmlar o‘chishi mumkin. Shu sabab `render.yaml`da Starter va disk tanlangan. Pullik xizmatni yaratishdan oldin Render ko‘rsatgan narxni tekshiring.

1. GitHub’da yangi repository oching.
2. ZIPdan chiqqan papkaning ichidagi fayllarni GitHub’ga yuklang. Repository boshida **package.json**, **render.yaml**, **server/** ko‘rinsin. ZIPning o‘zini yuklamang. `.env`, `data`, `node_modules` ni yuklamang.
3. Render → **New → Blueprint** → GitHub repositoryni tanlang.
4. `ADMIN_PASSWORD` uchun kamida 12 belgili shaxsiy parol kiriting.
5. Starter va 1 GB persistent disk sozlamalarini ko‘rib, **Deploy** qiling.
6. Render bergan `https://...onrender.com` havolani oching. Admin: shu havola oxiriga `/admin` qo‘shing.

Blueprint ishlatmasdan **New → Web Service** orqali ham:

| Sozlama | Qiymat |
|---|---|
| Language | Node |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/healthz` |
| Instance | Starter yoki disk qo‘llaydigan pullik reja |
| Disk mount path | `/var/data/portfolio` |
| Disk size | 1 GB |
| NODE_VERSION | `22.16.0` |
| NODE_ENV | `production` |
| DATA_DIR | `/var/data/portfolio` |
| TRUST_PROXY_HOPS | `1` |
| ADMIN_PASSWORD | O‘zingiz tanlagan kamida 12 belgili parol |

Render o‘z domenini avtomatik aniqlaydi. Shaxsiy domen ulasangiz `APP_URL=https://sizning-domeningiz.uz` sozlang. Oxirida `/` bo‘lishi shart emas.

Bu ZIPni yuklashning o‘zi internetga sayt chiqarmaydi. Render yoki boshqa hostingni o‘zingiz ulaysiz. Ushbu mustaqil versiya hostga deploy qilinganda portfolio hammaga ochiq, admin panel parol bilan himoyalangan.

## 3. Admin panel

- **Profil:** ism, kasb, matnlar, ko‘nikmalar, Telegram/GitHub havolalari va portret.
- **Loyihalar:** qo‘shish, tahrirlash, o‘chirish, rasm, texnologiyalar, havolalar, tartib va ko‘rsatish/yashirish.
- **Xizmatlar:** tavsif, narx, tartib va ko‘rsatish/yashirish.
- **Buyurtmalar:** ism, telefon, izoh, Toshkent vaqti, holat va filtr.
- **Xavfsizlik:** joriy parol orqali yangi parol tanlash. Barcha eski sessiyalar yopiladi.

Rasm yuklagandan so‘ng **Saqlash** tugmasini bosing. Faqat JPEG, PNG, WebP, 5 MB gacha. Dastlab loyiha yo‘q; narxlar **Kelishiladi**.

Parolni uch marta ketma-ket noto‘g‘ri kiritsangiz, shu IP manzili uchun kirish **aniq 1 soat** bloklanadi. Sahifani yangilash, cookie tozalash va serverni qayta ishga tushirish blokni olib tashlamaydi. Blok vaqtida to‘g‘ri parol ham qabul qilinmaydi. Bitta umumiy Wi-Fi/NATdagi qurilmalar bir IPga ega bo‘lishi mumkin.

## 4. Fayllar qayerda saqlanadi?

Mahalliy holatda `data/portfolio.sqlite` — ma’lumotlar; `data/uploads/` — rasmlar. Render’da ikkalasi DATA_DIR ichida, persistent diskda turadi. Saytni ko‘chirganda shu papkani ham ko‘chiring. Parol hash holatida saqlanadi; frontendga parol qo‘shilmagan.

Zaxira olish: serverni to‘xtating, butun `data` papkasini nusxalang, qayta ishga tushiring. Ishlayotgan SQLite faylini alohida ko‘chirmang. Diskdagi fayllarni o‘chirmang. ZIP ichiga foydalanuvchi buyurtmalari, eski parol yoki maxfiy ma’lumotlar qo‘shilmagan.

Bu bir serverli loyiha. SQLite bilan bir nechta instance’ga masshtablamang. Disk yo‘q serverless hostingda ishlatmang.

## 5. Dasturchi uchun

```sh
npm run build       # frontend va backend yig‘ish
npm start           # tayyor nusxani ishga tushirish
npm run dev         # Vite interfeysi: http://localhost:5173
npm run typecheck   # TypeScript tekshiruvi
npm test            # backend integratsiya testlari
npm run test:smoke  # haqiqiy HTTP server va disk tekshiruvi
```

`npm run dev` vaqtida frontend o‘zgarishlari avtomatik ko‘rinadi. Backend o‘zgarsa jarayonni qayta ishga tushiring. Oddiy `npm start`da kod o‘zgargandan keyin `npm run build`ni bajaring.

Tuzilishi:

- `src/Portfolio.tsx` — asosiy sayt.
- `src/Admin.tsx` — admin panel.
- `src/styles.css` — responsive dizayn.
- `lib/backend.ts` — validatsiya, login, CRUD, buyurtmalar.
- `lib/security.ts` — scrypt, sessiya yordamchilari, blokirovka.
- `server/index.ts` — Express va xavfsiz transport.
- `server/storage.ts` — SQLite, migratsiyalar, rasm saqlash.
- `drizzle/*.sql` — avtomatik qo‘llanadigan migratsiyalar.
- `render.yaml` — Render sozlamasi.
- `Dockerfile` — doimiy disk va HTTPS reverse proxy bilan boshqa hostingga joylash.

Proxy: mahalliy serverda `TRUST_PROXY_HOPS=0`; Render Blueprint bitta platforma reverse proxy uchun `1` o‘rnatadi. VPSda faqat haqiqiy proxy sonini belgilang, to‘g‘ridan-to‘g‘ri public backend portini ochmang. Server tashqi `oai-*` yoki boshqa identity headerlarini ishonchli deb olmaydi. IP Express orqali belgilangan transport topologydan olinadi; `trust proxy=true` ishlatilmaydi.

Himoya: scrypt hash, 8 soatlik HttpOnly/SameSite session, HTTPS Secure cookie, CSRF token va origin tekshiruvi, parameterized SQL, input validatsiya, Helmet CSP, limitlangan fayl hajmi, Sharp bilan to‘liq rasm decode/re-encode, spam token/honeypot/idempotency, server-side rate limit.

## Muammolar

- **node topilmadi:** Node.jsni o‘rnating, terminalni qayta oching.
- **node:sqlite topilmadi:** Node 22.13+ yoki 24 ishlating.
- **PORT ishlatilmoqda:** `.env` ichida `PORT=3001` yozing, qayta ishga tushiring.
- **So‘rov manbasi tasdiqlanmadi:** saytni ko‘rsatilgan URLdan oching; productionda APP_URLni haqiqiy HTTPS domenga moslang.
- **Parol o‘zgarmadi:** ADMIN_PASSWORD faqat birinchi sozlash uchun. Keyin `/admin` → Xavfsizlik orqali almashtiriladi.
- **Baza ochilmadi:** DATA_DIR yozish mumkin bo‘lgan joyda va hosting diski shu yo‘lga ulangan bo‘lsin.

Render rasmiy yo‘riqnomalari: https://render.com/docs/disks va https://render.com/docs/blueprint-spec
