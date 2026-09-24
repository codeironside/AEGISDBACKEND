# Quick Start Commands

## Install Dependencies
```bash
npm install
```

## Development Commands

### Start Development Server (auto-restart on .env changes)
```bash
npm run start:dev
```

### Start Staging Environment
```bash
npm run start:staging
```

### Start Production Environment (locally)
```bash
npm run start:prod:local
```

### Start in Debug Mode
```bash
npm run start:debug
```

## Environment Files

| File | Purpose | Auto-restart |
|------|---------|--------------|
| `.env.development` | Local development | ✅ Yes |
| `.env.staging` | Staging/QA | ✅ Yes |
| `.env.production` | Production | ✅ Yes |
| `.env.test` | Testing | ✅ Yes |
| `.env.example` | Template | N/A |

## What Triggers Auto-Restart?

✅ TypeScript files (`.ts`)
✅ JavaScript files (`.js`)
✅ JSON files (`.json`)
✅ **Environment files (`.env`, `.env.*`)**

## First Time Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment template:
   ```bash
   copy .env.example .env.development
   ```

3. Update values in `.env.development`

4. Start development:
   ```bash
   npm run start:dev
   ```

## Switching Environments

Just use the appropriate npm script - the correct `.env.*` file will be loaded automatically based on `NODE_ENV`.
