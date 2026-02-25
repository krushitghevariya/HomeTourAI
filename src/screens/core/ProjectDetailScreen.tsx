import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { Project } from '../../types';
import { NavBar }        from '../../components/molecules/NavBar';
import { ConfirmModal }  from '../../components/molecules/ConfirmModal';
import { StatusBadge }   from '../../components/atoms/StatusBadge';
import { Button }        from '../../components/atoms/Button';

type TabId = 'preview' | 'details' | 'export';

const TABS: { id: TabId; label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'details', label: 'Details' },
  { id: 'export',  label: 'Export' },
];

interface ProjectDetailScreenProps {
  project:       Project;
  onBack:        () => void;
  onExportPress: () => void;
  onARPress:     () => void;
  onRegenerate:  () => void;
  onDelete:      () => void;
  onCopyLink:    () => void;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  project, onBack, onExportPress, onARPress, onRegenerate, onDelete, onCopyLink,
}) => {
  const [activeTab,       setActiveTab]       = useState<TabId>('preview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRegenModal,  setShowRegenModal]  = useState(false);

  const DETAIL_ROWS = [
    { label: 'Created',  value: new Date(project.createdAt).toLocaleDateString() },
    { label: 'Mode',     value: project.mode },
    { label: 'Property', value: project.propertyType },
    { label: 'Rooms',    value: String(project.roomCount ?? '—') },
  ];

  return (
    <View style={styles.screen}>
      <NavBar
        title={project.name}
        onBackPress={onBack}
        rightElement={
          <TouchableOpacity style={styles.menuBtn}>
            <Text style={styles.menuIcon}>⋯</Text>
          </TouchableOpacity>
        }
      />

      <View style={[
        styles.statusBanner,
        project.status === 'failed' && styles.bannerFailed,
        project.status === 'ready'  && styles.bannerReady,
      ]}>
        <StatusBadge status={project.status} />
        {project.status === 'failed' && (
          <Button label="Retry" onPress={() => setShowRegenModal(true)} variant="ghost" fullWidth={false} style={styles.retryBtn} />
        )}
        {project.status === 'processing' && (
          <Text style={styles.processingHint}>AI is generating your tour…</Text>
        )}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.id} style={[styles.tab, activeTab === tab.id && styles.tabActive]} onPress={() => setActiveTab(tab.id)}>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {activeTab === 'preview' && (
          <View style={styles.viewer}>
            <Text style={styles.viewerIcon}>🔄</Text>
            <Text style={styles.viewerHint}>{project.status === 'ready' ? 'Drag to rotate panorama' : 'Tour not ready yet'}</Text>
          </View>
        )}

        {activeTab === 'details' && (
          <View style={styles.detailsBlock}>
            {DETAIL_ROWS.map(row => (
              <View key={row.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'export' && (
          <View style={styles.exportBlock}>
            <Button label="Export as MP4"  onPress={onExportPress} />
            <Button label="Preview in AR"  onPress={onARPress}     variant="secondary" />
            <View style={styles.shareLinkRow}>
              <Text style={styles.shareLink} numberOfLines={1}>{project.shareLink ?? 'Link not available yet'}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={onCopyLink} accessibilityLabel="Copy link">
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.dangerRow}>
        <Button label="Re-generate" onPress={() => setShowRegenModal(true)} variant="secondary" style={styles.dangerBtn} />
        <Button label="Delete"      onPress={() => setShowDeleteModal(true)} variant="danger"    style={styles.dangerBtn} />
      </View>

      <ConfirmModal visible={showDeleteModal} title="Delete project?" message="This will permanently remove the project and all associated files. This cannot be undone." confirmLabel="Delete" cancelLabel="Cancel" destructive onConfirm={onDelete} onCancel={() => setShowDeleteModal(false)} />
      <ConfirmModal visible={showRegenModal}  title="Re-generate tour?" message="This will start a new AI generation using the same media. The previous output will be replaced." confirmLabel="Re-generate" cancelLabel="Cancel" onConfirm={onRegenerate} onCancel={() => setShowRegenModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: Colors.background },
  menuBtn:        { padding: Spacing.xs },
  menuIcon:       { fontSize: 22, color: Colors.gray700 },
  statusBanner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, backgroundColor: Colors.infoLight, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  bannerFailed:   { backgroundColor: Colors.errorLight },
  bannerReady:    { backgroundColor: Colors.successLight },
  processingHint: { fontSize: Typography.size.sm, color: Colors.info },
  retryBtn:       { paddingHorizontal: Spacing.base, height: 36 },
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.gray200, backgroundColor: Colors.surface },
  tab:            { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabLabel:       { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.gray500 },
  tabLabelActive: { color: Colors.primary },
  body:           { padding: Spacing.base },
  viewer:         { height: 280, backgroundColor: Colors.gray800, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  viewerIcon:     { fontSize: 56 },
  viewerHint:     { fontSize: Typography.size.sm, color: Colors.white, opacity: 0.7 },
  detailsBlock:   { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  detailLabel:    { fontSize: Typography.size.base, color: Colors.gray500 },
  detailValue:    { fontSize: Typography.size.base, fontWeight: Typography.weight.medium, color: Colors.gray900 },
  exportBlock:    { gap: Spacing.md },
  shareLinkRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray100, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
  shareLink:      { flex: 1, fontSize: Typography.size.sm, color: Colors.gray600 },
  copyBtn:        { padding: Spacing.xs },
  copyIcon:       { fontSize: 18 },
  dangerRow:      { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingBottom: 28, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100, backgroundColor: Colors.surface, gap: Spacing.sm },
  dangerBtn:      { flex: 1 },
});
