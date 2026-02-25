import React from 'react';
import {
  View, FlatList, ScrollView, Text,
  TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { Project } from '../../types';
import { NavBar }      from '../../components/molecules/NavBar';
import { ProjectCard } from '../../components/molecules/ProjectCard';
import { FABButton }   from '../../components/molecules/FABButton';
import { EmptyState }  from '../../components/molecules/EmptyState';

const QUICK_ACTIONS = [
  { id: 'photos', label: '📷 Upload Photos' },
  { id: 'video',  label: '🎬 Upload Video' },
  { id: 'live',   label: '📡 Capture Live' },
];

interface DashboardScreenProps {
  projects:        Project[];
  loading:         boolean;
  onProjectPress:  (id: string) => void;
  onNewProject:    () => void;
  onQuickAction:   (action: string) => void;
  onAvatarPress:   () => void;
  onRefresh:       () => void;
  errorMessage?:   string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  projects, loading, onProjectPress, onNewProject,
  onQuickAction, onAvatarPress, onRefresh, errorMessage,
}) => {
  // Chunk into rows of 2 for grid layout
  const rows: Project[][] = [];
  for (let i = 0; i < projects.length; i += 2) {
    rows.push(projects.slice(i, i + 2));
  }

  const isEmpty = !loading && projects.length === 0;

  return (
    <View style={styles.screen}>
      <NavBar logoMode onAvatarPress={onAvatarPress} />

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.map(project => (
              <View key={project.id} style={styles.cardWrapper}>
                <ProjectCard project={project} onPress={onProjectPress} />
              </View>
            ))}
            {item.length === 1 && <View style={styles.cardWrapper} />}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow} contentContainerStyle={styles.pillContent}>
              {QUICK_ACTIONS.map(a => (
                <TouchableOpacity key={a.id} style={styles.pill} onPress={() => onQuickAction(a.id)}>
                  <Text style={styles.pillLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.sectionTitle}>My Projects</Text>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="🏘️"
              headline="No projects yet"
              subtext="Create your first virtual tour and bring your property to life."
              ctaLabel="Create your first tour"
              onCtaPress={onNewProject}
            />
          ) : null
        }
        contentContainerStyle={[styles.list, isEmpty && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
      />

      <FABButton onPress={onNewProject} label="New Project" />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.background },
  errorBanner:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.errorLight, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  errorText:    { fontSize: Typography.size.sm, color: Colors.error },
  retryText:    { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: Typography.weight.semibold },
  list:         { paddingHorizontal: Spacing.sm, paddingBottom: 100 },
  listEmpty:    { flex: 1 },
  sectionTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.gray900, marginTop: Spacing.base, marginBottom: Spacing.sm, paddingHorizontal: Spacing.sm },
  pillRow:      { marginBottom: Spacing.sm },
  pillContent:  { paddingHorizontal: Spacing.sm, gap: Spacing.sm },
  pill:         { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: 999, backgroundColor: Colors.primaryLight },
  pillLabel:    { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.primary },
  row:          { flexDirection: 'row' },
  cardWrapper:  { flex: 1 },
});
