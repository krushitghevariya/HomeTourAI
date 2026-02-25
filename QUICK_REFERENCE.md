# HomeTour AI - Quick Reference & Dependency Map
## For Developers - Keep This Handy During Implementation

---

## CRITICAL PATH (What Must Be Done First)

```
START
  ↓
[1] Monorepo Setup + Types
  (Everything depends on this)
  ├─ ✓ Backend structure
  ├─ ✓ Shared types package
  └─ ✓ TypeScript + linting configured
  ↓
[2] Database + Auth
  (All other endpoints depend on user context)
  ├─ ✓ Schema migrations
  ├─ ✓ JWT setup
  └─ ✓ Password hashing
  ↓
[3] Core API Endpoints
  (Frontend needs these to function)
  ├─ ✓ Auth endpoints (signup/login/refresh)
  ├─ ✓ Project CRUD
  ├─ ✓ Media upload
  └─ ✓ Job creation/status
  ↓
[4] Queue System (Redis + BullMQ)
  (Processing depends on this)
  ├─ ✓ Redis connected
  ├─ ✓ BullMQ queue configured
  └─ ✓ Job schema defined
  ↓
[5] Worker & Processors
  (Data flows from API → queue → worker → S3)
  ├─ ✓ Worker consumer setup
  ├─ ✓ Image stitching module
  ├─ ✓ Video to panorama conversion
  └─ ✓ Output uploader
  ↓
[6] State Management (React/React Native)
  (In parallel with [3-5])
  ├─ ✓ Auth store
  ├─ ✓ Project store
  ├─ ✓ Media store
  └─ ✓ Processing store
  ↓
[7] API Client (React/React Native)
  (In parallel with [6])
  ├─ ✓ HTTP client with auth interceptor
  ├─ ✓ Error handler
  └─ ✓ All endpoints implemented
  ↓
[8] Frontend Screen Integration
  (Once [7] is ready)
  ├─ ✓ Auth screens → auth store
  ├─ ✓ Projects screen → project store
  ├─ ✓ Upload screens → media store
  ├─ ✓ Processing screen → polling
  └─ ✓ Output/share screen
  ↓
[9] Testing & QA
[10] Production Deploy
  ↓
END
```

---

## BLOCKING DEPENDENCIES (Don't Skip)

```
┌──────────────────────────────────────────────────────────┐
│ These must be done before dependent step can succeed:   │
└──────────────────────────────────────────────────────────┘

Database Schema       →  Auth Service
              ↓               ↓
          Auth Endpoints  →  Mobile Auth Screens
              ↓               ↓
        Project Endpoints → Project Store
              ↓               ↓
        Media Endpoints   → Media Upload Screens
              ↓               ↓
      Queue System        →  Start Processing
              ↓               ↓
      Worker Process      →  Job Monitoring
              ↓               ↓
      Processing Store    →  Status Polling UI
              ↓
        Output Screens
```

---

## FEATURE INTERDEPENDENCIES

```
Auth
  ├─ Required by: ALL endpoints (via middleware)
  └─ Blocks: Everything else

Projects
  ├─ Required by: Media, Processing, Outputs
  ├─ Depends on: Auth
  └─ Blocks: File upload, job creation

Media/Upload
  ├─ Required by: Processing (media to process)
  ├─ Depends on: Projects, S3 setup
  └─ Blocks: Job creation

Processing Queue
  ├─ Required by: Worker, Status polling
  ├─ Depends on: Media (input files exist)
  └─ Blocks: Worker can't start

Worker/Processing
  ├─ Required by: Outputs (worker creates them)
  ├─ Depends on: Queue, S3
  └─ Blocks: Users can't get results

Outputs/Sharing
  ├─ Depends on: Worker completes job
  └─ Blocks: Nothing (end of flow)
```

---

## IMPLEMENTATION ORDER BY MODULE

### Week 1 Tasks (In Order)

1. **Backend Project Init** (1 day)
   ```bash
   mkdir backend
   npm init -y
   npm install express typescript @types/express @types/node
   npm install ts-node nodemon
   ```
   Outputs: `backend/src/index.ts` with basic Express app

2. **Database Setup** (2 days)
   ```bash
   # In backend/
   npm install typeorm pg
   npm install -D @types/pg
   ```
   Create:
   - `src/database/connection.ts` → PostgreSQL connection
   - `src/entities/*` → 5 ORM entities
   - `src/migrations/*` → SQL migrations
   Run migrations
   Test: `SELECT * FROM users;` returns empty table ✓

