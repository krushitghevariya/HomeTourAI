# HomeTour AI - Architecture & Dependencies Deep Dive
## Supporting Technical Documentation

---

## ARCHITECTURE LAYERS

### Layer 1: API Layer (Node.js + Express/NestJS)
**Responsibility**: Request handling, validation, authentication, business logic coordination

**Components**:
```
├── routes/
│   ├── auth.routes.ts          (signup, login, refresh, logout)
│   ├── projects.routes.ts      (CRUD projects)
│   ├── media.routes.ts         (upload, list, delete)
│   ├── processing.routes.ts    (generate, status, output)
│   └── public.routes.ts        (share viewer)
│
├── controllers/
│   ├── AuthController.ts
│   ├── ProjectController.ts
│   ├── MediaController.ts
│   ├── ProcessingController.ts
│   └── PublicController.ts
│
├── services/
│   ├── AuthService.ts          (JWT, password hashing)
│   ├── ProjectService.ts       (project CRUD)
│   ├── MediaService.ts         (file metadata, S3 integration)
│   ├── ProcessingService.ts    (job enqueue, status tracking)
│   └── S3Service.ts            (AWS SDK wrapper)
│
├── middleware/
│   ├── authMiddleware.ts       (verify JWT)
│   ├── errorHandler.ts         (global error catching)
│   ├── rateLimiter.ts          (express-rate-limit)
│   └── requestLogger.ts        (morgan or pino)
│
├── models/
│   ├── User.ts                 (ORM model)
│   ├── Project.ts
│   ├── MediaFile.ts
│   ├── ProcessingJob.ts
│   └── Output.ts
│
└── config/
    ├── database.ts             (PostgreSQL connection)
    ├── redis.ts                (Redis/BullMQ setup)
    ├── aws.ts                  (S3 configuration)
    └── jwt.ts                  (token secrets/expiry)
```

**Key Dependencies**:
```json
{
  "express": "^4.18.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "pg": "^8.11.0",
  "typeorm": "^0.3.0",
  "bullmq": "^3.13.0",
  "redis": "^4.6.0",
  "aws-sdk": "^2.1400.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.0.0",
  "dotenv": "^16.3.0"
}
```

**Request Flow Example** (Create Project):
```
POST /api/v1/projects
  ↓
Express receives request
  ↓
authMiddleware validates JWT
  ↓
ProjectController.create()
  ↓
ProjectService.createProject()
  - Validate name (length, special chars)
  - Validate propertyType enum
  - Generate UUID
  - Insert into DB
  ↓
Return { id, name, status, createdAt }
```

---

### Layer 2: Processing/Worker Layer
**Responsibility**: CPU-intensive async work (image stitching, video encoding)

**Architecture**:
```
Worker Process
├── BullMQ Consumer
│   ├── Listen to Redis queue
│   ├── Pull job { projectId, jobType, mediaUrl }
│   └── Dispatch to appropriate processor
│
├── Processors/
│   ├── ImageStitchingProcessor
│   │   ├── Download images from S3
│   │   ├── Run OpenCV stitching
│   │   ├── Upload panorama to S3
│   │   └── Return result metadata
│   │
│   ├── PanoramaSimulationProcessor
│   │   ├── Use stitched panorama
│   │   ├── Create virtual camera path
│   │   ├── Render frames using Three.js
│   │   ├── Encode with FFmpeg
│   │   └── Upload MP4 to S3
│   │
│   ├── VideoStabilizationProcessor
│   │   ├── Download video from S3
│   │   ├── Run FFmpeg vidstab filter
│   │   └── Upload stabilized video
│   │
│   └── ARSurfaceDetectionProcessor
│       ├── Download room photo
│       ├── Run depth estimation model
│       ├── Segment surfaces
│       └── Store metadata in DB
│
├── Queue Manager
│   ├── Handle retries (max 2)
│   ├── Track job progress
│   ├── Update DB on completion
│   └── Send webhook to backend
│
└── Logger
    ├── Log each step
    ├── Send to CloudWatch/ELK
    └── Alert on failures
```

