# Backend Integration Guide - HomeTour AI

## Architecture Overview

The frontend follows a **three-layer architecture** designed for stability, type safety, and scalability:

```
┌─────────────────────────────────────┐
│   Screens / Components              │  User-facing UI
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Custom Hooks (use-auth, use-projects)  │  State & async management
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Service Layer (*.service.ts)       │  Business logic & API calls
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   HTTP Client & Supabase Client      │  API communication
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Error Handling & Middleware        │  Validation, retry, timeout
└─────────────────────────────────────┘
```

---

## 1. API Client Structure

### HTTP Client (`src/api/client/http-client.ts`)

Handles all REST API communication with built-in:
- **Retry logic** (exponential backoff with jitter)
- **Timeout protection** (configurable per request)
- **Error handling** (typed error classes)
- **File uploads** (XMLHttpRequest for progress tracking)

#### Usage Example

```typescript
import { apiClient } from '@/api';

// GET request
const projects = await apiClient.http.get<Project[]>('/projects');

// POST request with data
const project = await apiClient.http.post<Project>('/projects', {
  name: 'My Home',
  propertyType: 'villa',
});

// File upload with progress
await apiClient.http.uploadFile(
  `/projects/${projectId}/upload`,
  file,
  { fileType: 'image' },
  (progress) => console.log(`${progress}% uploaded`)
);
```

### Supabase Client (`src/api/client/supabase-client.ts`)

Manages authentication and real-time data:
- **Email/password auth** (matches TRD)
- **Session management** (auto-refresh)
- **User metadata** (plan type, preferences)
- **Real-time subscriptions** (future use)

#### Usage Example

```typescript
import { apiClient } from '@/api';

const supabase = apiClient.supabase;

// Sign up
const user = await supabase.signUp(email, password);

// Get current session
const session = await supabase.getSession();

// Listen for auth changes
const { unsubscribe } = supabase.onAuthStateChange((user) => {
  console.log('Auth state changed:', user);
});
```

---

## 2. Service Layer Pattern

Services are **thin abstractions** over the HTTP client. They:
- **Validate inputs** before API calls
- **Transform responses** if needed
- **Handle service-level errors**
- **Provide business logic** grouping

### Auth Service (`src/api/services/auth.service.ts`)

```typescript
import { authService } from '@/api/services';

// Sign up with validation
const signupResponse = await authService.signUp({
  email: 'user@example.com',
  password: 'SecurePass123',
  fullName: 'John Doe',
});

// Login
const loginResponse = await authService.login({
  email: 'user@example.com',
  password: 'SecurePass123',
});

// Get current user
const user = await authService.getCurrentUser();

// Listen for auth changes
const subscription = authService.onAuthStateChange((user) => {
  if (user) console.log('User logged in:', user);
  else console.log('User logged out');
});
```

### Project Service (`src/api/services/project.service.ts`)

```typescript
import { projectService } from '@/api/services';

// List all projects
const projects = await projectService.listProjects();

// Create project
const newProject = await projectService.createProject({
  name: 'Beach House Tour',
  propertyType: 'villa',
  description: 'Luxury beachfront property',
});

// Get project details (with media count & job status)
const detail = await projectService.getProjectDetail(projectId);

// Update project
await projectService.updateProject(projectId, {
  name: 'Updated Name',
});

// Delete project
await projectService.deleteProject(projectId);
```

### Media Service (`src/api/services/media.service.ts`)

```typescript
import { mediaService } from '@/api/services';

// Upload media file
const mediaFile = await mediaService.uploadMedia(
  {
    file: {
      uri: 'file://path/to/image.jpg',
      name: 'image.jpg',
      type: 'image/jpeg',
      size: 2048000,
    },
    fileType: 'image',
    projectId: 'proj-123',
  },
  (progress) => console.log(`Upload: ${progress}%`)
);

// Get project media
const media = await mediaService.getProjectMedia(projectId);

// Validate media before generation
const validation = await mediaService.validateMedia({
  projectId,
});

// Delete media file
await mediaService.deleteMediaFile(projectId, mediaId);
```

### Job Service (`src/api/services/job.service.ts`)

```typescript
import { jobService } from '@/api/services';

// Start generation job
const { job, estimatedDuration } = await jobService.startGeneration({
  projectId: 'proj-123',
  generationType: 'tour_360',
  config: {
    stitchingQuality: 'high',
    enableStabilization: true,
  },
});

// Check job status
const status = await jobService.getJobStatus(projectId);

// Poll for updates (auto-manages subscriptions)
const unsubscribe = jobService.pollJobStatus(
  projectId,
  (job) => console.log(`Progress: ${job.progressPercentage}%`),
  (job) => console.log('Job completed:', job),
  (error) => console.error('Polling error:', error)
);

// Stop polling when done
unsubscribe();

// Cancel a job
await jobService.cancelJob(jobId);
```

---

## 3. Custom Hooks (State Management)

Hooks handle **async operations** and **component-level state** without external state management libraries.

### `useAsyncAction<T>` - Base Hook

Manages loading, error, and data states for any async operation:

