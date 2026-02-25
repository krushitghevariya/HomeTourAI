# HomeTour AI - Implementation Roadmap
## V1 Development Phase - Controlled Execution Plan

---

## EXECUTIVE SUMMARY

This roadmap provides a step-by-step implementation sequence optimized for controlled execution and minimal rework. The approach prioritizes **foundational infrastructure** before **feature development**, ensuring each layer has stable dependencies.

**Key Principle**: Build horizontally within each phase before moving to the next. Avoid feature sprawl.

---

## PHASE 1: PROJECT FOUNDATION & INFRASTRUCTURE (Week 1-2)

### 1.1 Repository & Monorepo Setup
**Dependency**: None (First task)
**Outputs**: Project structure ready for backend + frontend

```
HomeTourAI/
├── backend/                 (Node.js + Express/NestJS)
│   ├── src/
│   │   ├── config/         (Database, Redis, AWS config)
│   │   ├── database/       (Migrations, schemas)
│   │   ├── modules/        (Feature modules)
│   │   ├── queue/          (BullMQ setup)
│   │   └── workers/        (Processing workers)
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── worker/                  (Separate process for AI/media processing)
│   ├── src/
│   │   ├── processors/     (FFmpeg, OpenCV, image stitching)
│   │   ├── queue/          (Job consumer)
│   │   └── services/       (Processing logic)
│   ├── package.json
│   └── .env.example
│
└── mobile/                  (React Native - existing)
    └── src/
        ├── api/            (API client - NEW)
        ├── store/          (State management - NEW)
        └── [existing structure]
```

**Tasks**:
- [ ] Initialize backend Node.js project (Express or NestJS)
- [ ] Initialize worker project
- [ ] Set up monorepo orchestration (Yarn workspaces or npm workspaces)
- [ ] Create shared types package for frontend/backend
- [ ] Configure TypeScript, ESLint, Prettier in all packages
- [ ] Set up Git workflow (branches, commit conventions)

**Risk**: If monorepo setup is wrong, all future integration fails
**Mitigation**: Test shared types import between backend and mobile before proceeding

---

### 1.2 Database Setup & Schema
**Dependency**: 1.1 (Monorepo structure)
**Outputs**: PostgreSQL with all tables, indexes, migrations

**Database Diagram**:
```
users (1) ──────────→ (∞) projects
  └─ id (uuid, pk)        ├─ user_id (fk)
  └─ email                └─ status, property_type, ...
  └─ password_hash
  └─ plan_type            ↓
  └─ is_active     (∞) media_files
  └─ created_at          ├─ project_id (fk)
  └─ updated_at          └─ file_type, file_url, ...

                         (∞) processing_jobs
                         ├─ project_id (fk)
                         ├─ job_type, status
                         └─ progress_percentage

                         (∞) outputs
                         ├─ project_id (fk)
                         └─ public_share_token (unique)
```

**Database Table Schema**:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User accounts & auth | id, email, password_hash, plan_type, is_active |
| `projects` | Project metadata | id, user_id, name, property_type, status, created_at |
| `media_files` | Uploaded media tracking | id, project_id, file_type, file_url, file_size, resolution |
| `processing_jobs` | Job queue tracking | id, project_id, job_type, status, progress_percentage, error_message |
| `outputs` | Generated results | id, project_id, output_type, file_url, public_share_token |

**Indexes** (Critical for performance):
```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_project_id ON processing_jobs(project_id);
CREATE INDEX idx_outputs_public_share_token ON outputs(public_share_token);
CREATE INDEX idx_media_files_project_id ON media_files(project_id);
```

**Tasks**:
- [ ] Set up PostgreSQL connection (local dev + RDS for staging)
- [ ] Create migration framework (e.g., Typeorm, Knex, or Raw SQL)
- [ ] Write all 5 table migrations
- [ ] Create indexes
- [ ] Seed test data (1 test user, 2-3 test projects)
- [ ] Validate schema with backend code generation (if using ORM)

**Risk**: Schema redesign after implementation = massive rework
**Mitigation**: Validate schema against all API endpoints before proceeding

---

### 1.3 Authentication Layer
**Dependency**: 1.2 (Database exists)
**Outputs**: JWT tokens, refresh tokens, secure password storage

