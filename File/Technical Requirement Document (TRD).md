# Technical Requirement Document (TRD)
## Product: HomeTour AI (V1)

---

# 1. System Architecture Overview

## 1.1 Architectural Style

**Pattern:** Modular Monolith (V1) → Microservice-ready

**Rationale:**
- Faster development and iteration
- Lower infrastructure complexity
- Easier debugging and deployment
- Clean internal module boundaries for future extraction
- AI processing can be separated later without redesign

---

## 1.2 High-Level Architecture

### Client Layer
- Mobile App (React Native or Flutter)
- Web App (React / Next.js)
- WebGL-based 360 Viewer

### API Layer
- Node.js (Express or NestJS)
- REST API
- JWT-based authentication
- Role-ready but single-role in V1

### Processing Layer
- AI Processing Worker (separate process/service)
- Redis-based Job Queue (BullMQ)
- Asynchronous execution model

### Storage Layer
- PostgreSQL (primary database)
- Object Storage (AWS S3 or equivalent)
- CDN (CloudFront or equivalent)

---

# 2. Frontend Responsibilities

## 2.1 Authentication
- Email signup/login
- Token management
- Secure storage (mobile keychain / HTTP-only cookies on web)
- Auto-refresh handling

## 2.2 Project Management
- Create project
- Delete project
- View project status
- Display generation progress
- Display output preview

## 2.3 Media Upload
- Client-side validation:
  - JPEG / PNG / MP4
  - File size limit
- Chunked upload for large files
- Upload progress tracking
- Retry on failure

## 2.4 Real-Time Capture Mode
- Gyroscope access
- Guided UI prompts
- Panorama capture flow
- Local preview before upload

## 2.5 AR Visualization
- ARKit / ARCore surface detection
- Load 3–5 predefined furniture models
- Placement interaction
- Record AR session
- Export AR preview clip

## 2.6 360 Viewer
- WebGL panorama renderer
- Drag-to-rotate
- Mobile responsive
- Public share page

---

# 3. Backend Responsibilities

## 3.1 Core API
- User authentication
- Project CRUD operations
- Media metadata management
- Job creation & tracking
- Shareable link generation

## 3.2 AI Processing Orchestrator

Flow:
1. Validate media
2. Create processing job
3. Push job to Redis queue
4. Worker consumes job
5. Run:
   - Image stitching
   - Panorama simulation
   - Video stabilization
   - Brightness correction
6. Store output to object storage
7. Update job status
8. Notify frontend (polling-based in V1)

## 3.3 Background Worker
- Runs CPU-intensive tasks
- Retries failed jobs (max 2 attempts)
- Timeout protection
- Structured logging

## 3.4 Error Handling
- Standardized API error format
- Job-level failure logging
- User-friendly error messages
- Upload validation errors

---

# 4. Database Schema Proposal (PostgreSQL)

## 4.1 users
- id (uuid, pk)
- email (unique)
- password_hash
- plan_type (free, paid)
- is_active
- created_at
- updated_at

## 4.2 projects
- id (uuid, pk)
- user_id (fk → users.id)
- name
- property_type (apartment, villa, office)
- status (draft, processing, completed, failed)
- created_at
- updated_at

## 4.3 media_files
- id (uuid, pk)
- project_id (fk → projects.id)
- file_type (image, video, ar_recording)
- file_url
- file_size
- resolution
- created_at

## 4.4 processing_jobs
- id (uuid, pk)
- project_id (fk → projects.id)
- job_type (360_generation, ar_render)
- status (queued, running, completed, failed)
- progress_percentage
- error_message
- started_at
- completed_at
- created_at

## 4.5 outputs
- id (uuid, pk)
- project_id (fk → projects.id)
- output_type (360_video, ar_video)
- file_url
- public_share_token (unique)
- created_at

### Indexes
- projects.user_id
- processing_jobs.status
- outputs.public_share_token (unique)

---

# 5. API Structure (REST)

Base Path: `/api/v1`

## 5.1 Authentication
POST   /auth/register  
POST   /auth/login  
POST   /auth/refresh  
POST   /auth/logout  

## 5.2 Projects
GET    /projects  
POST   /projects  
GET    /projects/:id  
DELETE /projects/:id  

## 5.3 Media
POST   /projects/:id/upload  
GET    /projects/:id/media  

## 5.4 Generation
POST   /projects/:id/generate  
GET    /projects/:id/status  

## 5.5 Outputs
GET    /projects/:id/output  
GET    /share/:public_token  

---

# 6. Authentication Strategy

## 6.1 Method
- Email + Password (V1)
- JWT Access Token (15 minutes)
- Refresh Token (7 days)

## 6.2 Storage
Mobile:
- Secure Keychain / Keystore

Web:
- HTTP-only secure cookies

## 6.3 Security Controls
- bcrypt or argon2 password hashing
- Login rate limiting
- Basic IP throttling
- File upload validation
- CORS restriction
- Input sanitization

---

# 7. Third-Party Dependencies

## Infrastructure
- AWS S3 (media storage)
- CloudFront (CDN)
- EC2 / ECS (compute)
- RDS PostgreSQL

## Processing
- FFmpeg (video processing)
- OpenCV (image stitching)
- Optional depth estimation library

## Queue
- Redis
- BullMQ

## AR
- ARKit (iOS)
- ARCore (Android)

## Viewer
- Three.js (WebGL 360 rendering)

---

# 8. Scalability Considerations

## 8.1 Stateless API
- Horizontal scaling supported
- No session memory on server

## 8.2 Isolated Processing Layer
- Worker runs independently
- Can scale worker count separately
- Future GPU support

## 8.3 Queue-Based Architecture
- Prevents blocking requests
- Controls concurrency
- Enables retry strategy

## 8.4 Object Storage
- No local file persistence
- CDN-backed delivery
- Supports global distribution

## 8.5 Rate Limiting
- Limit concurrent jobs per user
- Limit file size
- Limit projects for free users

## 8.6 Observability
- Centralized logging
- Job failure alerts
- Metrics: generation time, failure rate
- Storage monitoring

---

# 9. Stability-First Design Principles

- Avoid premature microservices
- Avoid real-time streaming complexity in V1
- Avoid serverless for heavy media workloads
- Prefer proven technologies (PostgreSQL, Redis)
- Clear separation between API and processing layer
- Explicit job tracking

---

# 10. Future Expansion Path

- Extract AI worker as independent microservice
- Introduce GPU cluster
- Add WebSocket live progress
- Add team collaboration
- Add billing & subscription system
- Add analytics dashboard
- Add CRM integrations

---

# V1 Summary

HomeTour AI V1 delivers:
- Media upload
- AI-generated 360 tour
- Real-time capture mode
- Basic AR visualization
- Export + share functionality

Optimized for:
- Long-term stability
- Controlled infrastructure cost
- Clean scalability path
- Operational simplicity