```typescript
import { useAsyncAction } from '@/hooks';

const action = useAsyncAction<Project>({
  onSuccess: () => console.log('Created!'),
  onError: (error) => console.error(error),
  showErrorMessage: true,
});

// Execute
const result = await action.execute(async () => {
  return await projectService.createProject(data);
});

// State
console.log(action.loading); // boolean
console.log(action.error); // Error | null
console.log(action.data); // Project | null
console.log(action.errorMessage); // string (user-friendly)

// Reset
action.reset();
```

### `useAuth` - Authentication Hook

Manages user authentication state and auth operations:

```typescript
import { useAuth } from '@/hooks';

const {
  user, // AuthUser | null
  isAuthenticated, // boolean
  isInitializing, // boolean (true on app load)
  signup: { execute: signupUser, loading, error },
  login: { execute: loginUser, loading, error },
  logout: { execute, loading, error },
} = useAuth();

// Sign up
if (!isInitializing) {
  await signupUser({
    email: 'user@example.com',
    password: 'SecurePass123',
    fullName: 'John',
  });
}

// Login
await loginUser({
  email: 'user@example.com',
  password: 'SecurePass123',
});

// Logout
await logout.execute();
```

### `useProjects` - Projects Hook

Manages project list and operations:

```typescript
import { useProjects } from '@/hooks';

const {
  projects, // Project[]
  loading, // boolean
  error, // string
  fetchProjects,
  createProject: { execute, loading, error },
  updateProject: { execute, loading, error },
  deleteProject: { execute, loading, error },
  getProjectDetail: { execute, loading, error, data },
} = useProjects();

// Load projects
await fetchProjects();

// Create
const newProject = await createProject.execute({
  name: 'My Project',
  propertyType: 'apartment',
});

// Get detail (includes media count & job status)
const detail = await getProjectDetail.execute(projectId);
```

### `useMedia` - Media Upload Hook

Manages media files and upload progress:

```typescript
import { useMedia } from '@/hooks';

const {
  mediaFiles, // MediaFile[]
  uploadProgress, // Record<fileId, progress%>
  fetchMedia,
  uploadMedia: { execute, loading, error },
  deleteMedia: { execute, loading, error },
  validateMedia: { execute, loading, error },
  getUploadProgress, // (fileId: string) => number
} = useMedia(projectId);

// Load media
await fetchMedia();

// Upload with progress tracking
await uploadMedia.execute({
  file: {
    uri: 'file://...',
    name: 'image.jpg',
    type: 'image/jpeg',
    size: 1024000,
  },
  fileType: 'image',
  projectId,
});

// Check progress
const progress = getUploadProgress('image.jpg');
```

### `useGeneration` - Job Generation Hook

Manages tour generation jobs with built-in polling:

```typescript
import { useGeneration } from '@/hooks';

const {
  currentJob, // ProcessingJob | null
  jobProgress, // 0-100
  jobStatus, // 'queued' | 'running' | 'completed' | 'failed'
  loading,
  error,
  startGeneration: { execute },
  cancelGeneration: { execute },
  resetJob,
  stopPolling,
} = useGeneration();

// Start generation (auto-polls for updates)
await startGeneration.execute({
  projectId,
  generationType: 'tour_360',
  config: {
    stitchingQuality: 'high',
    enableStabilization: true,
  },
});

// currentJob updates automatically via polling

// Stop polling early
stopPolling();

// Reset state
resetJob();
```

---

## 4. Error Handling Strategy

All errors are typed and user-friendly. The system uses a **standardized error hierarchy**:

```typescript
import {
  ApiError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  NetworkError,
  getUserFriendlyMessage
} from '@/api/errors';

try {
  await projectService.createProject({ ... });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  } else if (error instanceof AuthenticationError) {
    // Redirect to login
  } else if (error instanceof RateLimitError) {
    // Show "too many requests" message
  } else if (error instanceof TimeoutError) {
    // Show "request took too long" message
  }

  // Always use this for user-facing messages
  const userMessage = getUserFriendlyMessage(error);
  showAlert(userMessage);
}
```

### Error Classes

| Class | Status | When to Use |
|-------|--------|------------|
| `AuthenticationError` | 401 | Invalid/missing credentials |
| `AuthorizationError` | 403 | User lacks permission |
| `ValidationError` | 400 | Input validation failed |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Resource already exists |
| `RateLimitError` | 429 | Too many requests |
| `TimeoutError` | 504 | Request exceeded time limit |
| `NetworkError` | 0 | Network unavailable |

### Retry Strategy

**Automatically retried (with exponential backoff):**
- Network errors
- Timeouts
- Rate limits (429)

**Never retried:**
- 4xx errors (except 429)
- 5xx errors (only transient, implementation decides)

Configure per request:

```typescript
await apiClient.http.get('/projects', {
  timeout: 30000,
  retries: 5, // Override default of 3
});
```

---

## 5. Loading States & UI Patterns

### Pattern 1: Simple Action

