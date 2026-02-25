import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../theme';
import { Project } from '../../types';
import { NavBar }  from '../../components/molecules/NavBar';
import { Button }  from '../../components/atoms/Button';

const formatFileSize = (bytes?: number) =>
  bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : '—';

const formatDuration = (seconds?: number) => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface ExportShareScreenProps {
  project:      Project;
  onBack:       () => void;
  onSaveToDevice: () => void;
  onCopyLink:   () => void;
  onShare:      () => void;
  onDone:       () => void;
}

export const ExportShareScreen: React.FC<ExportShareScreenProps> = ({
  project, onBack, onSaveToDevice, onCopyLink, onShare, onDone,
}) => {
  const INFO_ROWS = [
    { label: 'Resolution', value: project.resolution ?? '—' },
    { label: 'File size',  value: formatFileSize(project.fileSize) },
    { label: 'Duration',   value: formatDuration(project.duration) },
  ];

  const EXPORT_OPTIONS = [
    { icon: '💾', label: 'Save to Device', onPress: onSaveToDevice },
    { icon: '📋', label: 'Copy Link',      onPress: onCopyLink },
    { icon: '↗️', label: 'Share via…',     onPress: onShare },
  ];

  return (
    <View style={styles.screen}>
      <NavBar title="Export" onBackPress={onBack} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.thumb}>
          <Text style={styles.thumbIcon}>🎬</Text>
        </View>

        <View style={styles.infoCard}>
          {INFO_ROWS.map(row => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.options}>
          {EXPORT_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.label} style={styles.option} onPress={opt.onPress}>
              <Text style={styles.optionIcon}>{opt.icon}</Text>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.shareLinkRow}>
          <Text style={styles.shareLinkLabel} numberOfLines={1}>
            {project.shareLink ?? 'Generating link…'}
          </Text>
          <TouchableOpacity onPress={onCopyLink} style={styles.copyBtn}>
            <Text style={styles.copyLabel}>Copy</Text>
          </TouchableOpacity>
        </View>

        <Button label="Done" onPress={onDone} style={styles.doneBtn} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: Colors.background },
  body:           { paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.base },
  thumb:          { height: 200, backgroundColor: Colors.gray800, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  thumbIcon:      { fontSize: 56 },
  infoCard:       { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  infoLabel:      { fontSize: Typography.size.base, color: Colors.gray500 },
  infoValue:      { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.gray900 },
  options:        { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  option:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.gray100, gap: Spacing.md },
  optionIcon:     { fontSize: 20 },
  optionLabel:    { flex: 1, fontSize: Typography.size.base, color: Colors.gray900 },
  chevron:        { fontSize: Typography.size.xl, color: Colors.gray400 },
  shareLinkRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray100, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
  shareLinkLabel: { flex: 1, fontSize: Typography.size.sm, color: Colors.gray600 },
  copyBtn:        { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary },
  copyLabel:      { color: Colors.white, fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  doneBtn:        { marginTop: Spacing.sm },
});
