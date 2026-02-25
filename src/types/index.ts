// ─── Domain Types ─────────────────────────────────────────────────────────────

export type ProjectStatus  = 'processing' | 'ready' | 'failed';
export type GenerationMode = 'photos' | 'video' | 'live';
export type PropertyType   = 'apartment' | 'villa' | 'office' | 'other';
export type RoomType       = 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'other';

export interface Project {
  id:           string;
  name:         string;
  propertyType: PropertyType;
  mode:         GenerationMode;
  status:       ProjectStatus;
  createdAt:    string;
  updatedAt:    string;
  thumbnailUri?: string;
  roomCount?:   number;
  outputUri?:   string;
  shareLink?:   string;
  fileSize?:    number;
  duration?:    number;
  resolution?:  string;
  errorMessage?: string;
}

export interface Room {
  id:     string;
  type:   RoomType;
  label:  string;
  photos: PhotoAsset[];
}

export interface PhotoAsset {
  id:       string;
  uri:      string;
  width:    number;
  height:   number;
  fileSize: number;
  isBlurry?: boolean;
}

export interface VideoAsset {
  uri:        string;
  duration:   number;
  fileSize:   number;
  width:      number;
  height:     number;
  isVertical: boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id:                string;
  fullName:          string;
  email:             string;
  avatarUri?:        string;
  storageUsedBytes:  number;
  storageLimitBytes: number;
}

// ─── Navigation Param List ────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash:          undefined;
  SignUp:          undefined;
  Login:           undefined;
  Dashboard:       undefined;
  NewProjectSetup: undefined;
  UploadPhotos:    { projectId: string };
  UploadVideo:     { projectId: string };
  LiveCapture:     { projectId: string };
  Processing:      { projectId: string };
  ProjectDetail:   { projectId: string };
  ARVisualization: { projectId: string };
  ExportShare:     { projectId: string };
  Settings:        undefined;
};

// ─── Component Prop Helpers ───────────────────────────────────────────────────

export type ToastVariant  = 'info' | 'success' | 'warning' | 'error';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type BadgeStatus   = ProjectStatus;
