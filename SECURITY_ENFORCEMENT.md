# Security Enforcement Rules - HomeTour AI Frontend

## Overview

This document defines security rules that MUST be enforced at all layers: validation, authentication, authorization, and data handling.

---

## 1. Authentication Layer

### Rule 1.1: Token Management
- Access tokens must be stored securely
  - **Mobile**: Keychain (iOS) / Keystore (Android)
  - **Web**: HTTP-only, secure cookies
- Never store tokens in AsyncStorage or SharedPreferences
- Refresh tokens automatically before expiry (15 minutes before)
- Clear all tokens on logout

#### Implementation

```typescript
// ✅ Correct: Using secure storage
const supabase = getSupabaseClient();
const session = await supabase.getSession();
// Tokens automatically managed by Supabase

// ❌ Wrong: Storing in AsyncStorage
AsyncStorage.setItem('token', accessToken); // DO NOT DO THIS
```

### Rule 1.2: Session Validation
- Check authentication state on app launch
- Auto-logout on 401 responses
- Refresh session transparently on 403
- Require re-authentication for sensitive operations

#### Implementation

```typescript
// ✅ Correct: Initialize auth on app start
const App = () => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) return <SplashScreen />;

  return (
    <AppNavigator initialRouteName={user ? 'Dashboard' : 'Login'} />
  );
};

// ✅ Correct: Handle auth errors in service
catch (error) {
  if (error instanceof AuthenticationError) {
    // Redirect to login, clear state
    authService.logout();
  }
}
```

### Rule 1.3: Password Security
- Minimum 8 characters, 1 uppercase, 1 number
- Never log or transmit passwords
- Use HTTPS for all auth endpoints
- Never store passwords locally

#### Implementation

```typescript
// ✅ Correct: Validate on client
try {
  await authService.login({ email, password });
} catch (error) {
  if (error instanceof ValidationError) {
    // Show user-friendly message
    Toast.show('Invalid email or password');
  }
}

// ❌ Wrong: Storing or logging
console.log('Password:', password); // DO NOT DO THIS
localStorage.setItem('password', password); // DO NOT DO THIS
```

---

## 2. Authorization Layer

### Rule 2.1: User Ownership
All data access must verify user ownership:
- Users can only access their own projects
- Users can only delete their own projects
- Users can only read their own media

#### Implementation

```typescript
// ✅ Correct: Backend validates ownership
// Frontend sends request, backend checks user_id on project
const detail = await projectService.getProjectDetail(projectId);

// Backend MUST verify:
// SELECT * FROM projects
// WHERE id = projectId AND user_id = auth.uid()

// ❌ Wrong: Trusting client-side ID
// No backend verification = security hole
```

### Rule 2.2: Role-Based Access
- V1 has single role: user
- Future versions: agent, admin roles
- Prepare for roles but don't expose in V1

#### Implementation

```typescript
// ✅ Correct: Plan for roles
export interface AuthUser {
  id: string;
  email: string;
  role?: 'user' | 'agent' | 'admin'; // Ready for future
  planType: 'free' | 'pro' | 'enterprise';
}

// ✅ Correct: Role checks when needed
const canEditProject = (user: AuthUser, project: Project) => {
  return (
    user.id === project.userId ||
    user.role === 'admin'
  );
};
```

### Rule 2.3: API Endpoint Authorization
- All protected endpoints require valid JWT
- Use Bearer token format: `Authorization: Bearer <token>`
- Never include credentials in URL params

#### Implementation

```typescript
// ✅ Correct: Token sent in Authorization header
// HttpClient automatically includes this
const projects = await apiClient.http.get('/projects');

// ❌ Wrong: Token in URL (logged, cached)
fetch(`/api/projects?token=${token}`); // DO NOT DO THIS

// ❌ Wrong: Missing authorization
// Backend rejects if no token present
```

---

## 3. Input Validation Layer

### Rule 3.1: Client-Side Validation
Always validate before sending to backend:
- Email format
- Password strength
- File types and sizes
- Text length limits
- Image dimensions
- Video duration

#### Implementation

```typescript
// ✅ Correct: Validate all inputs
import { validateEmail, validatePassword } from '@/api/middleware';

const handleSignup = async (data) => {
  try {
    validateEmail(data.email);
    validatePassword(data.password);
    await authService.signUp(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      showFieldError(error.details.field, error.message);
    }
  }
};

// File validation before upload
try {
  validateFileType(file.name, file.type, ALLOWED_TYPES);
  validateFileSize(file.size, MAX_MB);
  await mediaService.uploadMedia(file);
} catch (error) {
  showAlert(error.message);
}
```

