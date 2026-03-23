# 🔧 GarageBook — Auto Parts Dukaan Manager

Ek production-ready web app jo chhoti auto parts dukaan ke liye banaya gaya hai.  
Next.js 14 + SQLite — fast, secure, aur offline-friendly.

---

## 🚀 Kaise Chalayein

```bash
cd garagebook
npm install
npm run dev
```

Browser mein kholo: **http://localhost:3000**

### Production ke liye:
```bash
npm run build
npm start
```

---

## 📦 Features

| Page | Kya karta hai |
|---|---|
| 🏠 Dashboard | Aaj/week/month ki kamai, low stock alert, CSV export |
| 📦 Parts | Add/edit/delete parts, buy price, search |
| 🛒 New Sale | Part select → qty → payment → save |
| 📋 Credit | Customer-wise udhaar, mark paid |
| 🕓 History | Date + payment filter, total summary |
| ⚙️ Admin | Customers, Returns, Reports |
| 🧾 Bill | Multi-item bill, print-ready |

---

## 💾 Data Storage

- **Database:** SQLite (`garagebook.db`) — project root mein
- **Backup:** Dashboard se CSV export karo

> ⚠️ `garagebook.db` delete mat karna — sab data isme hai!

---

## 🛠️ Tech Stack

| Cheez | Detail |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite (better-sqlite3) |
| API | Next.js Route Handlers |

---

## 📁 Project Structure

```
garagebook/
├── app/
│   ├── page.tsx          ← Dashboard
│   ├── inventory/        ← Parts management
│   ├── sale/             ← New sale
│   ├── credit/           ← Udhaar bahi
│   ├── history/          ← Sale history
│   ├── admin/            ← Customers, Returns, Reports
│   ├── bill/             ← Print bill
│   └── api/              ← REST API routes
├── components/           ← Navbar, Toast, StatCard, TableStates
├── lib/
│   ├── db.ts             ← SQLite connection + schema
│   └── utils.ts          ← Shared helpers
└── types/index.ts        ← TypeScript types
```
