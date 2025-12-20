# Deployment Guide - Todo App

This guide will help you deploy the Todo App to GitHub, Vercel (Frontend), and Railway (Backend).

## Prerequisites

- GitHub account (https://github.com)
- Vercel account (https://vercel.com) - free tier available
- Railway account (https://railway.app) - free tier available
- Git installed locally
- Node.js and Python installed

---

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web UI (Recommended)

1. Go to https://github.com/new
2. Fill in the form:
   - **Repository name**: `todo-app` (or your preferred name)
   - **Description**: `Full-stack Todo App with FastAPI and Next.js`
   - **Visibility**: Public (required for free Vercel/Railway deployments)
   - **Initialize repository**: Leave unchecked (we'll push existing code)
3. Click "Create repository"
4. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/todo-app.git`)

### Option B: Using GitHub CLI

```bash
gh repo create todo-app --public --source=. --remote=origin --push
```

---

## Step 2: Push Code to GitHub

### Setup git config (if not done)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Add remote and push code

```bash
# Navigate to project root
cd /path/to/project

# Add remote (if not already set)
git remote set-url origin https://github.com/YOUR_USERNAME/todo-app.git

# Stage all changes
git add .

# Commit changes with detailed message
git commit -m "feat: Add debugging, fix Pydantic V2 warnings, and prepare for deployment

- Added comprehensive print()-based debugging to backend routes
- Fixed Pydantic V2 schema_extra deprecation warnings
- Updated schema_extra to json_schema_extra in schemas.py
- Added deployment configurations (vercel.json, railway.json, Procfile)
- Backend: FastAPI with SQLModel + SQLite
- Frontend: Next.js 14 with TypeScript and Tailwind CSS
- Full CRUD operations for tasks with authentication"

# Push to GitHub
git push -u origin master
```

---

## Step 3: Deploy Frontend to Vercel

### Via Vercel Web UI (Easiest)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Paste your GitHub repository URL
5. Vercel will auto-detect it's a Next.js project
6. Click "Import"
7. Configure environment variables:
   - **NEXT_PUBLIC_API_URL**: Backend API URL (e.g., `https://your-backend.railway.app`)
8. Click "Deploy"

### Expected Build Output

```
✓ Built successfully
✓ Installed 185 packages
✓ Compiled successfully
✓ Optimized images
✓ Deployment ready
```

### Vercel Frontend URL Format
After deployment: `https://your-project-name.vercel.app`

---

## Step 4: Deploy Backend to Railway

### Via Railway Web UI

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Click "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select your `todo-app` repository
6. Select the `backend` directory as root (or leave empty if root has Procfile)
7. Railway will detect Python project and use `requirements.txt`
8. Configure environment variables:
   - Copy all from `backend/.env.local`:
     ```
     DATABASE_URL=postgresql://user:pass@host/dbname
     SECRET_KEY=your-secret-key-in-production
     CORS_ORIGINS=https://your-vercel-app.vercel.app
     DEBUG=false
     ENVIRONMENT=production
     ```
9. Click "Deploy"

### Expected Build Output

```
✓ Installing dependencies
✓ Building application
✓ Running uvicorn server
✓ Application listening on 0.0.0.0:8000
```

### Railway Backend URL Format
After deployment: `https://your-backend-service.railway.app`

---

## Step 5: Connect Frontend to Backend

Once both are deployed:

1. Go to your Vercel project settings
2. Add environment variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-service.railway.app`
3. Redeploy frontend for changes to take effect

---

## Verification Checklist

- [ ] GitHub repository created and code pushed
- [ ] Vercel frontend deployed and accessible
- [ ] Railway backend deployed and accessible
- [ ] Backend health check: `https://your-backend.railway.app/health` returns `{"status":"healthy"}`
- [ ] Frontend can communicate with backend
- [ ] Create task endpoint works: `POST /api/tasks`
- [ ] User registration works: `POST /api/auth/register`

---

## Troubleshooting

### Vercel Deployment Issues

**Issue**: Build fails with "next not found"
- **Solution**: Ensure `next` is in `frontend/package.json` dependencies

**Issue**: 404 on API calls
- **Solution**: Check `NEXT_PUBLIC_API_URL` environment variable is set correctly

### Railway Deployment Issues

**Issue**: Application crashes on startup
- **Solution**: Check logs: `railway logs --service=your-service`
- Verify `DATABASE_URL` is set correctly

**Issue**: Port binding error
- **Solution**: Railway automatically assigns PORT, ensure code uses `$PORT` environment variable
- Check `Procfile`: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Issue**: ModuleNotFoundError
- **Solution**: Verify `backend/requirements.txt` includes all dependencies

---

## Production Configuration

### Environment Variables Needed

**Backend (Railway)**
```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
SECRET_KEY=generate-with: python -c "import secrets; print(secrets.token_urlsafe(32))"
CORS_ORIGINS=https://your-frontend.vercel.app
DEBUG=false
ENVIRONMENT=production
BACKEND_PORT=8000
```

**Frontend (Vercel)**
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## Local Testing Before Deployment

### Test Backend Locally

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Check health:
```bash
curl http://localhost:8000/health
```

### Test Frontend Locally

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

---

## Useful Links

- **GitHub**: https://github.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Next.js Docs**: https://nextjs.org/docs

---

## Support & Documentation

- Railway Documentation: https://docs.railway.app
- Vercel Documentation: https://vercel.com/docs
- FastAPI with Railway: https://docs.railway.app/databases/postgres
- Next.js Deployment: https://nextjs.org/learn/basics/deploying-nextjs-app

---

**Last Updated**: December 20, 2024
**Project Version**: 1.0.0