**Flow**:
```
User Input (email/password)
        ↓
Validate input (email format, password strength)
        ↓
Hash password (bcrypt/argon2)
        ↓
Store in users table
        ↓
Generate JWT access token (15 min expiry)
        ↓
Generate refresh token (7 day expiry, stored in DB)
        ↓
Return tokens to client
```

**Authentication State Machine**:
```
[Unauthenticated]
    ↓ (signup/login)
[Authenticated + Tokens Valid]
    ↓ (access token expires)
[Refresh Attempt]
    ├→ [Success] → [Authenticated + New Tokens]
    └→ [Fail] → [Unauthenticated + Logout]
```

**Tasks**:
- [ ] Install JWT library (jsonwebtoken)
- [ ] Install password hashing library (bcryptjs or argon2)
- [ ] Create `AuthService` with signup, login, refresh, logout methods
- [ ] Create `JwtMiddleware` to validate tokens on protected routes
- [ ] Create `auth/register` endpoint (validate email, hash password, create user)
- [ ] Create `auth/login` endpoint (find user, compare password, issue tokens)
- [ ] Create `auth/refresh` endpoint (validate refresh token, issue new access token)
- [ ] Create `auth/logout` endpoint (invalidate refresh token in DB)
- [ ] Add rate limiting to auth endpoints (prevent brute force)
- [ ] Test with Postman/Curl before moving to mobile integration

**Security Checklist**:
- [ ] Passwords hashed with strong algorithm
- [ ] Rate limiting on login (e.g., max 5 attempts per 15 min)
- [ ] Tokens sent over HTTPS only
- [ ] Refresh tokens stored securely in DB (not in memory)
- [ ] Input validation on email/password

**Risk**: Weak auth = user data compromise
**Mitigation**: Use established libraries, avoid custom crypto, test edge cases

---

## PHASE 2: CORE API ENDPOINTS (Week 2-3)

### 2.1 Project Management Endpoints
**Dependency**: 2.0 (Authentication layer)
**Outputs**: CRUD endpoints for projects

**Endpoints**:
```
POST   /api/v1/projects                 (Create new project)
GET    /api/v1/projects                 (List all projects for user)
GET    /api/v1/projects/:id             (Get single project)
DELETE /api/v1/projects/:id             (Delete project)
PATCH  /api/v1/projects/:id             (Update project metadata)
```

**Project Lifecycle State Machine**:
```
[Draft] → [Processing] → [Completed]
           ↓
        [Failed] (with error message)
```

**Data Flow - Create Project**:
```
Frontend
  ↓ POST /projects { name, propertyType }
Backend (Authenticated)
  ├─ Validate user exists
  ├─ Validate propertyType ∈ [apartment, villa, office, other]
  ├─ Create project with status=draft
  ├─ Store in projects table
  └─ Return { projectId, status, createdAt }
  ↓
Frontend (Stores projectId for subsequent uploads)
```

