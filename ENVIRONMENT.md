# Environment Configuration Guide

## Overview

This project supports multiple environment configurations for different deployment stages.

## Environment Files

- `.env.development` - Local development environment (default)
- `.env.staging` - Staging/pre-production environment
- `.env.production` - Production environment
- `.env.test` - Testing environment
- `.env.example` - Template file (safe to commit)

## Usage

### Running Different Environments

```bash
# Development (default)
npm run start:dev

# Staging
npm run start:staging

# Production (locally)
npm run start:prod:local

# Debug mode
npm run start:debug
```

### Setting Up New Environment

1. Copy `.env.example`:
   ```bash
   cp .env.example .env.development
   ```

2. Update the values in your new environment file

3. Run with the appropriate command

### Environment Variables Loaded

The application loads environment files in this priority order:
1. `.env.{NODE_ENV}` (e.g., `.env.development`)
2. `.env` (fallback)

## Auto-Restart Configuration

The development server automatically restarts when:
- Any `.ts` file changes
- Any `.env` or `.env.*` file changes
- Any `.json` file changes

This is configured via `nodemon.json`.

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit sensitive credentials to git
- Use different credentials for each environment
- Keep `.env.production` and `.env.staging` secure
- The `.env.test` file is gitignored by default

## Cross-Environment Setup

To install `cross-env` for Windows compatibility:
```bash
npm install --save-dev cross-env
```

Then you can use environment-specific commands on any OS.
