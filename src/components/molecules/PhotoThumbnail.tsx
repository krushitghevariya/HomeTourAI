import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { PhotoAsset } from '../../types';

interface PhotoThumbnailProps {
  photo:    PhotoAsset;
  onDelete: (id: string) => void;
  onPress:  (photo: PhotoAsset) => void;
}

export const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({ photo, onDelete, onPress }) => (
  <View style={styles.container}>
    <TouchableOpacity onPress={() => onPress(photo)} activeOpacity={0.8}>
      <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
      {photo.isBlurry && (
        <View style={styles.blurWarning}>
          <Text style={styles.blurIcon}>⚠️</Text>
        </View>
      )}
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => onDelete(photo.id)}
      accessibilityLabel="Delete photo"
      hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
    >
      <Text style={styles.deleteIcon}>✕</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container:   { margin: Spacing.xs, borderRadius: BorderRadius.md, overflow: 'visible' },
  image:       { width: '100%', aspectRatio: 1, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100 },
  blurWarning: { position: 'absolute', bottom: Spacing.xs, left: Spacing.xs },
  blurIcon:    { fontSize: 14 },
  deleteBtn:   { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
  deleteIcon:  { fontSize: 10, color: Colors.white, fontWeight: '700' },
});
