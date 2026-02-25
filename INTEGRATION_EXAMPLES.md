# Integration Examples - Backend Implementation

This guide shows how to integrate the backend with existing screens using the new API layer.

---

## Example 1: LoginScreen Integration

### Before (No Backend)

```typescript
// ❌ Current: No backend integration
interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onSignUpPress: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onSignUpPress,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // No actual authentication
  const handleLogin = () => {
    onLoginSuccess({ id: '1', email });
  };

  return (
    <View>
      <TextField value={email} onChange={setEmail} placeholder="Email" />
      <TextField value={password} onChange={setPassword} placeholder="Password" />
      <Button title="Login" onPress={handleLogin} />
      <InlineLink onPress={onSignUpPress}>Create Account</InlineLink>
    </View>
  );
};
```

### After (With Backend)

```typescript
import { useAuth } from '@/hooks';
import { validateEmail } from '@/api/middleware';
import { ValidationError } from '@/api/errors';
import { Toast } from '@/components';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    login: { execute: loginUser, loading, error: loginError },
    user,
  } = useAuth();

  // Auto-redirect on successful login
  useEffect(() => {
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    }
  }, [user, navigation]);

  const handleLogin = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate inputs
    try {
      validateEmail(email);
      if (!password) {
        throw new ValidationError('Password is required');
      }
    } catch (error) {
      if (error instanceof ValidationError && error.details?.field) {
        setFieldErrors({
          [error.details.field]: error.message,
        });
      } else {
        Toast.show({
          message: error instanceof Error ? error.message : 'Validation failed',
          type: 'error',
        });
      }
      return;
    }

    // Call backend
    const result = await loginUser({
      email: email.trim(),
      password,
    });

    if (!result && loginError) {
      Toast.show({
        message: loginError,
        type: 'error',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextField
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="user@example.com"
        error={fieldErrors.email}
        editable={!loading}
      />

      <TextField
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        secureTextEntry
        error={fieldErrors.password}
        editable={!loading}
      />

      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />

      <InlineLink onPress={() => navigation.navigate('SignUp')}>
        Don't have an account? Sign up
      </InlineLink>
    </View>
  );
};
```

---

## Example 2: DashboardScreen Integration

### Before (No Backend)

```typescript
// ❌ Current: Hardcoded data
interface DashboardScreenProps {
  projects: Project[];
  onProjectPress: (id: string) => void;
  onNewProject: () => void;
  // ... 5+ more props
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  projects = [],
  onProjectPress,
  onNewProject,
}) => {
  return (
    <FlatList
      data={projects}
      renderItem={({ item }) => (
        <ProjectCard project={item} onPress={() => onProjectPress(item.id)} />
      )}
    />
  );
};
```

### After (With Backend)

```typescript
import { useProjects } from '@/hooks';
import { useAuth } from '@/hooks';
import { Toast } from '@/components';

export const DashboardScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const {
    projects,
    loading,
    error,
    fetchProjects,
    createProject: { execute: createNewProject, loading: createLoading },
  } = useProjects();

  // Load projects on screen focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchProjects();
      }
    }, [isAuthenticated, fetchProjects])
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [isAuthenticated, navigation]);

  const handleCreateProject = async () => {
    const result = await createNewProject({
      name: 'New Project',
      propertyType: 'apartment',
    });

    if (result) {
      Toast.show({
        message: 'Project created',
        type: 'success',
      });
      navigation.navigate('ProjectDetail', { projectId: result.id });
    }
  };

  const handleRefresh = async () => {
    await fetchProjects();
  };

  const handleProjectPress = (projectId: string) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  if (loading) {
    return <ProgressBar />;
  }

  if (error) {
    return (
      <EmptyState
        icon="error"
        headline="Failed to load projects"
        message={error}
        ctaLabel="Retry"
        onCtaPress={handleRefresh}
      />
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        headline="No projects yet"
        message="Create your first project to get started"
        ctaLabel="New Project"
        onCtaPress={handleCreateProject}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => handleProjectPress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={handleRefresh}
      />

      <FABButton
        title="+"
        onPress={handleCreateProject}
        disabled={createLoading}
      />
    </View>
  );
};
```

---

## Example 3: UploadPhotosScreen Integration

### Before (No Backend)

