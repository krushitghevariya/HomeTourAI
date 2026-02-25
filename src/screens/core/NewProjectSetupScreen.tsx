import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { GenerationMode, PropertyType } from '../../types';
import { NavBar }       from '../../components/molecules/NavBar';
import { ModeCard }     from '../../components/molecules/ModeCard';
import { ProgressBar }  from '../../components/atoms/ProgressBar';
import { TextField }    from '../../components/atoms/TextField';
import { Chip }         from '../../components/atoms/Chip';
import { Button }       from '../../components/atoms/Button';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa',     label: 'Villa' },
  { value: 'office',    label: 'Office' },
  { value: 'other',     label: 'Other' },
];

const GENERATION_MODES: { mode: GenerationMode; icon: string; title: string; subtitle: string }[] = [
  { mode: 'photos', icon: '📷', title: 'Upload Photos',  subtitle: 'Use room-by-room photos to build your tour' },
  { mode: 'video',  icon: '🎬', title: 'Upload Video',   subtitle: 'Upload an MP4 walkthrough video' },
  { mode: 'live',   icon: '📡', title: 'Capture Live',   subtitle: 'Use your camera for guided panoramic capture' },
];

interface NewProjectSetupScreenProps {
  onBack:     () => void;
  onContinue: (name: string, propertyType: PropertyType, mode: GenerationMode) => void;
}

export const NewProjectSetupScreen: React.FC<NewProjectSetupScreenProps> = ({ onBack, onContinue }) => {
  const [name,         setName]         = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [mode,         setMode]         = useState<GenerationMode | null>(null);
  const [nameError,    setNameError]    = useState('');

  const handleContinue = () => {
    if (!name.trim()) { setNameError('Project name is required'); return; }
    if (!mode) return;
    onContinue(name.trim(), propertyType, mode);
  };

  return (
    <View style={styles.screen}>
      <NavBar title="New Project" onBackPress={onBack} />
      <View style={styles.progress}>
        <ProgressBar currentStep={1} totalSteps={3} />
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TextField
          label="Project Name"
          placeholder="e.g. Downtown Penthouse"
          value={name}
          onChangeText={v => { setName(v); if (v.trim()) setNameError(''); }}
          onBlur={() => { if (!name.trim()) setNameError('Project name is required'); }}
          error={nameError}
        />

        <Text style={styles.label}>Property Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
          {PROPERTY_TYPES.map(p => (
            <Chip key={p.value} label={p.label} selected={propertyType === p.value} onPress={() => setPropertyType(p.value)} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Generation Mode</Text>
        {GENERATION_MODES.map(m => (
          <ModeCard key={m.mode} mode={m.mode} icon={m.icon} title={m.title} subtitle={m.subtitle} selected={mode === m.mode} onPress={() => setMode(m.mode)} />
        ))}

        <Button label="Continue" onPress={handleContinue} disabled={!mode} style={styles.cta} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.background },
  progress:     { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  body:         { paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'] },
  label:        { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.gray700, marginBottom: Spacing.sm, marginTop: Spacing.md },
  chips:        { marginBottom: Spacing.sm },
  chipsContent: { paddingVertical: Spacing.xs },
  cta:          { marginTop: Spacing.xl },
});