**Tasks**:
- [ ] Create `ProjectService` with CRUD methods
- [ ] Create `ProjectController` with endpoints
- [ ] Implement user ownership validation (only user's projects)
- [ ] Implement soft deletes (set is_deleted flag, don't remove)
- [ ] Add pagination to list endpoint (limit 20, offset)
- [ ] Add sorting options (createdAt, updatedAt)
- [ ] Validate property_type enum
- [ ] Test all endpoints with sample data

**Risk**: Missing user ownership check = data leakage
**Mitigation**: Add middleware to verify request.userId matches project.user_id

---

### 2.2 Media Upload Endpoints
**Dependency**: 2.1 (Projects exist)
**Outputs**: File upload handling, metadata storage

**Upload Types**:
- **Photos**: JPEG, PNG (max 10MB each, max 50 photos per project)
- **Videos**: MP4 (max 500MB, max 1 video per project)

**Endpoints**:
```
POST   /api/v1/projects/:id/upload       (Upload single file)
GET    /api/v1/projects/:id/media        (List media for project)
DELETE /api/v1/projects/:id/media/:fileId (Delete media file)
```

**Upload Data Flow**:
```
Frontend (Client-side validation)
  ├─ Validate file type (JPEG/PNG/MP4)
  ├─ Validate file size
  └─ Validate resolution >= 1280x720
    ↓
  POST /projects/:id/upload { file, metadata }
    ↓
Backend
  ├─ Validate project exists & owned by user
  ├─ Re-validate file (type, size, virus scan)
  ├─ Generate unique S3 key
  ├─ Upload to S3 (object storage)
  ├─ Extract metadata (resolution, duration, filesize)
  ├─ Store media_files record
  └─ Return { fileId, uploadedAt, previewUrl }
    ↓
Frontend (Display in upload UI)
```

**S3 Key Structure** (prevents conflicts):
```
uploads/
├── users/{userId}/
│   └── projects/{projectId}/
│       ├── photos/
│       │   ├── {fileId}-1.jpg
│       │   ├── {fileId}-2.jpg
│       │   └── ...
│       └── video/
│           └── {fileId}.mp4
```

**Tasks**:
- [ ] Set up AWS S3 bucket with proper CORS/ACLs
- [ ] Create S3 upload service (AWS SDK)
- [ ] Create file validation middleware
- [ ] Implement chunked upload for large files (>100MB)
- [ ] Create `MediaService` to handle metadata extraction
- [ ] Create upload endpoints
- [ ] Implement upload progress tracking (store temp progress in Redis)
- [ ] Handle upload failures + retry logic
- [ ] Test with real files (photos + video)

**Validation Rules**:
```
Photos:  JPEG/PNG, ≤10MB, ≥1280x720px
Video:   MP4, ≤500MB, ≥720p, ≥24fps
Per Project: Max 50 photos OR 1 video
```

**Risk**: Large file uploads timeout or fail silently
**Mitigation**: Implement chunked upload with progress tracking, store partial uploads

---

### 2.3 Processing Job Endpoints
**Dependency**: 2.2 (Media exists for processing)
**Outputs**: Job tracking, status polling

**Endpoints**:
```
POST   /api/v1/projects/:id/generate     (Enqueue processing job)
GET    /api/v1/projects/:id/status       (Poll job status)
GET    /api/v1/projects/:id/output       (Fetch completed output)
```

**Job Processing Flow**:
```
User clicks "Generate"
    ↓
Validate media exists & is valid
    ↓
Create processing_jobs record { status=queued }
    ↓
Push job to Redis queue (BullMQ)
    ↓
Return jobId to Frontend
    ↓
Frontend polls /status every 5 seconds
    ├─ queued     → show spinner "Waiting..."
    ├─ running    → show progress bar + current stage
    ├─ completed  → show preview + export options
    └─ failed     → show error message + retry option
    ↓
Worker picks up job from queue
    ├─ Update status to running
    ├─ Process media (see Phase 3)
    ├─ Store output to S3
    ├─ Create outputs record
    └─ Update job status to completed
```

**Job State Machine**:
```
[queued] → [running] → [completed]
             ↓
          [failed] (with error_message)
```

**Tasks**:
- [ ] Create `ProcessingService` to enqueue jobs
- [ ] Create Redis/BullMQ queue setup
- [ ] Create job endpoints (generate, status, get output)
- [ ] Store job progress in Redis (for real-time updates)
- [ ] Implement exponential backoff retry (max 2 attempts)
- [ ] Implement 30-minute timeout per job
- [ ] Add webhook to update job status in DB when worker completes
- [ ] Test queue with mock worker

**Risk**: Lost jobs if server crashes mid-processing
**Mitigation**: Store job state in DB + Redis, implement job recovery on startup

---

## PHASE 3: MEDIA PROCESSING WORKER (Week 3-4)

### 3.1 Worker Setup
**Dependency**: 2.3 (Queue infrastructure)
**Outputs**: Standalone worker service consuming Redis queue

**Worker Architecture**:
```
Worker Process (Separate Node.js)
    ↓
Pull job from BullMQ queue
    ↓
Download media from S3
    ↓
Process based on job_type
    ├─ 360_generation: Image stitching + panorama sim
    └─ ar_render: Surface detection + furniture placement
    ↓
Upload output to S3
    ↓
Update job status in DB
    ↓
Return to queue for next job
```

**Tasks**:
- [ ] Set up worker Node.js project
- [ ] Connect to same PostgreSQL and Redis as backend
- [ ] Create BullMQ consumer
- [ ] Implement job error handling + logging
- [ ] Add Prometheus metrics (job duration, success rate)
- [ ] Implement graceful shutdown (finish current job before stopping)
- [ ] Test worker with mock S3 files

---

### 3.2 Image Stitching Processor
**Dependency**: 3.1 (Worker setup)
**Outputs**: Stitched panorama images from photo set

**Technology**: OpenCV (Python subprocess) or node-gyp binding

**Process**:
```
Input: Array of photos from single room
    ↓
1. Feature Detection (SIFT/SURF)
2. Feature Matching
3. Homography Calculation
4. Blend & Stitch
    ↓
Output: Single panoramic image
```

**Tasks**:
- [ ] Install OpenCV dependencies
- [ ] Create image stitching module (use established library, e.g., Hugin)
- [ ] Implement quality validation (reject if stitching fails)
- [ ] Store intermediate stitched images in S3
- [ ] Log failures to centralized logging (CloudWatch or ELK)

**Risk**: Stitching failures with bad photo angles
**Mitigation**: Validate photo count (min 3-5), detect blank/blurry images, return clear error

---

### 3.3 Panorama Simulation Processor
**Dependency**: 3.2 (Stitched images ready)
**Outputs**: Simulated 360° video from panorama images

**Technology**: FFmpeg + custom panorama renderer

**Process**:
```
Input: Panoramic image + pan movement data
    ↓
1. Create virtual camera path (slow pan/zoom)
2. Render frames along path using panorama as texture
3. Stabilize output video
4. Apply brightness correction
5. Encode to MP4 (H.264, VP9)
    ↓
Output: MP4 video file (60 frames, ~4-6 seconds)
```

**Tasks**:
- [ ] Install FFmpeg
- [ ] Create panorama rendering module (Three.js or custom WebGL)
- [ ] Implement camera path generation (slow pan left-to-right)
- [ ] Implement video stabilization filter
- [ ] Implement brightness/contrast correction
- [ ] Encode to multiple formats (MP4/H.264, WebM/VP9)
- [ ] Validate output video is playable

**Risk**: Video encoding fails or output is corrupted
**Mitigation**: Validate output file with ffprobe before marking job complete

---

### 3.4 Video Stabilization Processor
**Dependency**: 3.1 (Worker setup)
**Outputs**: Stabilized video from shaky input footage

**Technology**: FFmpeg with vidstab filter

**Process**:
```
Input: Raw video from mobile camera
    ↓
1. Analyze motion vectors
2. Calculate optimal stabilization parameters
3. Apply compensating transforms
    ↓
Output: Stabilized video
```

**Tasks**:
- [ ] Create video stabilization service using FFmpeg
- [ ] Implement two-pass stabilization (analysis + correction)
- [ ] Preserve video quality (bitrate ≥4Mbps)

---

### 3.5 AR Surface Detection Processor
**Dependency**: 3.1 (Worker setup)
**Outputs**: Detectted floor/wall surfaces for AR placement

**Technology**: ML-based depth estimation (ML5.js, TensorFlow.js, or custom model)

**Process**:
```
Input: Room photo
    ↓
1. Estimate depth map
2. Segment surfaces (floor, walls, ceiling)
3. Identify feature points
    ↓
Output: Surface metadata { floor: [[x,y,z],...], walls: [...] }
```

**Tasks**:
- [ ] Integrate depth estimation model (MiDaS or ArKit output)
- [ ] Create surface segmentation logic
- [ ] Validate detectedsurfaces (floor must be horizontal)

---

## PHASE 4: STATE MANAGEMENT (Week 2, parallel with Phase 2)

### 4.1 Choose State Management Solution
**Options**:
1. **Redux** - Mature, verbose, good DevTools
2. **Zustand** - Lightweight, simpler API, good for this size
3. **React Query** - Server-state focused, good for API caching
4. **MobX** - Reactive, less boilerplate

**Recommendation**: Zustand for this project (simple, minimal boilerplate, React Native compatible)

### 4.2 Zustand Store Architecture
**Dependency**: 1.1 (Monorepo types)

**Store Structure**:

```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

// store/projectStore.ts
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (name, propertyType) => Promise<Project>;
  selectProject: (id: string) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  deleteProject: (id: string) => Promise<void>;
}

// store/mediaStore.ts
interface MediaState {
  mediaList: MediaFile[];
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;

  // Actions
  uploadMedia: (projectId, files) => Promise<void>;
  removeMedia: (fileId: string) => Promise<void>;
  setUploadProgress: (progress: number) => void;
}

// store/processingStore.ts
interface ProcessingState {
  currentJob: ProcessingJob | null;
  jobHistory: ProcessingJob[];
  isProcessing: boolean;
  progress: number;

  // Actions
  startProcessing: (projectId, mode) => Promise<void>;
  pollJobStatus: (jobId: string) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
}
```

**Task**:
- [ ] Create Zustand stores for auth, projects, media, processing
- [ ] Add persistence (AsyncStorage) for auth tokens
- [ ] Implement error handling in all stores
- [ ] Test stores with mock API responses

---

## PHASE 5: API CLIENT & INTEGRATION (Week 3, parallel with Phase 2-3)

### 5.1 API Client Setup
**Dependency**: 4.2 (Store design), 2.1+ (Backend endpoints)

**API Client Architecture**:

```typescript
// api/client.ts
class ApiClient {
  private baseURL = 'https://api.hometour.ai/api/v1';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) { ... }

  async request(method, endpoint, data?) {
    // Add auth header
    // Handle 401 (refresh token)
    // Retry logic
    // Error formatting
  }

  // Auth API
  async register(email, password) { ... }
  async login(email, password) { ... }
  async refresh() { ... }

  // Project API
  async listProjects() { ... }
  async createProject(name, propertyType) { ... }
  async getProject(id) { ... }

  // Media API
  async uploadMedia(projectId, file) { ... }
  async listMedia(projectId) { ... }

  // Processing API
  async generateTour(projectId, mode) { ... }
  async checkJobStatus(projectId) { ... }

  // Output API
  async getOutput(projectId) { ... }
}
```

**Tasks**:
- [ ] Create axios or fetch-based client with interceptors
- [ ] Implement automatic token refresh on 401
- [ ] Implement exponential backoff for retries
- [ ] Add request logging for debugging
- [ ] Add error formatting (API errors → store errors)
- [ ] Test all endpoints against running backend

---

## PHASE 6: FRONTEND INTEGRATION (Week 4-5)

### 6.1 Authentication Screens Integration
**Dependency**: 5.1 (API client), 4.2 (Auth store)

**Screens to Connect**:
1. `SplashScreen` - Check token validity on startup
2. `SignUpScreen` - Form → store.signup() → navigate to Dashboard
3. `LoginScreen` - Form → store.login() → navigate to Dashboard

**Tasks**:
- [ ] Implement sign-up screen logic (validate email/password locally)
- [ ] Implement login screen logic
- [ ] Add loading states + error display
- [ ] Implement token persistence (AsyncStorage)
- [ ] Add auto-refresh token logic
- [ ] Test full auth flow

---

### 6.2 Dashboard Integration
**Dependency**: 6.1 (Auth works)

**Dashboard Flow**:
```
Dashboard loads
    ↓
store.fetchProjects()
    ↓
display list of projects
    ↓
User taps project → navigate to ProjectDetailScreen
    User taps "+ New Project" → navigate to NewProjectSetupScreen
```

**Tasks**:
- [ ] Wire list to store.projects
- [ ] Implement pull-to-refresh
- [ ] Implement infinite scroll (pagination)
- [ ] Add project status badges
- [ ] Add delete project action
- [ ] Test with multiple projects

---

### 6.3 New Project Setup Integration
**Dependency**: 6.2 (Dashboard)

**Flow**:
```
NewProjectSetupScreen
    ↓
Input project name + property type
    ↓
Click create
    ↓
store.createProject()
    ↓
Navigate to upload mode selection
```

**Tasks**:
- [ ] Wire form to store.createProject()
- [ ] Show loading state during creation
- [ ] Handle errors (network, duplicate name)
- [ ] Navigate to next screen on success

---

### 6.4 Media Upload Integration
**Dependency**: 6.3 (Project exists)

**Screens**: `UploadPhotosScreen`, `UploadVideoScreen`

**Flow**:
```
User selects photos/video
    ↓
store.uploadMedia(projectId, files)
    ↓
Show progress bar
    ↓
On success → navigate to ProcessingScreen
```

**Tasks**:
- [ ] Implement photo picker integration (ImagePicker library)
- [ ] Implement video picker integration
- [ ] Show upload progress (byte-by-byte)
- [ ] Handle network interruption + resume
- [ ] Validate file before upload (client-side)
- [ ] Show preview thumbnails
- [ ] Allow multi-file selection

**Risk**: High bandwidth usage if not optimized
**Mitigation**: Compress images/video before upload, show warnings for large files

---

### 6.5 Processing & Status Polling Integration
**Dependency**: 6.4 (Upload complete)

**Screen**: `ProcessingScreen`

**Flow**:
```
Processing started
    ↓
store.startProcessing(projectId)
    ↓
Show spinner + progress percentage
    ↓
Poll store.jobStatus every 5 seconds
    ├─ queued → show "Waiting in queue..."
    ├─ running → show "Processing (45%)"
    ├─ completed → show preview + export options
    └─ failed → show error + retry button
```

**Tasks**:
- [ ] Implement polling logic (use setInterval, remember to cleanup)
- [ ] Show job stages (uploaded → stitching → panorama sim → stabilization)
- [ ] Implement cancel job action
- [ ] Display error messages clearly
- [ ] Handle timeout (job takes >30 min)
- [ ] Test with different job durations (fast, slow, failed)

---

### 6.6 Output & Share Integration
**Dependency**: 6.5 (Processing complete)

**Screen**: `ExportShareScreen`

**Flow**:
```
Processing complete (output available)
    ↓
Show output preview (WebGL viewer)
    ↓
Export options:
    ├─ Download MP4
    ├─ Share link (opens public viewer)
    └─ Share to social (optional)
```

**Tasks**:
- [ ] Integrate 360 WebGL viewer (Three.js panorama)
- [ ] Implement download to device camera roll
- [ ] Generate shareable link
- [ ] Add share to social media (Intent on Android, Share sheet on iOS)
- [ ] Display public viewer preview

---

## PHASE 7: TESTING & HARDENING (Week 5-6)

### 7.1 Backend Testing
- [ ] Unit tests for all services (50%+ coverage)
- [ ] Integration tests for API endpoints
- [ ] Database transaction tests
- [ ] Auth edge cases (expired token, invalid refresh, etc.)
- [ ] File upload edge cases (corrupted file, too large, etc.)
- [ ] Error handling validation

### 7.2 Frontend Testing
- [ ] Component unit tests (screens, molecules)
- [ ] Integration tests (flows: auth → project → upload → process)
- [ ] Store tests (state mutations, async actions)
- [ ] API client error handling

### 7.3 End-to-End Testing
- [ ] Full user flow: signup → create project → upload → process → share
- [ ] Failure scenarios: network loss, processing failure, file corruption
- [ ] Load testing: multiple concurrent uploads, processing queue

---

## PHASE 8: PRODUCTION DEPLOYMENT (Week 6-7)

### 8.1 Infrastructure
- [ ] AWS RDS PostgreSQL setup
- [ ] AWS S3 bucket + CloudFront CDN
- [ ] Redis (ElastiCache)
- [ ] EC2 instances for backend + worker
- [ ] Load balancer + auto-scaling
- [ ] Monitoring (CloudWatch, DataDog)
- [ ] Logging (ELK or CloudWatch Logs)

### 8.2 Security
- [ ] HTTPS (TLS 1.3)
- [ ] CORS configuration
- [ ] Rate limit all endpoints
- [ ] Input validation/sanitization
- [ ] SQL injection prevention (use ORM)
- [ ] XSS prevention
- [ ] Environment secrets management (.env)
- [ ] API key for third-party services

### 8.3 Mobile Deployment
- [ ] iOS build (Xcode)
- [ ] Android build (Android Studio)
- [ ] App signing certificates
- [ ] TestFlight + Google Play Console setup
- [ ] Feature flags for rollout

---

## DATA FLOW MAPPING

### Complete User Journey Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SIGN UP / LOGIN                     │
├─────────────────────────────────────────────────────────────┤
Mobile                          Backend                   Database
  │                               │                           │
  ├──────register (email/pwd)─────→│                           │
  │                               ├──validate────────────────→│
  │                               │←──user_id────────────────┤
  │                               ├──hash password────────────│
  │                               ├──create user─────────────→│
  │←─────JWT tokens───────────────┤                           │
  │(store in AsyncStorage)        │                           │
  │                               │                           │
  └─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               CREATE PROJECT & UPLOAD MEDIA                 │
├─────────────────────────────────────────────────────────────┤
Mobile                  Backend                S3        Database
  │                        │                   │           │
  ├─create project────────→│                   │           │
  │                        ├──validate user────────────────→│
  │                        ├──create project──────────────→│
  │←──projectId───────────┤                   │           │
  │                       │                   │           │
  ├─upload photos────────→│ (validate)       │           │
  │                       ├──S3 presigned URL→           │
  │←──presigned URL───────┤                   │           │
  │                       │                   │           │
  ├─upload to S3─────────────────────────────→│           │
  │←────S3 ACK────────────────────────────────┤           │
  │                       │←──notification──┤           │
  │                       ├──extract metadata──────────→│
  │←──upload complete────┤                   │           │
  │                       │                   │           │
  └─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              PROCESS (ENQUEUE JOB)                          │
├─────────────────────────────────────────────────────────────┤
Mobile                  Backend              Redis       Database
  │                        │                   │           │
  ├─generate tour─────────→│                   │           │
  │                        ├──validate media──────────────→│
  │                        ├──create job──────────────────→│
  │                        ├──enqueue job──────────────────→│
  │←──jobId────────────────┤                   │           │
  │                        │                   │           │
  └─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         POLL STATUS (Frontend)                              │
├─────────────────────────────────────────────────────────────┤
Mobile                  Backend              Database   Worker
  │                        │                   │           │
  ├─every 5s: GET status──→│                   │           │
  │                        ├──query job status────────────→│
  │                        │←──status, progress──────────┤
  │←──{status, progress}──┤                   │           │
  │                        │                   │           │
  │[While job running...]  │                   │           │
  │                        │                        │←──dequeue job
  │                        │                        │
  │                        │                        ├─process media
  │                        │                        │
  │                        │                        ├─store output→S3
  │                        │                        │
  │                        │ ←──webhook────────────│
  │                        ├──update job status───────────→│
  │                        │                        │
  │[Eventually...]         │                        │
  ├─GET status────────────→│                        │
  │←──{status: completed}─┤                        │
  │                        │                        │
  └─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              EXPORT & SHARE                                 │
├─────────────────────────────────────────────────────────────┤
Mobile                  Backend              S3         Database
  │                        │                   │           │
  ├─get output────────────→│                   │           │
  │                        ├──query output────────────────→│
  │                        │←──file_url───────────────────┤
  │←──{output_url}────────┤                   │           │
  │                        │                   │           │
  ├─download MP4──────────────────────────────→│           │
  │←──file───────────────────────────────────┤           │
  │(saved to camera roll)                     │           │
  │                        │                   │           │
  ├─generate share link───→│                   │           │
  │                        ├──create token─────────────────→│
  │←──share_url────────────┤                   │           │
  │                        │                   │           │
  └─────────────────────────────────────────────────────────────┘
```

---

##RISK AREAS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **File upload timeout** | Users can't upload media | Implement chunked upload, retry logic, show clear progress |
| **Processing job fails silently** | Lost data, confused users | Log all failures, implement email alerts, show error UI |
| **Database schema redesign** | Weeks of rework | Validate schema with all endpoints before Phase 3 |
| **Job queue lost on crash** | Processing jobs evaporate | Persist job state in DB, implement job recovery on startup |
| **AI processing takes too long** | Processing never completes | Set 30-min timeout, implement parallel processing, use GPU |
| **S3 quota exceeded** | Service breaks | Monitor storage usage, delete old outputs, implement cleanup |
| **Auth token leakage** | User accounts compromised | Use HTTPS only, HTTP-only secure cookies on web, keychain on mobile |
| **Concurrency issues (multiple users)** | Race conditions in job queue | Use Redis transactions, database row locks, validate state before updates |
| **Network instability at user end** | Upload interrupted | Implement resume capability, store partial uploads, client-side retry |
| **Load spike (many concurrent jobs)** | Worker overwhelmed | Implement job queue backpressure, rate limit per user, horizontal scaling |

---

## DEPENDENCY ORDER (Critical Path)

```
Phase 1: Foundation
├─ 1.1 Monorepo Setup ─────────┐
├─ 1.2 Database Schema         ├──→ Phase 2: APIs
├─ 1.3 Authentication ────┬────┤
                          │
Phase 2: Core APIs        │
├─ 2.1 Projects ◄─────────┘
├─ 2.2 Media Upload
└─ 2.3 Processing Queue ──┬───→ Phase 3: Worker
                          │
Phase 3: Worker           │
├─ 3.1 Setup ◄────────────┘
├─ 3.2-3.5 Processors

Phase 4: State Mgmt (parallel with Phase 2)
├─ 4.1 Choose Solution
└─ 4.2 Zustand Stores

Phase 5: API Client (parallel with Phase 2-3)
├─ 5.1 Client + Interceptors

Phase 6: Frontend Integration (starts after Phase 2 APIs ready)
├─ 6.1-6.6 Screen Integration

Phase 7-8: Testing & Deployment
```

---

## IMPLEMENTATION CHECKLIST

**Week 1-2 (Phase 1)**:
- [ ] Monorepo created + workspaces configured
- [ ] PostgreSQL schema migrated
- [ ] Auth endpoints working (test with Postman)
- [ ] First deploy to staging

**Week 2-3 (Phase 2)**:
- [ ] All CRUD endpoints for projects/media done
- [ ] File upload to S3 working
- [ ] State management stores ready
- [ ] API client ready

**Week 3-4 (Phase 3-4)**:
- [ ] Worker consuming jobs from Redis queue
- [ ] Image stitching processor working
- [ ] Panorama simulation rendering video output
- [ ] Processing job tracking complete

**Week 4-5 (Phase 6)**:
- [ ] Mobile screens connected to backend
- [ ] Full auth flow working on mobile
- [ ] Upload flow tested end-to-end
- [ ] Processing status polling working

**Week 5-6 (Phase 7)**:
- [ ] All tests passing (backend + frontend)
- [ ] Error handling for edge cases
- [ ] Performance benchmarks OK

**Week 6-7 (Phase 8)**:
- [ ] Infrastructure deployed
- [ ] TestFlight / Play Store ready
- [ ] Go/no-go decision

---

## SUCCESS CRITERIA

### Functional Completion
- [ ] Users can sign up/login
- [ ] Users can create projects and upload media
- [ ] Users can start processing (job queued)
- [ ] Users can poll job status
- [ ] Users can download output video
- [ ] Users can share public link
- [ ] Public viewer displays 360 panorama

### Non-Functional Requirements
- [ ] Processing time < 5 minutes per project
- [ ] 80%+ successful generation rate
- [ ] <10% stitching failure rate
- [ ] API response time < 200ms
- [ ] Zero data loss in job queue
- [ ] Graceful error handling (all edge cases covered)

### Security & Reliability
- [ ] All passwords hashed (bcrypt/argon2)
- [ ] All tokens validated on every request
- [ ] HTTPS enforced everywhere
- [ ] Rate limiting active
- [ ] Logging + monitoring active
- [ ] Backup + disaster recovery tested

---

## NOTES FOR EXECUTION

1. **Build Incrementally**: Don't skip ahead. Each phase depends on previous ones.
2. **Test Before Moving Forward**: Use Postman/Curl to verify APIs before mobile integration.
3. **Monitor Resource Usage**: S3 costs, database size, Redis memory—watch these closely.
4. **Communicate Clearly**: Status meetings daily during development to track blockers.
5. **Keep Docs Updated**: Update this roadmap as you discover new requirements.
6. **Version API Early**: Start with `/api/v1`, plan for `/api/v2` changes.

---

**This roadmap is a living document. Update it as you learn more during implementation.**
