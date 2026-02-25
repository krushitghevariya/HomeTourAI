import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../theme';
import { Button } from '../atoms/Button';

interface ConfirmModalProps {
  visible:       boolean;
  title:         string;
  message:       string;
  confirmLabel?: string;
  cancelLabel?:  string;
  destructive?:  boolean;
  onConfirm:     () => void;
  onCancel:      () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive = false, onConfirm, onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <TouchableOpacity style={styles.overlay} onPress={onCancel} activeOpacity={1}>
      <View style={styles.sheet} onStartShouldSetResponder={() => true}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Button label={cancelLabel}  onPress={onCancel}  variant="secondary" style={styles.btn} />
          <Button label={confirmLabel} onPress={onConfirm} variant={destructive ? 'danger' : 'primary'} style={styles.btn} />
        </View>
      </View>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  sheet:   { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, ...Shadow.lg },
  title:   { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.gray900, marginBottom: Spacing.sm },
  message: { fontSize: Typography.size.base, color: Colors.gray600, lineHeight: 22, marginBottom: Spacing.xl },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  btn:     { flex: 1 },
});
