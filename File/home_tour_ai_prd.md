# Product Requirement Document (PRD)

## Product Name (Working Title)
HomeTour AI

---

# 1. Problem Statement

Real estate agents, builders, and homeowners struggle to create immersive property experiences without expensive equipment, professional editors, or 360° cameras.

Current problems:
- Raw photos and videos look unprofessional.
- 360° tours require specialized cameras and tools.
- AR visualization tools are complex and fragmented.
- Editing takes too long and requires skill.

There is a need for a simple application that converts raw property photos/videos into immersive 360° video tours and basic AR visual previews using AI automation.

---

# 2. Target Users

## Primary Users (V1 Focus)

### 1. Real Estate Agents
- Need quick property tour content
- Non-technical users
- Want fast turnaround for listings

### 2. Builders / Developers
- Showcase new or under-construction projects
- Need immersive marketing visuals

### 3. Homeowners (Independent Sellers)
- Want affordable virtual tours
- Limited technical knowledge

---

# 3. Core User Flows

## Flow 1: Upload → Generate 360 Video

1. User signs up / logs in
2. Creates a new project
3. Uploads:
   - Photos (room-wise)
   - OR raw walkthrough video
4. Selects property type (apartment, villa, office)
5. Clicks “Generate 360 Tour”
6. AI processing:
   - Stitches images or enhances video
   - Creates simulated 360 panoramic scenes
   - Adds smooth transitions between rooms
   - Applies brightness correction and stabilization
7. User previews the result
8. Exports:
   - 360 MP4 video
   - Shareable web viewer link

---

## Flow 2: Real-Time Capture Mode

1. User selects “Capture Tour”
2. App provides guided instructions:
   - “Stand in center of room”
   - “Slowly rotate phone”
3. App captures panoramic data
4. AI auto-stitches into 360 format
5. User previews and exports final video

---

## Flow 3: Basic AR Visualization

1. User uploads room photos
2. System detects floor and wall surfaces
3. User selects from preloaded furniture models (3–5 items)
4. Places virtual objects in room
5. Records AR session
6. Exports short AR preview video

V1 AR is basic surface placement (not advanced spatial mapping).

---

# 4. Feature List

## MVP Features (V1)

### 1. User & Project Management
- Email-based authentication
- Create / delete projects
- Limited project storage per user

### 2. Media Upload
- Upload JPEG / PNG photos
- Upload MP4 video
- File size limits
- Basic upload validation

### 3. AI 360 Tour Generation
- Auto image stitching
- Basic panorama simulation from video
- Room transition animation
- Auto brightness correction
- Basic video stabilization

### 4. 360 Video Output
- Export as 360 MP4
- Shareable web link
- Mobile-compatible viewer

### 5. Real-Time Panorama Capture
- Guided capture UI
- Gyroscope-assisted rotation detection
- Automatic stitching

### 6. Basic AR Visualization
- Flat surface detection
- 3–5 preloaded furniture models
- AR recording
- Export AR clip

### 7. Simple 360 Viewer
- Drag-to-rotate interaction
- Web-based viewer
- Mobile responsive

---

## Future Features (Post-V1)

- Full 3D dollhouse model
- AI-powered realistic virtual staging
- Agent branding customization
- Automatic floor plan generation
- AI voice narration
- Multi-user collaboration
- MLS integration
- Advanced LiDAR scanning
- VR headset support
- Analytics dashboard
- CRM integration

---

# 5. Edge Cases

## Media Issues
- Low-resolution images
- Blurry videos
- Mixed lighting conditions
- Too few images uploaded
- Vertical-only videos
- Oversized files

## AI Processing Issues
- Stitching misalignment
- Distorted panorama output
- Incorrect AR surface detection
- Empty rooms with insufficient feature points

## Device Limitations
- Devices without AR support
- No gyroscope sensor
- Low RAM or storage

## User Errors
- Uploading incorrect media
- Rotating too fast during capture
- Incomplete room coverage

System must provide:
- Clear error messages
- Capture guidance prompts
- Re-upload recommendations if quality is too low

---

# 6. Non-Goals (V1 Focus)

- Not building a full 3D modeling engine
- Not replacing professional 3D scanning platforms
- Not creating ultra-precise architectural measurements
- Not offering high-end photorealistic staging
- Not building enterprise analytics
- Not supporting VR hardware initially

V1 focuses on simplicity, automation, and usability.

---

# 7. Technical Assumptions (High-Level)

- Mobile-first application (React Native or Flutter)
- Backend: Node.js or Python
- AI processing for panorama stitching and basic depth estimation
- Cloud storage for media files
- WebGL-based 360 viewer

---

# 8. Success Metrics

## Product Metrics
- Tour generation time under 5 minutes
- 80% successful generation rate
- Less than 10% stitching failure rate

## User Metrics
- 70% of users complete their first tour
- Average 2+ projects per user in first week
- 40% export/share rate

## Business Metrics
- Controlled cost per generation
- 30% conversion to paid plan (if freemium model)

---

# 9. V1 Scope Summary

V1 delivers:
- Upload raw property media
- Convert into AI-generated 360 tour video
- Real-time guided capture
- Basic AR furniture placement
- Export and share functionality

No advanced 3D modeling, VR support, or enterprise integrations in V1.

