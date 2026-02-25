import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { Room, PhotoAsset, RoomType } from '../../types';
import { NavBar }          from '../../components/molecules/NavBar';
import { DropZone }        from '../../components/molecules/DropZone';
import { PhotoThumbnail }  from '../../components/molecules/PhotoThumbnail';
import { ProgressBar }     from '../../components/atoms/ProgressBar';
import { Button }          from '../../components/atoms/Button';

type RoomsMap = Record<RoomType, PhotoAsset[]>;

const DEFAULT_ROOMS: { type: RoomType; label: string }[] = [
  { type: 'living_room', label: 'Living Room' },
  { type: 'bedroom',     label: 'Bedroom' },
  { type: 'kitchen',     label: 'Kitchen' },
  { type: 'bathroom',    label: 'Bathroom' },
  { type: 'other',       label: 'Other' },
];

const EMPTY_ROOMS: RoomsMap = {
  living_room: [], bedroom: [], kitchen: [], bathroom: [], other: [],
};

interface UploadPhotosScreenProps {
  projectId:     string;
  onBack:        () => void;
  onGenerate:    (rooms: Room[]) => void;
  onAddPhotos:   (roomType: RoomType) => Promise<PhotoAsset[]>;
  onPhotoPreview:(photo: PhotoAsset) => void;
}

export const UploadPhotosScreen: React.FC<UploadPhotosScreenProps> = ({
  onBack, onGenerate, onAddPhotos, onPhotoPreview,
}) => {
  const [activeRoom, setActiveRoom] = useState<RoomType>('living_room');
  const [rooms,      setRooms]      = useState<RoomsMap>(EMPTY_ROOMS);

  const handleAddPhotos = async () => {
    const newPhotos = await onAddPhotos(activeRoom);
    setRooms(prev => ({ ...prev, [activeRoom]: [...prev[activeRoom], ...newPhotos] }));
  };

  const handleDeletePhoto = (photoId: string) => {
    setRooms(prev => ({ ...prev, [activeRoom]: prev[activeRoom].filter(p => p.id !== photoId) }));
  };

  const totalPhotos   = Object.values(rooms).flat().length;
  const currentPhotos = rooms[activeRoom];

  const buildRooms = (): Room[] =>
    DEFAULT_ROOMS
      .filter(r => rooms[r.type].length > 0)
      .map(r => ({ id: r.type, type: r.type, label: r.label, photos: rooms[r.type] }));

  return (
    <View style={styles.screen}>
      <NavBar title="Upload Photos" onBackPress={onBack} />
      <View style={styles.progress}>
        <ProgressBar currentStep={2} totalSteps={3} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {DEFAULT_ROOMS.map(room => {
          const count      = rooms[room.type].length;
          const hasWarning = count === 1;
          return (
            <TouchableOpacity
              key={room.type}
              style={[styles.tab, activeRoom === room.type && styles.tabActive]}
              onPress={() => setActiveRoom(room.type)}
            >
              <Text style={[styles.tabLabel, activeRoom === room.type && styles.tabLabelActive]}>
                {room.label}
              </Text>
              {count > 0 && (
                <View style={[styles.countBadge, hasWarning && styles.countBadgeWarning]}>
                  <Text style={styles.countText}>{hasWarning ? '⚠' : count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={currentPhotos}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.photoGrid}
        ListHeaderComponent={
          <View style={styles.dropZoneContainer}>
            <DropZone accept="images" onPress={handleAddPhotos} hint="Add photos for this room (min. 2)" />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.photoCell}>
            <PhotoThumbnail photo={item} onDelete={handleDeletePhoto} onPress={onPhotoPreview} />
          </View>
        )}
        ListFooterComponent={<View style={styles.listFooterSpacer} />}
      />

      <View style={styles.footer}>
        <Text style={styles.countLabel}>{totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} total</Text>
        <Button label="Generate 360 Tour" onPress={() => onGenerate(buildRooms())} disabled={totalPhotos === 0} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:             { flex: 1, backgroundColor: Colors.background },
  progress:           { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  tabs:               { flexGrow: 0 },
  tabsContent:        { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.xs },
  tab:                { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.gray100, gap: Spacing.xs },
  tabActive:          { backgroundColor: Colors.primary },
  tabLabel:           { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.gray600 },
  tabLabelActive:     { color: Colors.white },
  countBadge:         { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  countBadgeWarning:  { backgroundColor: Colors.warningLight },
  countText:          { fontSize: 10, fontWeight: Typography.weight.bold, color: Colors.gray700 },
  dropZoneContainer:  { margin: Spacing.base },
  photoGrid:          { paddingHorizontal: Spacing.sm },
  photoCell:          { flex: 1 / 3 },
  listFooterSpacer:   { height: 120 },
  footer:             { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.gray100, paddingHorizontal: Spacing.base, paddingBottom: 28, paddingTop: Spacing.md, gap: Spacing.xs },
  countLabel:         { fontSize: Typography.size.sm, color: Colors.gray500, textAlign: 'center' },
});
