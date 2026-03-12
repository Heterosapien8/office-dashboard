# PrithviNet Requirements

## System Requirements

- Node.js 18 or newer
- npm
- Firebase CLI
- PowerShell users on this machine should use `.cmd` variants for CLI tools:
  - `npm.cmd`
  - `firebase.cmd`

## Project Dependencies

### Root

Install from the project root:

```powershell
npm.cmd install
```

This installs:

- `firebase-admin`

### Frontend

Install from the `frontend` folder:

```powershell
cd frontend
npm.cmd install
```

This installs:

- `react`
- `react-dom`
- `react-router-dom`
- `firebase`
- `recharts`
- `leaflet`
- `react-leaflet`
- `lucide-react`
- `openai`
- `date-fns`
- `clsx`
- `vite`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `@vitejs/plugin-react`

## Setup Order For A New Machine

1. Clone the repo
2. Run root install:

```powershell
npm.cmd install
```

3. Install frontend dependencies:

```powershell
cd frontend
npm.cmd install
```

4. Return to project root and add `serviceAccountKey.json`
5. Seed Firestore:

```powershell
cd ..
npm.cmd run seed
```

6. Start the frontend:

```powershell
cd frontend
npm.cmd run dev
```

## Files Not Included In Git

These must be created locally by each teammate:

- `serviceAccountKey.json`
- `frontend/.env`

## Frontend Environment Variables

Create `frontend/.env` using `frontend/.env.example` and fill in:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```