### Rule 3.2: Server-Side Validation
Backend MUST validate ALL inputs (defense-in-depth):
- Never trust client validation
- Validate file MIME types
- Check file size server-side
- Sanitize all strings
- Validate enum values

#### Implementation

This is backend responsibility, but frontend MUST assume server validates:

```typescript
// ✅ Correct: Assume backend validates
const file = await mediaService.uploadMedia(file);
// Backend will reject invalid files

// ✅ Correct: Handle validation errors
catch (error) {
  if (error instanceof ValidationError) {
    // Show details from backend validation
    showAlert(error.details.message);
  }
}
```

### Rule 3.3: Data Sanitization
- Input sanitization happens server-side
- Frontend trims whitespace and prevents injection
- Display user content safely (no innerHTML)

#### Implementation

```typescript
// ✅ Correct: Trim and display safely
const projectName = request.name.trim();
<Text>{project.name}</Text>

// ❌ Wrong: Using dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ❌ Wrong: Not trimming
const projectName = request.name; // Has leading/trailing spaces
```

---

## 4. Network Security

### Rule 4.1: HTTPS Only
- All API requests must use HTTPS
- Block HTTP fallback
- Use certificate pinning for sensitive operations (future)

#### Implementation

```typescript
// ✅ Correct: HTTPS URL
const API_BASE_URL = 'https://api.yourdomain.com/api/v1';

// ❌ Wrong: HTTP
const API_BASE_URL = 'http://api.yourdomain.com/api/v1';

// ✅ Correct: Environment variable with HTTPS
// .env
VITE_API_URL=https://api.yourdomain.com/api/v1
```

### Rule 4.2: CORS & CSP
- API must set CORS headers restricting to origin
- All endpoints require CORS validation
- Content Security Policy should be strict

#### Backend Implementation (NOT frontend code)

```typescript
// Backend MUST set:
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
res.setHeader('Access-Control-Allow-Credentials', 'true');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
```

### Rule 4.3: Request/Response Validation
- Validate content-type headers
- Reject unexpected response types
- Handle man-in-the-middle scenarios

#### Implementation

```typescript
// ✅ Correct: HttpClient validates
private async handleResponse<T>(response: Response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!isJson) {
    throw new NetworkError('Invalid response format');
  }
  // ... parse response
}
```

---

## 5. Data Handling Rules

### Rule 5.1: Media File Handling
- Never execute uploaded files
- Never display user file content directly
- Always use file extension validation
- Store files server-side with generated names

#### Implementation

```typescript
// ✅ Correct: Validate file before upload
const uploadMedia = async (file: File) => {
  validateFileType(file.name, file.type, ALLOWED_TYPES);
  validateFileSize(file.size, MAX_MB);

  // Backend stores with random name: uuid + .jpg
  // Not: user_project_photo.jpg
  return await mediaService.uploadMedia(file);
};

// ❌ Wrong: Trusting file extension
const fileName = file.name; // Could be anything.exe
```

### Rule 5.2: Sensitive Data
- Never log passwords or tokens
- Never include sensitive data in analytics
- Clear sensitive data on logout
- Use secure delete for cached files

#### Implementation

```typescript
// ✅ Correct: Secure logout
const logout = async () => {
  await authService.logout(); // Clears all tokens
  setUser(null);
  // Navigation handled by auth guard
};

// ❌ Wrong: Logging sensitive data
console.log('User:', { email, password }); // DO NOT DO THIS

// ✅ Correct: Sanitize for logging
console.log('User login', { email: '***@***.com' });
```

### Rule 5.3: Sensitive Operations
Define sensitive operations requiring re-confirmation:
- Deleting projects
- Changing email
- Changing password
- Downloading data export

#### Implementation

```typescript
// ✅ Correct: Confirm before delete
const handleDeleteProject = async () => {
  const confirmed = await showConfirmDialog(
    'Delete Project?',
    'This cannot be undone. All media will be deleted.'
  );

  if (confirmed) {
    await projectService.deleteProject(projectId);
  }
};
```

---

## 6. Error Handling Security

### Rule 6.1: User-Friendly Error Messages
- Never expose system errors to users
- Show generic message with actionable advice
- Log detailed errors server-side only