3. **Auth Service** (2 days)
   ```bash
   npm install jsonwebtoken bcryptjs
   npm install -D @types/jsonwebtoken
   ```
   Create:
   - `src/services/AuthService.ts` → signup, login, refresh, logout
   - `src/middleware/auth.middleware.ts` → JWT validation
   - `src/controllers/AuthController.ts` → HTTP handlers
   - `src/routes/auth.routes.ts` → Express routes

   Test with Postman:
   - POST /auth/register → { accessToken, refreshToken } ✓
   - POST /auth/login → { accessToken, refreshToken } ✓
   - POST /auth/refresh → { accessToken } ✓

4. **Redis + BullMQ Setup** (1 day)
   ```bash
   npm install bullmq redis
   ```
   Create:
   - `src/queue/index.ts` → Queue initialization
   - `src/queue/processors.ts` → Processor registry

   Test: Can enqueue and dequeue job ✓

---

### Week 2 Tasks (In Order)

5. **API Endpoints - Projects** (1 day)
   ```
   Create: ProjectService, ProjectController, routes
   Endpoints:
   - POST /api/v1/projects → Create
   - GET /api/v1/projects → List (with pagination)
   - GET /api/v1/projects/:id → Detail
   - DELETE /api/v1/projects/:id → Soft delete
   ```
   Test with Postman ✓

6. **S3 Integration** (1 day)
   ```bash
   npm install aws-sdk
   ```
   Create:
   - `src/services/S3Service.ts` → Upload, download, delete
   - `src/config/aws.ts` → AWS SDK config

   Test: Can upload fake file to S3 ✓

7. **API Endpoints - Media Upload** (1.5 days)
   ```
   Create: MediaService, MediaController, routes
   Endpoints:
   - POST /api/v1/projects/:id/upload → Upload (use S3Service)
   - GET /api/v1/projects/:id/media → List files
   - DELETE /api/v1/projects/:id/media/:fileId → Delete
   ```
   Test with real files via Postman (use form-data) ✓

8. **API Endpoints - Processing** (1.5 days)
   ```
   Create: ProcessingService, ProcessingController, routes
   Endpoints:
   - POST /api/v1/projects/:id/generate → Enqueue job
   - GET /api/v1/projects/:id/status → Get job status
   - GET /api/v1/projects/:id/output → Get completed output
   ```
   Test: Can enqueue job, status updates ✓

---

### Week 3 Tasks (Parallel: Backend + Frontend)

**Backend - Worker Setup** (2-3 days)
```bash
mkdir worker
npm init -y
npm install bullmq redis pg
```

Create:
- `src/consumer.ts` → Connect to queue, listen for jobs
- `src/processors/ImageStitcher.ts` → OpenCV wrapper
- `src/processors/PanoramaRenderer.ts` → Three.js + FFmpeg
- Test: Can process a single job ✓

**Frontend - State Management** (2-3 days)
```bash
cd mobile/
npm install zustand
```

Create:
- `src/store/authStore.ts` → Auth state + actions
- `src/store/projectStore.ts` → Projects state + actions
- `src/store/mediaStore.ts` → Media state + actions
- `src/store/processingStore.ts` → Processing state + actions

Test: Store actions work, state updates correctly ✓

---

### Week 4 Tasks

**Frontend - API Client** (1-2 days)
```bash
cd mobile/
npm install axios
```

Create:
- `src/api/client.ts` → Axios instance with interceptors
- `src/api/auth.api.ts` → Auth endpoints
- `src/api/projects.api.ts` → Project endpoints
- `src/api/media.api.ts` → Media endpoints
- `src/api/processing.api.ts` → Processing endpoints

Test: All API calls work, auth token sent in headers ✓

**Frontend - Screen Integration** (2-3 days)
Connect screens to stores and API:
- AuthScreens → authStore + authApi
- ProjectsScreen → projectStore + projectsApi
- UploadScreens → mediaStore + mediaApi
- ProcessingScreen → processingStore (polling)
- OutputScreen → outputs from store

Test: Full flow works end-to-end ✓

---

## ESCAPE HATCH: When Something Blocks You

**If database migration fails**:
```bash
# Reset to clean state
psql -U postgres -c "DROP DATABASE hometour_dev;"
npm run migration:run
```

**If worker can't connect to queue**:
```bash
# Check Redis is running
redis-cli ping
# Should return PONG
```

**If S3 upload fails**:
```bash
# Check AWS credentials
aws s3 ls
# If fails, update ~/.aws/credentials
```

**If API endpoint returns 500**:
```bash
# Check logs
tail -f backend/logs/error.log
# Look for stack trace, fix in code
```

