# FairSplit ⚡

> Die moderne, ultraschnelle Progressive Web App (PWA) als kompromisslose Splitwise-Alternative.

FairSplit löst das Problem gemeinsamer Ausgaben, Restaurant-Rechnungen mit Einzelposten und unübersichtlicher Gruppenschulden – passwortlos, offline-fähig und mit automatischer Schulden-Minimierung.

![FairSplit PWA](public/icons/icon-512.png)

---

## ✨ Kern-Features

### 1. 🍕 Der Beleg-Splitter (Multi-Item & Restaurant-Modus)
- **Einzelposten-Erfassung:** Teile Gerichte und Getränke punktgenau auf (z. B. *Pizza Salami 14€*, *Wein 28€*).
- **Individuelle Teilnehmer-Zuordnung:** Weise jeden Posten beliebigen Personen zu (z. B. Wein nur für Person A & B).
- **Smarte Zuschläge (Trinkgeld & Service):** Wähle Trinkgeld (5%, 10%, 15% oder fester €-Betrag) und verteile es wahlweise **proportional zum individuellen Verzehr** oder **gleichmäßig**.
- **Multi-Payer:** Unterstützt Rechnungen, die von mehreren Personen anteilig bezahlt wurden.

### 2. ⚡ Smart Debt Simplification (Min-Cash-Flow)
- Greedy Min-Cash-Flow Algorithmus löst zirkuläre Verbindlichkeiten automatisch auf.
- Reduziert beispielsweise 12 Kreuz-Überweisungen auf 2 direkte Zahlungen.

### 3. 💳 1-Klick Settle Up & SEPA GiroCode (EPC-QR)
- **SEPA EPC-QR-Code (GiroCode):** Generiert genormte Banking-QR-Codes, die mit Sparkasse, DKB, N26, ING, etc. direkt gescannt werden können (inkl. IBAN, Betrag & Verwendungszweck).
- **PayPal.me:** 1-Klick Zahlungslink mit vorausgefülltem Betrag.
- **Barausgleich:** 1-Klick Bestätigung für Barzahlungen mit Konfetti-Animation.

### 4. 🔑 Zero-Friction & Passwortlos
- **Passkeys (WebAuthn / Face ID / Touch ID):** 1-Klick biometrischer Login.
- **Sofortiger Gast-Modus:** Mit einem Klick beitreten, ohne Account-Zwang.
- **1-Klick QR & Share Link:** `/join/[groupToken]` zum schnellen Einladen.

### 5. 📱 Mobile-First PWA
- Standalone UI, installierbar auf Homescreen (iOS & Android).
- Touch-optimierte Bottom-Sheets.
- Offline-Caching mit Service Worker.

---

## 🛠️ Tech-Stack

- **Frontend:** Next.js (App Router), React 18, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend / Database:** Supabase (PostgreSQL, Realtime Subscriptions, WebAuthn Auth)
- **PWA:** Web App Manifest (`manifest.json`), Offline Service Worker (`sw.js`)

---

## 🚀 Lokale Entwicklung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Entwicklungsserver starten
npm run dev

# 3. Production Build testen
npm run build
```

---

## 🗄️ Supabase Setup (Optional für Cloud-Sync)

1. Führe das SQL-Skript in `supabase/schema.sql` in deinem Supabase SQL Editor aus.
2. Erstelle eine `.env.local` Datei im Projektverzeichnis:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