**Key Processor Parameters**:

**Image Stitching**:
```
Input:  { photoPaths: string[], projectId: string }
Config: {
  minFeatures: 100,
  blendingType: 'feather',
  compositorType: 'panorama',
  seamEstimationResizing: 100,
  seamFinding: 'gc_color_graph'
}
Output: { stitchedImageUrl: string, quality: number }
```

**Panorama Simulation**:
```
Input:  { panoramaUrl: string, duration: 30 }
Config: {
  resolution: '1920x1080',
  fps: 30,
  bitrate: '4000k',
  codec: 'libx264',
  panSpeed: 'slow' (0.5x normal)
}
Output: { videoUrl: string, duration: 30 }
```

**Video Stabilization**:
```
Input:  { videoUrl: string }
Config: {
  shakiness: 5,          // 1-10 scale
  accuracy: 4,           // 1-15 scale
  type: 'adaptive',
  zoom: 0,               // Don't crop
  relative: false        // Global stabilization
}
Output: { stabilizedVideoUrl: string }
```

**Key Dependencies**:
```json
{
  "bullmq": "^3.13.0",
  "redis": "^4.6.0",
  "aws-sdk": "^2.1400.0",
  "sharp": "^0.33.0",
  "opencv4nodejs": "^5.6.0",
  "fluent-ffmpeg": "^2.1.2",
  "three": "^r154",
  "tensorflow": "^4.20.0",
  "pino": "^8.17.0"
}
```

---

### Layer 3: Database Layer
**Responsibility**: Persistent state, transaction management

**PostgreSQL Tables** (Detailed Schema):

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  storage_used_bytes BIGINT DEFAULT 0,
  storage_limit_bytes BIGINT DEFAULT 5368709120,  -- 5GB for free tier
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('apartment', 'villa', 'office', 'other')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- media_files table
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('photo', 'video', 'ar_recording')),
  file_url VARCHAR(2048) NOT NULL,  -- S3 URL
  file_size BIGINT NOT NULL,
  resolution VARCHAR(50),            -- '1920x1080'
  duration_seconds INTEGER,          -- for videos
  is_valid BOOLEAN DEFAULT true,     -- false if validation fails
  validation_errors TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_media_files_project_id ON media_files(project_id);

