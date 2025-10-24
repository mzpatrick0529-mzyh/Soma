# Operations Scripts & Tools

This directory contains operational scripts for deployment, maintenance, and utilities.

## 📁 Structure

```
ops/
├── deploy/          # Deployment and setup scripts
└── scripts/         # Utility and maintenance scripts
```

## 🚀 Deployment Scripts (`deploy/`)

### Setup & Configuration
- **setup-supabase.sh** - Initialize Supabase database with schema and RLS

### Deployment
- **deploy.sh** - Main deployment script
- **auto-deploy.sh** - Automated deployment with CI/CD
- **quick-deploy.sh** - Fast deployment for minor updates

### Runtime Management
- **start-all.sh** - Start all services (frontend + backend)

### Verification
- **verify-deployment.sh** - Local deployment verification
- **verify-deployment-online.sh** - Production deployment verification

## 🔧 Utility Scripts (`scripts/`)

### Data Management
- **clean-large-files.sh** - Remove large files before git commit
- **cleanup-for-github.sh** - Prepare repository for GitHub push

### WeChat Integration
- **decrypt-wechat.sh** - Decrypt WeChat database exports

## 📖 Usage

### Initial Setup
```bash
# 1. Setup database
cd ops/deploy
./setup-supabase.sh

# 2. Start services
./start-all.sh

# 3. Verify deployment
./verify-deployment.sh
```

### Regular Deployment
```bash
cd ops/deploy
./deploy.sh
```

### Quick Updates
```bash
cd ops/deploy
./quick-deploy.sh
```

### Cleanup Before Commit
```bash
cd ops/scripts
./cleanup-for-github.sh
```

## ⚙️ Environment Requirements

### Required Environment Variables
```bash
# Database
STORAGE_BACKEND=pg
SUPABASE_DB_URL=postgresql://...

# AI Provider (choose one)
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key

# Optional
FRONTEND_URL=http://localhost:8080
SELF_AGENT_PORT=8787
```

### System Dependencies
- Node.js 18+
- npm or bun
- PostgreSQL client (for setup-supabase.sh)
- Git

## 🔍 Script Details

### setup-supabase.sh
Initializes the Supabase database:
- Creates tables and indices
- Sets up Row Level Security (RLS) policies
- Installs pgvector extension
- Configures pg_trgm for full-text search

**Usage**:
```bash
./setup-supabase.sh
```

**Requirements**:
- `SUPABASE_DB_URL` environment variable
- PostgreSQL connection access

### deploy.sh
Complete deployment process:
- Builds frontend
- Builds backend
- Runs migrations
- Restarts services

**Usage**:
```bash
./deploy.sh [environment]
```

**Environments**: `dev`, `staging`, `production`

### start-all.sh
Starts both frontend and backend in development mode:
```bash
./start-all.sh
```

Equivalent to:
```bash
npm --prefix Self_AI_Agent run dev &
npm run dev &
```

### verify-deployment.sh
Checks local deployment health:
- Backend API health check
- Frontend accessibility
- Database connectivity
- Environment variable validation

### cleanup-for-github.sh
Prepares repository for version control:
- Removes large files
- Cleans build artifacts
- Removes sensitive data
- Optimizes .gitignore

## 🔒 Security Notes

### Sensitive Data
Never commit:
- `.env` files
- Database files (`.db`, `.db-wal`, etc.)
- Log files
- API keys

### Safe to Commit
- `.env.example` (template only)
- These scripts (no secrets embedded)
- Documentation

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check connection string
echo $SUPABASE_DB_URL

# Test connection manually
psql $SUPABASE_DB_URL -c "SELECT 1"
```

### Script Permission Denied
```bash
# Make scripts executable
chmod +x ops/deploy/*.sh
chmod +x ops/scripts/*.sh
```

### Deployment Fails
```bash
# Check logs
tail -f Self_AI_Agent/backend.log

# Verify environment
./verify-deployment.sh
```

## 📝 Adding New Scripts

When creating new operational scripts:

1. **Place in correct directory**:
   - Deployment → `deploy/`
   - Utilities → `scripts/`

2. **Follow conventions**:
   - Use `.sh` extension for shell scripts
   - Add shebang: `#!/bin/bash`
   - Make executable: `chmod +x script.sh`

3. **Include documentation**:
   - Add usage comments at top of script
   - Update this README
   - Document environment requirements

4. **Error handling**:
   - Exit on error: `set -e`
   - Validate inputs
   - Provide clear error messages

## 🔄 CI/CD Integration

These scripts are designed to work with CI/CD pipelines:

### GitHub Actions Example
```yaml
- name: Deploy to production
  run: |
    cd ops/deploy
    ./deploy.sh production
```

### Vercel Integration
See `vercel.json` in repository root

### Railway Integration
See `railway.toml` in `Self_AI_Agent/`

## 📚 Related Documentation

- [Deployment Guide](../docs/guides/DEPLOYMENT_GUIDE.md)
- [Database Setup](../docs/database/DATABASE_SETUP_README.md)
- [Repository Structure](../docs/STRUCTURE.md)

---

**Maintenance**: Review and update scripts quarterly

**Last Updated**: 2025-10-23