**If frontend can't reach backend**:
```bash
# Check backend is running
curl http://localhost:3000/health
# Check CORS config in backend
```

---

## COMMON MISTAKES TO AVOID

| Mistake | Impact | Prevention |
|---------|--------|-----------|
| Implement features before auth | Auth layer becomes afterthought | Do auth first (Phase 1.3) |
| Define schema loosely | Redesign mid-project | Review with all stakeholders, validate |
| Ignore error handling | Silent failures, data loss | Handle every `.catch()` |
| Assume files always valid | Crashes on edge cases | Validate + log all failures |
| Hardcode AWS/DB credentials | Security breach | Use `.env`, never commit secrets |
| Process large files in API | Timeout, memory crash | Use chunked upload + queue |
| Forget to index database | Queries slow at scale | Index before Phase 3 |
| Skip integration testing | Works locally, fails in prod | Test API + frontend together |
| Over-engineer state management | Maintenance nightmare | Use Zustand (simple), avoid Redux initially |
| Forget HTTPS/CORS on staging | "Works locally but not on phone" | Configure early, test on device |

---

## SIGN-OFF CHECKLIST BY PHASE

**Phase 1 Sign-Off** (before moving to Phase 2):
```
[ ] Monorepo structure working (can import between packages)
[ ] Database schema defined + all tables created
[ ] Auth service working (signup/login/refresh tested)
[ ] Worker can consume jobs from queue
```

**Phase 2 Sign-Off** (before moving to Phase 3):
```
[ ] All 5 API endpoint groups working (tested with Postman)
[ ] Media upload to S3 working
[ ] Job creation working (job persists in DB)
[ ] No console errors, all error paths handled
```

**Phase 3 Sign-Off** (before moving to Phase 4):
```
[ ] Worker processes at least one full job successfully
[ ] Output file created in S3
[ ] Job status updates in DB on completion
```

**Phase 4-5 Sign-Off** (before moving to Phase 6):
```
[ ] All stores created and tested
[ ] API client can call all endpoints
[ ] Auth token refresh works
```

**Phase 6 Sign-Off** (before QA):
```
[ ] Can sign up on mobile
[ ] Can login to mobile
[ ] Can create project on mobile
[ ] Can upload media on mobile
[ ] Can see job processing
[ ] Can download result
```

**Phase 7-8 Sign-Off** (release ready):
```
[ ] 80%+ test coverage (backend)
[ ] Zero sensitive data in logs
[ ] Monitoring alerts configured
[ ] Backup strategy documented
[ ] Disaster recovery tested
```

---

## DAILY STANDUP TEMPLATE

Use this for status updates:

```
Yesterday:
  ✓ Implemented X feature
  ✗ Attempted Y, blocked by Z

Today:
  - [ ] Complete Y (once Z resolved)
  - [ ] Start W

Blockers:
  • None (or brief explanation)
```

---

## USEFUL ONE-LINERS

**Backend**:
```bash
# Reset database
psql -U postgres -c "DROP DATABASE hometour_dev;" && npm run migration:run

# Check migrations
npm run migration:show

# Check database
psql -U postgres -d hometour_dev -c "\dt"

# Test endpoint
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

**Frontend**:
```bash
# Start React Native
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Debug AsyncStorage
adb shell run-as com.hometouraid cat files/...../...
```

**Queue**:
```bash
# Redis CLI
redis-cli

# Check queue depth
> LLEN hometour:queue:processing

# Check job details
> JSON.GET hometour:job:{jobId}
```

---

## RESOURCE REQUIREMENTS

**Development**:
- M1/M2 Mac or equivalent Linux
- 16GB RAM minimum (Docker + IDE + phone emulator)
- SSD with 50GB free space

**Staging**:
- AWS RDS PostgreSQL: db.t3.micro ($41/month)
- Redis: ElastiCache t3.micro ($41/month)
- EC2: t3.small × 2 ($50/month)
- S3 + CloudFront: ~$300/month (dependent on usage)
- **Total: ~$432/month baseline**

**Production**:
- Scale up based on usage
- Budget $2-5K/month initially for 1000 active users

---

**Last Updated**: [Fill in with your current date]
**Team**: [Names of key developers]
**Status**: [In Progress / On Track / At Risk]

---

## Questions? Review These First

1. **"Where do I start?"** → Start with CRITICAL PATH section above
2. **"What's blocking me?"** → Check BLOCKING DEPENDENCIES diagram
3. **"How do I test this?"** → Check USEFUL ONE-LINERS
4. **"I broke something"** → Check ESCAPE HATCH section
5. **"Is this the right approach?"** → Check COMMON MISTAKES to avoid