```typescript
// ❌ Current: No upload logic
export const UploadPhotosScreen = ({ onPhotosSelected }) => {
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);

  const handleAddPhoto = async () => {
    // No actual upload
    const result = await pickImage();
    setPhotos([...photos, result]);
  };

  return (
    <View>
      <FlatList data={photos} renderItem={PhotoThumbnail} />
      <Button title="Add Photo" onPress={handleAddPhoto} />
    </View>
  );
};
```

### After (With Backend)

```typescript
import { useMedia } from '@/hooks';
import { useRoute } from '@react-navigation/native';
import { Toast } from '@/components';

export const UploadPhotosScreen = ({ navigation, route }) => {
  const { projectId } = route.params;
  const [activeRoom, setActiveRoom] = useState('living_room');

  const {
    mediaFiles,
    uploadProgress,
    fetchMedia,
    uploadMedia: { execute: uploadFile, loading: uploading },
    deleteMedia: { execute: deleteFile, loading: deleting },
    validateMedia: { execute: validateFiles },
  } = useMedia(projectId);

  // Load existing media
  useEffect(() => {
    fetchMedia();
  }, [projectId]);

  const handlePickImage = async () => {
    const result = await launchImageLibrary();

    if (result.assets?.[0]) {
      const asset = result.assets[0];

      // Validate file before upload
      try {
        const file: File = {
          uri: asset.uri,
          name: asset.fileName || `photo-${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 0,
        };

        // Upload starts
        await uploadFile({
          file,
          fileType: 'image',
          projectId,
        });

        Toast.show({
          message: 'Photo uploaded',
          type: 'success',
        });
      } catch (error) {
        Toast.show({
          message: error instanceof Error ? error.message : 'Upload failed',
          type: 'error',
        });
      }
    }
  };

  const handleDeletePhoto = async (mediaId: string) => {
    const confirmed = await showConfirmDialog(
      'Delete Photo?',
      'This cannot be undone.'
    );

    if (confirmed) {
      await deleteFile(mediaId);
      Toast.show({ message: 'Photo deleted', type: 'success' });
    }
  };

  const handleValidateAndContinue = async () => {
    try {
      const validation = await validateFiles();

      if (!validation?.isValid) {
        const issues = validation?.issues || [];
        const errors = issues.filter((i) => i.type === 'error');

        if (errors.length > 0) {
          Toast.show({
            message: errors[0].message,
            type: 'error',
          });
          return;
        }

        const warnings = issues.filter((i) => i.type === 'warning');
        if (warnings.length > 0) {
          const confirmed = await showConfirmDialog(
            'Quality Issues',
            warnings.map((w) => w.message).join('\n') + '\n\nContinue anyway?'
          );

          if (!confirmed) return;
        }
      }

      navigation.navigate('Processing', { projectId });
    } catch (error) {
      Toast.show({
        message: error instanceof Error ? error.message : 'Validation failed',
        type: 'error',
      });
    }
  };

  const roomPhotos = mediaFiles.filter((m) => m.fileType === 'image');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Photos</Text>

      {roomPhotos.length === 0 ? (
        <DropZone
          onPress={handlePickImage}
          loading={uploading}
          icon="image"
          text="Drag photos or tap to upload"
        />
      ) : (
        <FlatList
          data={roomPhotos}
          renderItem={({ item }) => (
            <View style={styles.photoItem}>
              <PhotoThumbnail
                photo={item}
                onDelete={() => handleDeletePhoto(item.id)}
              />
              {uploadProgress[item.id] !== undefined &&
                uploadProgress[item.id] < 100 && (
                  <ProgressBar
                    progress={uploadProgress[item.id]}
                    label={`${Math.round(uploadProgress[item.id])}%`}
                  />
                )}
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      <Button
        title={uploading ? 'Uploading...' : 'Add More Photos'}
        onPress={handlePickImage}
        disabled={uploading}
      />

      <Button
        title="Continue to Generation"
        onPress={handleValidateAndContinue}
        disabled={roomPhotos.length === 0 || uploading}
      />
    </View>
  );
};
```

---

## Example 4: ProcessingScreen Integration

### Before (No Backend)

```typescript
// ❌ Current: Fake progress
export const ProcessingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p < 100 ? p + 10 : 100));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <ProgressBar progress={progress} />
      <Text>Processing...</Text>
    </View>
  );
};
```

### After (With Backend)

```typescript
import { useGeneration } from '@/hooks';
import { useRoute } from '@react-navigation/native';

