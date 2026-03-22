# 🔧 GarageBook — Auto Parts Dukaan Manager

Ek simple, offline web app jo chhoti auto parts dukaan ke liye banaya gaya hai.  
Koi server nahi, koi internet nahi — bas `index.html` browser mein kholo aur kaam shuru.

---

## 🚀 Kaise Chalayein

1. Repository clone karo ya ZIP download karo
2. `index.html` browser mein kholo (double-click kaafi hai)
3. Bas — app ready hai!

---

## 📦 Features

### 📊 Dashboard
- Aaj ki total kamai (cash + online)
- Total udhaar baaki
- Aaj kitne items biche
- Low stock alert (3 ya kam bacha ho toh red mein)

### 📦 Inventory
- Naye parts add karo (naam, stock, price)
- Inline stock aur price edit karo (koi popup nahi)
- Item delete karo
- ⚠️ Warning jab stock 3 ya kam ho

### 🛒 Bikri Darj Karo
- Item select karo → price auto fill
- Quantity daalo → total amount auto calculate
- Payment: Cash / Online / Udhaar
- Udhaar mein customer naam zaroori

### 📋 Udhaar Bahi
- Customer-wise pending udhaar dikhega
- Detail mein dekho kaunsa item baaki hai
- "✅ Paid" button se mark karo jab paise aa jayein

### 🕓 History
- Date aur payment type se filter karo
- Poori bikri ka record

### ⬇️ Export
- Saara data CSV mein export karo (Excel mein khul jaata hai)

---

## 💾 Data Storage

Sab data browser ke **localStorage** mein save hota hai.  
Internet ya server ki koi zaroorat nahi.

> ⚠️ Browser cache clear karne se data delete ho sakta hai — backup ke liye CSV export karo.

---

## 🛠️ Tech Stack

| Cheez | Detail |
|---|---|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Storage | Browser localStorage |
| Dependencies | Koi nahi (zero) |
| Files | Sirf ek — `index.html` |

---

## 📁 Project Structure

```
GarageBook-/
└── index.html   ← poora app (HTML + CSS + JS sab ek file mein)
```

---

## 👤 Kiske Liye Hai

- Chhoti auto parts / garage dukaan
- Jo log simple hisaab-kitaab chahte hain
- Jahan internet reliable nahi hota