#### Implementation

```typescript
// ✅ Correct: User-friendly messages
const { errorMessage } = await signup.execute(data);
showAlert(errorMessage); // "Email already registered"

// ❌ Wrong: Exposing system details
catch (error) {
  showAlert(error.message); // "ENOENT: no such file or directory"
}

// ✅ Correct: Logging for debugging
console.warn('[API] Request failed:', {
  endpoint: '/projects',
  status: error.statusCode,
  // NOT: password, token, etc.
});
```

### Rule 6.2: Error Rate Limiting
- Track failed login attempts
- Block after N attempts (5)
- Show retry-after message
- Implement exponential backoff

#### Backend Implementation (frontend respects)

```typescript
// Frontend receives 429 Too Many Requests
catch (error) {
  if (error instanceof RateLimitError) {
    showAlert('Too many login attempts. Try again later.');
    // Auto-retry with delay
  }
}
```

### Rule 6.3: Error Disclosure
- Never reveal information about users
- Don't indicate if email exists in system
- Don't show file existence checks

#### Implementation

```typescript
// ✅ Correct: Generic response for both cases
// User found and wrong password: "Invalid email or password"
// User not found: "Invalid email or password"

// ❌ Wrong: Information disclosure
// "Email not found" - Attacker learns valid emails
// "File not found" - Reveals internal structure
```

---

## 7. Compliance & Best Practices

### Rule 7.1: Data Minimization
- Collect only necessary data
- V1 collects: email, password, project details, media files
- Don't request: location, contacts, calendar without need

#### Implementation

```typescript
// ✅ Correct: Minimal permissions
// Only request camera for capture mode
// Only request gallery for media upload

// ❌ Wrong: Requesting everything
// Requesting all device permissions on startup
```

### Rule 7.2: User Consent
- Explicit consent for data collection
- Clear privacy policy linked at signup
- Consent before processing (AI features)

#### Implementation

```typescript
// ✅ Correct: Explicit consent
<Checkbox
  label="I agree to the Terms of Service and Privacy Policy"
  value={agreedToTerms}
  onChange={setAgreedToTerms}
/>
<Button
  title="Create Account"
  disabled={!agreedToTerms}
  onPress={handleSignup}
/>
```

### Rule 7.3: Access Audit
- Log sensitive operations server-side
- Track failed authentication attempts
- Monitor for suspicious activity
- Regular security audits

#### Backend Implementation (frontend triggers)

```typescript
// Frontend makes requests, backend logs:
// DELETE /projects/:id -> userId, timestamp, IP
// POST /auth/login -> email, success/failure, IP
```

---

## 8. Security Checklist

### Pre-Launch

- [ ] All API endpoints require authentication
- [ ] Backend validates user ownership of resources
- [ ] Passwords validated with required strength
- [ ] File uploads validated by type and size
- [ ] Tokens stored securely (not AsyncStorage)
- [ ] HTTPS enforced for all requests
- [ ] CORS headers restrict to allowed origins
- [ ] Error messages don't expose system details
- [ ] Sensitive operations require confirmation
- [ ] Failed login attempts rate-limited
- [ ] No passwords/tokens logged
- [ ] Input validation on both client and server
- [ ] File executions prevented
- [ ] User data accessible only by owner

### Post-Launch

- [ ] Monitor error logs for security issues
- [ ] Track authentication failures
- [ ] Review user data handling practices
- [ ] Update dependencies regularly
- [ ] Security audit quarterly
- [ ] Incident response plan documented

---

## 7. Common Security Mistakes to Avoid

| Mistake | Risk | Solution |
|---------|------|----------|
| Storing token in AsyncStorage | Token compromise | Use Keychain/Keystore |
| Logging passwords | Exposure in logs | Never log sensitive data |
| HTTP URLs | Man-in-the-middle | Always use HTTPS |
| Trusting file extensions | Malware | Validate MIME types |
| Generic "Error" messages | Information disclosure | Show actionable messages |
| No rate limiting | Brute force attacks | Implement attempt limits |
| Client-only validation | Bypass | Validate server-side too |
| Storing PII on device | Data breach | Store on secure server |

---

## Questions?

If you have security questions:
1. Assume the worst (attacker controls network)
2. Design defensively (never trust client)
3. Ask: "Can an attacker abuse this?"
4. Default to secure, opt-in to convenience

Security is not optional. It's a feature.