const TIPS = [
  'Tip: Ensure good lighting for better results',
  'Tip: Keep photos in sequence for better stitching',
  // ... more tips
];

export const ProcessingScreen = ({ navigation, route }) => {
  const { projectId } = route.params;
  const [tipIndex, setTipIndex] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const {
    currentJob,
    jobProgress,
    jobStatus,
    loading: startLoading,
    startGeneration: { execute: startGen },
    stopPolling,
  } = useGeneration();

  // Start generation on mount
  useEffect(() => {
    const startGeneration = async () => {
      await startGen({
        projectId,
        generationType: 'tour_360',
        config: {
          stitchingQuality: 'high',
          enableStabilization: true,
          enableBrightnessCorrection: true,
        },
      });
    };

    startGeneration();

    return () => {
      stopPolling();
    };
  }, [projectId]);

  // Cycle tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 5000);

    return () => clearInterval(tipInterval);
  }, []);

  // Animate spinner
  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    rotation.start();

    return () => rotation.stop();
  }, []);

  // Handle completion
  useEffect(() => {
    if (jobStatus === 'completed') {
      stopPolling();
      setTimeout(() => {
        navigation.navigate('ProjectDetail', { projectId });
      }, 1000);
    } else if (jobStatus === 'failed') {
      stopPolling();
      Toast.show({
        message: currentJob?.errorMessage || 'Generation failed',
        type: 'error',
      });

      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    }
  }, [jobStatus, projectId]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const estimatedRemaining = currentJob?.estimatedDuration
    ? Math.max(0, currentJob.estimatedDuration - (currentJob.progressPercentage / 100) * currentJob.estimatedDuration)
    : null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
        <Icon name="refresh-cw" size={48} color={Colors.primary} />
      </Animated.View>

      <Text style={styles.title}>Generating 360 Tour</Text>

      <ProgressBar progress={jobProgress} />

      <Text style={styles.progressText}>
        {jobProgress}% - {jobStatus}
      </Text>

      {estimatedRemaining && (
        <Text style={styles.timeRemaining}>
          Est. {Math.round(estimatedRemaining / 60)}m remaining
        </Text>
      )}

      <TipsCard
        title={TIPS[tipIndex].split(': ')[0]}
        content={TIPS[tipIndex].split(': ')[1]}
      />

      {jobStatus === 'failed' && currentJob?.errorMessage && (
        <Text style={styles.error}>{currentJob.errorMessage}</Text>
      )}
    </View>
  );
};
```

---

## Integration Patterns

### Pattern 1: Load Data on Mount

```typescript
useEffect(() => {
  fetchProjects();
}, []); // Load once on mount

// OR: Load on focus
useFocusEffect(
  useCallback(() => {
    fetchProjects();
  }, [fetchProjects])
);
```

### Pattern 2: Error with Retry

```typescript
{error && (
  <EmptyState
    icon="error"
    headline="Failed to Load"
    message={error}
    ctaLabel="Retry"
    onCtaPress={() => fetchProjects()}
  />
)}
```

### Pattern 3: Long-Running Job

```typescript
const { startGeneration, stopPolling, resetJob } = useGeneration();

// Start job (auto-polls)
await startGeneration.execute({ ... });

// Monitor progress
<ProgressBar progress={jobProgress} />

// Cleanup on unmount
useEffect(() => {
  return () => {
    stopPolling();
    resetJob();
  };
}, []);
```

### Pattern 4: File Upload with Progress

```typescript
const { uploadMedia, getUploadProgress } = useMedia(projectId);

// Upload file
await uploadMedia.execute({ file, fileType: 'image', projectId });

// Show progress
<ProgressBar progress={getUploadProgress(file.name)} />
```

---

## Migration Checklist

When converting a screen from mock to real backend:

- [ ] Import hooks: `useAuth`, `useProjects`, `useMedia`, `useGeneration`
- [ ] Remove hardcoded data
- [ ] Remove navigation props, use `navigation` from route
- [ ] Load data on mount with `useEffect` + `useFocusEffect`
- [ ] Display loading states
- [ ] Display error states with retry
- [ ] Validate inputs before API calls
- [ ] Handle API errors with Toast messages
- [ ] Redirect on auth errors
- [ ] Clean up subscriptions/polling on unmount