-- processing_jobs table
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('360_generation', 'ar_render', 'stabilization')),
  status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  progress_percentage SMALLINT DEFAULT 0,
  current_stage VARCHAR(100),        -- 'stitching', 'panorama_sim', 'encoding'
  error_message TEXT,
  retry_count SMALLINT DEFAULT 0,
  max_retries SMALLINT DEFAULT 2,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  timeout_at TIMESTAMP,              -- 30 min from start
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_processing_jobs_project_id ON processing_jobs(project_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_created_at ON processing_jobs(created_at DESC);

-- outputs table
CREATE TABLE outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES processing_jobs(id) ON DELETE CASCADE,
  output_type VARCHAR(50) NOT NULL CHECK (output_type IN ('360_video', 'ar_video', 'panorama')),
  file_url VARCHAR(2048) NOT NULL,   -- S3 URL to output file
  file_size BIGINT,
  duration_seconds INTEGER,
  resolution VARCHAR(50),
  thumbnail_url VARCHAR(2048),
  public_share_enabled BOOLEAN DEFAULT true,
  public_share_token VARCHAR(64) UNIQUE,
  share_created_at TIMESTAMP,
  share_expires_at TIMESTAMP,        -- optional TTL
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_outputs_project_id ON outputs(project_id);
CREATE INDEX idx_outputs_public_share_token ON outputs(public_share_token);

-- refresh_tokens table (for JWT refresh token revocation)
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

**Connection Pooling Config**:
```
Max connections: 20 (per API instance)
Idle timeout: 30s
Connection timeout: 5s
Statement timeout: 30s (prevent long-running queries)
```

---

### Layer 4: Queue/Message System (Redis + BullMQ)
**Responsibility**: Reliable job distribution, retry logic, concurrency control

**Queue Architecture**:
```
Queue Structure:
redis://localhost:6379/hometour
├── hometour:queue:processing  (main job queue)
│   ├── Job { id, projectId, jobType, mediaUrls }
│   ├── Options { priority, delay, attempts, timeout }
│   └── Retry { attempts: 2, backoff: exponential }
│
├── hometour:queue:priority    (high-priority jobs - future)
└── hometour:queue:webhook     (webhook retry queue)

BullMQ Job States:
[Waiting] → [Active] → [Completed] ✓
              ↓
           [Failed] → [Waiting] (retry) or [Abandoned]
```

**BullMQ Configuration**:
```typescript
const processingQueue = new Queue('processing', {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,  // 5s, then 25s (5000 * 5^1)
    },
    removeOnComplete: true,
    removeOnFail: false,  // Keep failed jobs for analysis
    timeout: 1800000,     // 30 minutes per job max
  },
});

// Consumer
processingQueue.process(async (job) => {
  try {
    const result = await processor.process(job.data);
    return result;
  } catch (error) {
    if (job.attemptsMade >= job.opts.attempts) {
      // Mark project as failed in DB
      await updateProjectStatus(job.data.projectId, 'failed');
      // Send webhook to backend
      await sendWebhook('job-failed', job.id);
    }
    throw error; // BullMQ will retry
  }
});
```

**Concurrency Control**:
```typescript
// Process max 2 jobs simultaneously per worker
processingQueue.process(2, processor);

// For GPU-intensive work (future), reduce to 1
processingQueue.process(1, processor);
```

---

### Layer 5: Storage Layer (AWS S3)
**Responsibility**: Media file persistence, public serving via CDN

**S3 Bucket Structure**:
```
hometour-assets-prod/
├── uploads/
│   ├── users/{userId}/
│   │   ├── projects/{projectId}/
│   │   │   ├── photos/
│   │   │   │   ├── {fileId}-1.jpg          (3-5MB, user uploaded)
│   │   │   │   ├── {fileId}-2.jpg
│   │   │   │   └── ...
│   │   │   ├── videos/
│   │   │   │   └── {fileId}.mp4            (50-200MB, user uploaded)
│   │   │   └── stitched/
│   │   │       └── {jobId}-panorama.jpg    (20-40MB, intermediate)
│   │   └── (next project)
│   └── (next user)
│
├── outputs/
│   ├── {projectId}/
│   │   ├── {jobId}-360.mp4                 (20-100MB, final output)
│   │   ├── {jobId}-thumbnail.jpg            (200KB)
│   │   └── share/{shareToken}/             (public, via CloudFront)
│   │       └── index.html                   (web viewer)
│   └── (next project)
│
├── temp/                                    (cleanup nightly)
│   ├── incomplete-uploads/
│   └── processing-artifacts/
│
└── backups/ (archival, moved to Glacier)
    └── ...
```

**S3 Lifecycle Policies**:
```json
{
  "Rules": [
    {
      "Id": "DeleteIncompleteUploads",
      "Filter": { "Prefix": "uploads/temp/" },
      "Expiration": "P7D",
      "Status": "Enabled"
    },
    {
      "Id": "MoveOldOutputsToGlacier",
      "Filter": { "Prefix": "outputs/" },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

**CloudFront CDN Distribution**:
```
Distribution:
  Origin: S3 bucket
  Cache behavior (public shares):
    Path: /outputs/share/*
    TTL: 30 days
    Compress: true
    Allowed methods: GET, HEAD
  HTTPS: mandatory
  Logging: enabled (to S3)
```

**S3 Presigned URLs** (for direct upload from mobile):
```
URL format: https://s3.amazonaws.com/hometour-assets/{key}?...
Expiry: 1 hour (time to upload)
Permissions: PUT only (no DELETE, no list)
```

**Cost Estimation**:
```
Storage tiers:
  100 projects × 150MB avg output = 15GB active
  × $0.023/GB/month = ~$345/month

Bandwidth (CDN):
  1000 shares × 50MB average = 50TB/month
  × $0.085/GB = ~$4,250/month

S3 API calls:
  Upload: 100 projects × 10 uploads = 1000 requests = $0.005
  Download: 1000 shares × avg 10 views = 10k requests = $0.05
  → Plan for ~$4,600/month at launch scale
```

---

## STATE MANAGEMENT FLOW

### Redux/Zustand Store Architecture

```typescript
// Root store structure
store/
├── authSlice.ts
│   └── {
│       user: User | null,
│       isAuthenticated: boolean,
│       accessToken: string | null,
│       refreshToken: string | null,
│       isLoading: boolean,
│       error: string | null,
│       // Actions
│       login(), signup(), logout(), refreshToken()
│     }
├── projectsSlice.ts
│   └── {
│       items: Project[],
│       currentProject: Project | null,
│       isLoading: boolean,
│       error: string | null,
│       // Actions
│       fetchAll(), create(), select(), delete()
│     }
├── mediaSlice.ts
│   └── {
│       files: MediaFile[],
│       uploadProgress: { [fileId]: number },
│       isUploading: boolean,
│       error: string | null,
│       // Actions
│       upload(), remove(), setProgress()
│     }
└── processingSlice.ts
    └── {
        currentJob: ProcessingJob | null,
        jobHistory: ProcessingJob[],
        isProcessing: boolean,
        progress: { percentage: number, stage: string },
        // Actions
        startJob(), pollStatus(), cancel()
      }
```

**Store Persistence** (AsyncStorage on mobile):
```typescript
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],  // Only persist auth tokens
  version: 1,
};

// On app startup:
// 1. Restore persisted auth state
// 2. Validate tokens (not expired)
// 3. Refresh if necessary
// 4. Navigate to Dashboard or Login
```

---

## ERROR HANDLING HIERARCHY

**Global Error Types**:
```typescript
// API Errors → Store Error → UI Toast/Alert

interface ApiError {
  status: number;      // 400, 401, 403, 500, etc.
  code: string;        // 'AUTH_FAILED', 'FILE_TOO_LARGE', etc.
  message: string;     // User-friendly message
  timestamp: string;
  requestId: string;   // For logging/debugging
}

// Store normalized errors
interface StoreError {
  type: 'auth' | 'network' | 'validation' | 'processing' | 'unknown';
  message: string;
  code: string;
  retryable: boolean;
  action?: () => void;  // Retry function
}

// UI Shows
<Toast variant="error" message={error.message} action={error.action} />
```

**Common Error Scenarios**:

| Scenario | HTTP Status | Code | User Message | Action |
|----------|------------|------|--------------|--------|
| Invalid email | 400 | INVALID_EMAIL | "Please enter a valid email" | Focus field |
| Email taken | 409 | EMAIL_EXISTS | "Email already in use. Try login?" | Link to login |
| Wrong password | 401 | AUTH_FAILED | "Email or password incorrect" | Retry |
| Token expired | 401 | TOKEN_EXPIRED | Auto-refresh, show login if fails | Refresh token |
| File too large | 413 | FILE_TOO_LARGE | "Max file size is 500MB" | Show size |
| Network error | timeout | NETWORK_ERROR | "No internet connection" | Retry button |
| Processing failed | 500 | JOB_FAILED | "Processing failed. [Error details]" | Retry / Re-upload |
| S3 upload failed | 503 | S3_UNAVAILABLE | "Storage service unavailable. Retry?" | Retry |

---

## DEPLOYMENT ARCHITECTURE

### Development → Staging → Production

```
Development (Local)
├── PostgreSQL (docker-compose)
├── Redis (docker-compose)
├── Node.js backend (npm start)
├── Worker process (npm start)
└── React Native Expo

Staging (AWS)
├── RDS PostgreSQL (t3.micro, 20GB)
├── ElastiCache Redis (cache.t3.micro)
├── EC2 (t3.small) × 2 (API + Worker)
├── S3 + CloudFront (staging bucket)
├── TestFlight / Google Play Internal Testing
└── Monitoring: DataDog, PagerDuty

Production (AWS)
├── RDS PostgreSQL (t3.small → t3.medium, 100GB)
├── ElastiCache Redis (cache.t3.small)
├── EC2 Auto Scaling (min 2, max 10) + Load Balancer
├── Dedicated Worker instances (t3.large) × 2-4
├── S3 + CloudFront (multi-region replicas)
├── App Store / Google Play
├── Monitoring: CloudWatch, custom dashboards
├── Alerting: SNS, email, Slack
└── Logging: ELK stack (Elasticsearch + Kibana)
```

---

## PERFORMANCE TARGETS

| Metric | Target | Measurement |
|--------|--------|-------------|
| API response time (p95) | <200ms | All endpoints except processing |
| File upload speed | Gigabit limited | Direct S3 upload |
| Processing time (360 tour) | <5 minutes | Photo: 5 photos, Video: 10-30s input |
| Job queue latency | <10 seconds | Upload to Redis → Worker pickup |
| Database query time (p95) | <100ms | No full table scans |
| Worker throughput | 4 jobs/hour | 1 job = 5-6 minutes processing |
| Mobile app startup | <2 seconds | Cold start on moderate phone |
| 360 viewer load | <3 seconds | 20MB panorama video + WebGL init |

---

## MONITORING & OBSERVABILITY

**Key Metrics**:
```
Backend:
  ├─ Success rate (200/total requests)
  ├─ Error rate by endpoint
  ├─ Database connection pool utilization
  ├─ Redis memory usage
  ├─ S3 API call counts + errors
  └─ Response time percentiles (p50, p95, p99)

Processing:
  ├─ Queue depth (waiting jobs)
  ├─ Worker availability
  ├─ Job success rate
  ├─ Processing time histogram
  ├─ Failure reasons (stitching fail, timeout, etc.)
  └─ Retry rates

Infrastructure:
  ├─ CPU utilization
  ├─ Memory usage
  ├─ Disk space (especially S3)
  ├─ Network bandwidth
  └─ Cost per month by service
```

**Alerting Rules**:
```
Critical:
  - Error rate > 5% for >5 min
  - Queue depth > 100 jobs ("workers down")
  - Database unavailable
  - S3 service errors

Warning:
  - Error rate > 2%
  - Response time p95 > 500ms
  - Worker CPU > 80%
  - Storage usage > 80% capacity
```

---

## SECURITY CHECKLIST

- [ ] All passwords hashed (bcryptjs, cost factor ≥10)
- [ ] JWT tokens signed with strong secret (32+ bytes)
- [ ] Refresh tokens stored in DB (not client-side)
- [ ] HTTP-only secure cookies for web
- [ ] HTTPS everywhere (TLS 1.3)
- [ ] CORS configured to allow only app domain
- [ ] Rate limiting on auth endpoints (5/15min per IP)
- [ ] SQL injection prevention (use ORM, prepared statements)
- [ ] XSS prevention (sanitize all user input)
- [ ] CSRF tokens on state-changing operations
- [ ] Input validation on all endpoints
- [ ] File upload scanning (virus scan, magic bytes check)
- [ ] Environment secrets in .env (not in git)
- [ ] Database backups automated daily
- [ ] Access logs in S3 (enable CloudTrail)
- [ ] Principle of least privilege (IAM roles)
- [ ] Regular security audits (OWASP Top 10)
- [ ] Dependency scanning (dependabot)

---

**This document should be reviewed and updated as implementation progresses.**
