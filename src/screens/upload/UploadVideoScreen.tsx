import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../theme';
import { VideoAsset } from '../../types';
import { NavBar }      from '../../components/molecules/NavBar';
import { DropZone }    from '../../components/molecules/DropZone';
import { TipsCard }    from '../../components/molecules/TipsCard';
import { ProgressBar } from '../../components/atoms/ProgressBar';
import { Button }      from '../../components/atoms/Button';

const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface UploadVideoScreenProps {
  onBack:      () => void;
  onGenerate:  (video: VideoAsset) => void;
  onPickVideo: () => Promise<VideoAsset | null>;
}

export const UploadVideoScreen: React.FC<UploadVideoScreenProps> = ({ onBack, onGenerate, onPickVideo }) => {
  const [video, setVideo] = useState<VideoAsset | null>(null);

  const handlePick = async () => {
    const picked = await onPickVideo();
    if (picked) setVideo(picked);
  };

  return (
    <View style={styles.screen}>
      <NavBar title="Upload Video" onBackPress={onBack} />
      <View style={styles.progress}>
        <ProgressBar currentStep={2} totalSteps={3} />
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {!video ? (
          <DropZone accept="video" onPress={handlePick} />
        ) : (
          <View style={styles.previewCard}>
            <View style={styles.videoThumb}>
              <Text style={styles.videoIcon}>🎬</Text>
              {video.isVertical && (
                <View style={styles.warningPill}>
                  <Text style={styles.warningText}>Landscape recommended</Text>
                </View>
              )}
            </View>
            <View style={styles.videoMeta}>
              <Text style={styles.metaRow}>⏱ {formatDuration(video.duration)}</Text>
              <Text style={styles.metaRow}>💾 {formatFileSize(video.fileSize)}</Text>
              <Text style={styles.metaRow}>📐 {video.width} × {video.height}</Text>
            </View>
            <TouchableOpacity style={styles.replaceBtn} onPress={handlePick}>
              <Text style={styles.replaceBtnText}>Replace video</Text>
            </TouchableOpacity>
          </View>
        )}

        <TipsCard tip="Film slowly and cover all corners of each room for best results." />

        <Button
          label="Generate 360 Tour"
          onPress={() => video && onGenerate(video)}
          disabled={!video}
          style={styles.cta}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.background },
  progress:     { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  body:         { paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.base },
  previewCard:  { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  videoThumb:   { height: 180, backgroundColor: Colors.gray800, alignItems: 'center', justifyContent: 'center' },
  videoIcon:    { fontSize: 48 },
  warningPill:  { position: 'absolute', bottom: Spacing.sm, backgroundColor: Colors.warning, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  warningText:  { color: Colors.white, fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  videoMeta:    { padding: Spacing.base, gap: Spacing.xs },
  metaRow:      { fontSize: Typography.size.sm, color: Colors.gray600 },
  replaceBtn:   { marginHorizontal: Spacing.base, marginBottom: Spacing.base, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100, alignItems: 'center' },
  replaceBtnText:{ fontSize: Typography.size.sm, color: Colors.gray700, fontWeight: Typography.weight.medium },
  cta:          { marginTop: Spacing.sm },
});
