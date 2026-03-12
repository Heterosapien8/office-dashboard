# PrithviNet — Setup Guide

## Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- LM Studio installed (https://lmstudio.ai) with Llama 3.1 8B loaded

---

## Step 1 — Firebase Project Setup

1. Go to https://console.firebase.google.com
2. Create a new project: **prithvinet-hackathon**
3. Enable **Firestore Database** (Native mode, any region)
4. Enable **Authentication** → Sign-in method → **Email/Password**
5. Enable **Hosting**
6. Go to Project Settings → General → Your Apps → **Add web app**
7. Copy the `firebaseConfig` object
8. Paste it into `frontend/src/config/firebase.js`

---

## Step 2 — Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Seed script (in root)
cd ..
npm install firebase-admin
```

---

## Step 3 — Run the Seed Script

1. Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key** → save as `serviceAccountKey.json` in project root
3. Run:
```bash
node seed.js
```
This writes: 6 ROs, 18 industries, 14 monitoring locations, 11 prescribed limits, 6 public summaries, 3 demo violations + escalations.

---

## Step 4 — Create Auth Users

In Firebase Console → Authentication → Users → Add user:

| Email | Password | Role |
|---|---|---|
| admin@prithvinet.gov.in | Admin@123 | superAdmin |
| ro.raipur@prithvinet.gov.in | Raipur@123 | regionalOfficer |
| ro.korba@prithvinet.gov.in | Korba@123 | regionalOfficer |
| team1@prithvinet.gov.in | Team@123 | monitoringTeam |

After creating each user, go to Firestore → `users` collection → Add document with the user's UID:
```json
{
  "uid": "<paste uid here>",
  "name": "Super Admin",
  "email": "admin@prithvinet.gov.in",
  "role": "superAdmin",
  "roId": null,
  "roName": null,
  "permissions": {
    "reportAir": true,
    "reportWaterNatural": true,
    "reportWaterWaste": true,
    "reportNoise": true,
    "reportIndustrial": true
  },
  "isActive": true
}
```

For RO users, set `"role": "regionalOfficer"`, `"roId": "RO-001"`, `"roName": "Raipur Regional Office"`.

---

## Step 5 — Deploy Firestore Rules & Indexes

```bash
firebase login
firebase init   # select Firestore + Hosting, link to your project
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Step 6 — Start Dev Server

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 → Login with admin@prithvinet.gov.in / Admin@123

---

## Step 7 — LM Studio Setup (PrithviAI)

1. Download LM Studio from https://lmstudio.ai
2. In LM Studio → Search → Download **Llama 3.1 8B Instruct (GGUF Q4_K_M)**
3. Load the model → Go to **Local Server** tab → Start Server
4. Server runs at http://localhost:1234/v1

The PrithviAI chat widget will show a green dot when LM Studio is running.

---

## Step 8 — Build & Deploy

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

---

## Demo Checklist

Before the demo, verify:
- [ ] Admin login works
- [ ] Dashboard shows KPI cards with live data
- [ ] Violations appear in compliance dashboard
- [ ] Map loads with coloured markers (Raipur and Korba markers are red)
- [ ] Air report form loads industry dropdown
- [ ] Submit a new air report → violation triggers → dashboard updates live
- [ ] Escalation board shows the new violation at PENDING
- [ ] Citizen portal shows Raipur, Korba with orange/red AQI
- [ ] LM Studio running → AI chat responds
- [ ] Backup demo video recorded

---

## Project Structure Quick Reference

```
prithvinet/
├── frontend/src/
│   ├── config/          firebase.js, constants.js
│   ├── contexts/        AuthContext, NotificationContext
│   ├── layouts/         AppLayout, AuthLayout, PublicLayout
│   ├── components/      MasterListPage, MasterFormPage, Sidebar, Topbar
│   ├── pages/
│   │   ├── auth/        LoginPage, Page403
│   │   ├── dashboard/   Dashboard
│   │   ├── master/      RegionalOffices, Industries, MasterPages
│   │   ├── reports/     air/, water/, noise/
│   │   ├── compliance/  ComplianceDashboard, EscalationBoard
│   │   ├── map/         HeatmapPage
│   │   └── public/      CitizenPortal
│   └── utils/           aqiCalculator.js
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── seed.js
└── README.md
```
