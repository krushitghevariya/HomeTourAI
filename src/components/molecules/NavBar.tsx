import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Layout } from '../../theme';

interface NavBarProps {
  title?:        string;
  onBackPress?:  () => void;
  rightElement?: React.ReactNode;
  logoMode?:     boolean;
  avatarUri?:    string;
  onAvatarPress?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  title, onBackPress, rightElement, logoMode = false, avatarUri, onAvatarPress,
}) => (
  <View style={styles.container}>
    <View style={styles.side}>
      {onBackPress && (
        <TouchableOpacity onPress={onBackPress} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      )}
      {logoMode && <Text style={styles.logo}>HomeTour AI</Text>}
    </View>

    {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}

    <View style={[styles.side, styles.rightSide]}>
      {rightElement}
      {avatarUri ? (
        <TouchableOpacity onPress={onAvatarPress} accessibilityLabel="Open settings">
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        </TouchableOpacity>
      ) : onAvatarPress ? (
        <TouchableOpacity onPress={onAvatarPress} style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>U</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container:       { height: Layout.headerHeight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  side:            { width: 80, flexDirection: 'row', alignItems: 'center' },
  rightSide:       { justifyContent: 'flex-end' },
  backBtn:         { padding: Spacing.sm, marginLeft: -Spacing.sm },
  backIcon:        { fontSize: Typography.size.xl, color: Colors.gray800 },
  logo:            { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.primary },
  title:           { flex: 1, textAlign: 'center', fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.gray900 },
  avatar:          { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray200 },
  avatarPlaceholder:{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:   { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.primary },
});
