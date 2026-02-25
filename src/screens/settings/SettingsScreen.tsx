import React, { useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../theme';
import { User } from '../../types';
import { NavBar }       from '../../components/molecules/NavBar';
import { ConfirmModal } from '../../components/molecules/ConfirmModal';
import { Button }       from '../../components/atoms/Button';

interface SettingsScreenProps {
  user:                   User;
  notificationsEnabled:   boolean;
  onNotificationsToggle:  (v: boolean) => void;
  onHelpPress:            () => void;
  onLogout:               () => void;
  onDeleteAccount:        () => void;
  onBack:                 () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user, notificationsEnabled, onNotificationsToggle,
  onHelpPress, onLogout, onDeleteAccount, onBack,
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const storagePct = (user.storageUsedBytes / user.storageLimitBytes) * 100;
  const usedMB     = (user.storageUsedBytes  / (1024 * 1024)).toFixed(0);
  const limitMB    = (user.storageLimitBytes / (1024 * 1024)).toFixed(0);

  return (
    <View style={styles.screen}>
      <NavBar title="Settings" onBackPress={onBack} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{user.fullName}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.card}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageLabel}>Used</Text>
            <Text style={styles.storageValue}>{usedMB} MB / {limitMB} MB</Text>
          </View>
          <View style={styles.storageTrack}>
            <View style={[styles.storageFill, {
              width: `${Math.min(storagePct, 100)}%` as any,
              backgroundColor: storagePct > 85 ? Colors.error : Colors.primary,
            }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.rowLabel}>Push Notifications</Text>
            <Switch value={notificationsEnabled} onValueChange={onNotificationsToggle} trackColor={{ true: Colors.primary, false: Colors.gray300 }} />
          </View>
          <TouchableOpacity style={styles.linkRow} onPress={onHelpPress}>
            <Text style={styles.rowLabel}>Help & FAQ</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        <View style={styles.dangerStack}>
          <Button label="Log Out"        onPress={() => setShowLogoutModal(true)} variant="secondary" />
          <Button label="Delete Account" onPress={() => setShowDeleteModal(true)} variant="danger" />
        </View>
      </ScrollView>

      <ConfirmModal visible={showLogoutModal} title="Log out?" message="You'll need to sign in again to access your projects." confirmLabel="Log Out" cancelLabel="Cancel" onConfirm={onLogout} onCancel={() => setShowLogoutModal(false)} />
      <ConfirmModal visible={showDeleteModal} title="Delete account?" message="This permanently deletes your account and all projects. Cannot be undone." confirmLabel="Delete Account" cancelLabel="Cancel" destructive onConfirm={onDeleteAccount} onCancel={() => setShowDeleteModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: Colors.background },
  body:          { paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'] },
  sectionTitle:  { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.gray500, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  dangerTitle:   { color: Colors.error },
  card:          { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  profileRow:    { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
  avatar:        { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.primary },
  profileName:   { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.gray900 },
  profileEmail:  { fontSize: Typography.size.sm, color: Colors.gray500 },
  storageHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.base, paddingBottom: Spacing.sm },
  storageLabel:  { fontSize: Typography.size.sm, color: Colors.gray500 },
  storageValue:  { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.gray700 },
  storageTrack:  { marginHorizontal: Spacing.base, marginBottom: Spacing.base, height: 8, backgroundColor: Colors.gray100, borderRadius: 4, overflow: 'hidden' },
  storageFill:   { height: '100%', borderRadius: 4 },
  toggleRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  linkRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  rowLabel:      { fontSize: Typography.size.base, color: Colors.gray900 },
  chevron:       { fontSize: Typography.size.xl, color: Colors.gray400 },
  dangerStack:   { gap: Spacing.sm },
});
