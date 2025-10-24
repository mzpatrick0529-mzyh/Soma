# Guides & Tutorials

This folder contains user guides, deployment instructions, and integration tutorials for Soma.

## 📚 Contents

### Getting Started
- **[START_HERE.md](./START_HERE.md)** - First steps for new developers
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Quick deployment guide

### Deployment
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist

### Integration Guides
- **[APPLE_ICLOUD_SYNC_RESEARCH.md](./APPLE_ICLOUD_SYNC_RESEARCH.md)** - iCloud integration research
- **[REALTIME_SYNC_RESEARCH.md](./REALTIME_SYNC_RESEARCH.md)** - Real-time sync implementation
- **[DEDUPLICATION_AND_SYNC_GUIDE.md](./DEDUPLICATION_AND_SYNC_GUIDE.md)** - Data deduplication strategies

## 🚀 Quick Links

### For New Developers
1. Start with [START_HERE.md](./START_HERE.md)
2. Review repository structure: [`../STRUCTURE.md`](../STRUCTURE.md)
3. Set up development environment (see deployment guides)

### For DevOps
1. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full deployment process
2. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-flight checks
3. Database setup: [`../database/`](../database/)

### For Product Teams
1. Integration capabilities (see integration guides)
2. Feature documentation (check archive for implementation reports)

## 🎯 Common Tasks

### Local Development Setup
```bash
# Backend
cd Self_AI_Agent
npm install
npm run dev

# Frontend
npm install
npm run dev
```

### Environment Configuration
Key environment variables:
- `STORAGE_BACKEND=pg` - Use PostgreSQL
- `SUPABASE_DB_URL` - Database connection
- `GEMINI_API_KEY` - AI provider key

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete list.

### Testing Deployment
```bash
# Health check
curl http://127.0.0.1:8787/api/self-agent/health

# Frontend
open http://127.0.0.1:8080
```

## 📖 Integration Guides

### iCloud Sync
See [APPLE_ICLOUD_SYNC_RESEARCH.md](./APPLE_ICLOUD_SYNC_RESEARCH.md) for:
- iCloud API integration
- Mail/Calendar/Contacts sync
- Authentication flow

### Real-time Sync
See [REALTIME_SYNC_RESEARCH.md](./REALTIME_SYNC_RESEARCH.md) for:
- WebSocket implementation
- Supabase Realtime features
- Conflict resolution

### Data Deduplication
See [DEDUPLICATION_AND_SYNC_GUIDE.md](./DEDUPLICATION_AND_SYNC_GUIDE.md) for:
- Content-based deduplication
- Hash-based detection
- Media file handling

## 🔧 Troubleshooting

### Backend Won't Start
1. Check environment variables
2. Verify database connection: `/api/self-agent/health`
3. Review logs in `Self_AI_Agent/` directory

### Frontend Build Errors
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Check TypeScript errors: `npm run build`
3. Verify Vite proxy configuration

### Database Connection Issues
1. Verify `SUPABASE_DB_URL` format
2. Check network connectivity to Supabase
3. Review RLS policies (see database docs)

## 📝 Contributing to Documentation

When adding new guides:
1. Use clear, descriptive titles
2. Include code examples
3. Add troubleshooting sections
4. Update this README
5. Cross-reference related docs

## 🆘 Need Help?

- **General Questions**: See [START_HERE.md](./START_HERE.md)
- **Deployment Issues**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Database Problems**: [`../database/`](../database/)
- **Legal Compliance**: [`../legal/`](../legal/)

---

**Last Updated**: 2025-10-23