```typescript
const CreateProjectForm = () => {
  const { createProject } = useProjects();

  const handleCreate = async () => {
    const result = await createProject.execute({
      name: 'New Project',
      propertyType: 'apartment',
    });

    if (result) {
      showSuccess('Project created');
    } else {
      showError(createProject.error);
    }
  };

  return (
    <Button
      title="Create Project"
      disabled={createProject.loading}
      onPress={handleCreate}
    />
  );
};
```

### Pattern 2: List with Loading

```typescript
const ProjectsList = () => {
  const { projects, loading, error, fetchProjects } = useProjects();

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProjects} />;
  if (projects.length === 0) return <EmptyState />;

  return (
    <FlatList
      data={projects}
      renderItem={({ item }) => <ProjectCard project={item} />}
      keyExtractor={(item) => item.id}
    />
  );
};
```

### Pattern 3: Long-Running Operation with Progress

```typescript
const GenerationScreen = ({ projectId }) => {
  const { currentJob, jobProgress, jobStatus, startGeneration, resetJob } =
    useGeneration();

  const handleStart = async () => {
    await startGeneration.execute({
      projectId,
      generationType: 'tour_360',
    });
  };

  useEffect(() => {
    return () => {
      resetJob();
    };
  }, []);

  if (!currentJob) {
    return <Button title="Start Generation" onPress={handleStart} />;
  }

  return (
    <>
      <ProgressBar progress={jobProgress} />
      <Text>Status: {jobStatus}</Text>
      {jobStatus === 'failed' && <Text color="red">{currentJob.errorMessage}</Text>}
    </>
  );
};
```

---

## 6. Security & Validation

### Input Validation

All user inputs validated before API calls:

```typescript
import {
  validateEmail,
  validatePassword,
  validateProjectName,
  validateFileSize,
  validateFileType,
  validateImageDimensions,
  validateVideoDuration,
} from '@/api/middleware';

try {
  validateEmail('user@example.com');
  validatePassword('SecurePass123');
  validateProjectName('My Project');
  validateFileSize(5242880, 50); // 5MB, max 50MB
  validateFileType('photo.jpg', 'image/jpeg', ['image/jpeg', 'image/png']);
  validateImageDimensions(1920, 1080, 320, 240); // actual, min
  validateVideoDuration(120, 5); // 120 seconds, min 5 seconds
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.message, error.details);
  }
}
```

### Automatic Rules

| Validation | Rule |
|-----------|------|
| Email | Valid email format required |
| Password | Min 8 chars, 1 uppercase, 1 number |
| Project Name | 1-100 characters |
| Image Files | JPEG/PNG/WebP, max 50MB |
| Video Files | MP4/QuickTime, max 500MB |
| Image Size | Min 320x240 pixels |
| Video Duration | Min 5 seconds |

### Authentication Security

- **Access tokens** auto-refreshed before expiry
- **Tokens stored** in secure keychain (mobile) or HTTP-only cookies (web)
- **CORS** enforced to same-origin requests only
- **Credentials** included automatically in all requests

### Rate Limiting (Client)

Enforced per user per project:

```typescript
// Will throw RateLimitError on 429
const { execute, error } = await uploadMedia.execute(file);
```

---

## 7. Integration Checklist

### Before Launch

- [ ] Backend API deployed and accessible
- [ ] Supabase authentication configured
- [ ] Environment variables set (`.env`):
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  VITE_API_URL=https://api.yourdomain.com/api/v1
  ```
- [ ] API endpoints match this guide
- [ ] Error response format matches error handling
- [ ] Job polling interval (3000ms default) acceptable
- [ ] File upload size limits enforced on backend
- [ ] All media types validated on backend
- [ ] CORS headers present on all endpoints

### Testing

- [ ] Network failures handled gracefully
- [ ] Retries work for transient errors
- [ ] Timeouts trigger appropriate UI feedback
- [ ] Progress tracking works for uploads
- [ ] Job polling stops on completion
- [ ] Validation errors show meaningful messages
- [ ] Authentication redirects on 401
- [ ] Rate limits respected

---

## 8. Future Enhancements

### Planned Improvements

1. **WebSocket Support** for real-time progress
2. **Offline Queue** for delayed operations
3. **Request Caching** to reduce API calls
4. **Batch Operations** for bulk uploads
5. **Analytics** event tracking
6. **Timeout Customization** per operation type

These can be added without changing the current API surface.

---

## Troubleshooting

### Common Issues

**Problem**: "Cannot authenticate user"
- **Cause**: Supabase credentials invalid or network unavailable
- **Fix**: Verify `.env` variables and network connectivity

**Problem**: File upload fails at 50%
- **Cause**: Backend timeout or request too large
- **Fix**: Increase timeout or split into smaller chunks

**Problem**: Generation job never completes
- **Cause**: Polling stopped or job stuck on backend
- **Fix**: Check job status via `/jobs/{id}`, maybe restart worker

**Problem**: "429 Too Many Requests"
- **Cause**: User hitting rate limit
- **Fix**: Wait and retry, check backend limits

**Problem**: Type errors in screens
- **Cause**: Service response doesn't match type
- **Fix**: Verify API response matches defined types

---

## Support

For questions or issues:
1. Check error message - usually actionable
2. Review relevant service file
3. Check API endpoint implementation
4. Review error handling docs above

