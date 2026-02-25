import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../theme';
import { Project } from '../../types';
import { StatusBadge } from '../atoms/StatusBadge';

interface ProjectCardProps {
  project:      Project;
  onPress:      (id: string) => void;
  onLongPress?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress, onLongPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress(project.id)}
    onLongPress={() => onLongPress?.(project.id)}
    activeOpacity={0.8}
    accessibilityRole="button"
  >
    <View style={styles.thumbnailContainer}>
      {project.thumbnailUri ? (
        <Image source={{ uri: project.thumbnailUri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailIcon}>🏠</Text>
        </View>
      )}
      <View style={styles.badgeOverlay}>
        <StatusBadge status={project.status} />
      </View>
    </View>
    <View style={styles.info}>
      <Text style={styles.name} numberOfLines={1}>{project.name}</Text>
      <Text style={styles.meta}>{new Date(project.createdAt).toLocaleDateString()}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card:                { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', flex: 1, margin: Spacing.xs, ...Shadow.sm },
  thumbnailContainer:  { height: 140, backgroundColor: Colors.gray100 },
  thumbnail:           { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbnailPlaceholder:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray100 },
  thumbnailIcon:       { fontSize: 36 },
  badgeOverlay:        { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  info:                { padding: Spacing.md },
  name:                { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.gray900, marginBottom: Spacing.xs },
  meta:                { fontSize: Typography.size.xs, color: Colors.gray500 },
});
