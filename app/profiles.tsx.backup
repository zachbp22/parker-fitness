import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  addProfile,
  deleteProfile,
  loadProfiles,
  updateProfile,
  type Profile,
} from '@/services/storage';

export default function ProfilesScreen() {
  const [profiles, setProfiles] =
    useState<Profile[]>([]);
const [editingProfile, setEditingProfile] =
  useState<Profile | null>(null);

const [editName, setEditName] =
  useState('');

const [editCalorieGoal, setEditCalorieGoal] =
  useState('');

const [editProteinGoal, setEditProteinGoal] =
  useState('');
  const [editWeightGoal, setEditWeightGoal] =
  useState('');
  const [loading, setLoading] =
    useState(true);
    const [showAddForm, setShowAddForm] =
  useState(false);

const [name, setName] =
  useState('');

const [calorieGoal, setCalorieGoal] =
  useState('');

const [proteinGoal, setProteinGoal] =
  useState('');
async function handleAddProfile() {
  const trimmedName = name.trim();

  const parsedCalories =
    Number(calorieGoal);

  const parsedProtein =
    Number(proteinGoal);

  if (
    !trimmedName ||
    !Number.isFinite(parsedCalories) ||
    parsedCalories <= 0 ||
    !Number.isFinite(parsedProtein) ||
    parsedProtein <= 0
  ) {
    return;
  }

  const profileId =
    `${trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${Date.now()}`;

  await addProfile({
    id: profileId,
    name: trimmedName,
    calorieGoal: Math.round(parsedCalories),
    proteinGoal: Math.round(parsedProtein),
  });

  setName('');
  setCalorieGoal('');
  setProteinGoal('');
  setShowAddForm(false);

  await loadProfileList();
}
function startEditingProfile(profile: Profile) {
  setEditingProfile(profile);
  setEditName(profile.name);
  setEditCalorieGoal(
    String(profile.calorieGoal)
  );
  setEditProteinGoal(
    String(profile.proteinGoal)
  );
  setEditWeightGoal(
  profile.weightGoal !== undefined
    ? String(profile.weightGoal)
    : ''
);
}
async function handleUpdateProfile() {
  if (!editingProfile) {
    return;
  }

  const trimmedName = editName.trim();

  const parsedCalories =
    Number(editCalorieGoal);

  const parsedProtein =
    Number(editProteinGoal);
    const parsedWeightGoal =
  Number(editWeightGoal);

  if (
    !trimmedName ||
    !Number.isFinite(parsedCalories) ||
    parsedCalories <= 0 ||
   !Number.isFinite(parsedProtein) ||
parsedProtein <= 0 ||
!Number.isFinite(parsedWeightGoal) ||
parsedWeightGoal <= 0
  ) {
    Alert.alert(
      'Invalid Profile',
      'Please enter a name, calorie goal, and protein goal.'
    );
    return;
  }

  try {
   await updateProfile({
  ...editingProfile,
  name: trimmedName,
  calorieGoal: Math.round(parsedCalories),
  proteinGoal: Math.round(parsedProtein),
  weightGoal: parsedWeightGoal,
});

    setEditingProfile(null);
    setEditName('');
    setEditCalorieGoal('');
    setEditProteinGoal('');
    setEditWeightGoal('');

    await loadProfileList();
  } catch (error) {
    console.error(
      'Unable to update profile:',
      error
    );

    Alert.alert(
      'Unable to Save',
      'The profile changes could not be saved.'
    );
  }
}
function handleDeleteProfile(profile: Profile) {
  Alert.alert(
    'Delete Profile',
    `Are you sure you want to delete ${profile.name}?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProfile(profile.id);
            await loadProfileList();
          } catch (error) {
            console.error(
              'Unable to delete profile:',
              error
            );

            Alert.alert(
              'Unable to Delete',
              'This profile could not be deleted.'
            );
          }
        },
      },
    ]
  );
}

  const loadProfileList = useCallback(
    async () => {
      try {
        setLoading(true);

        const savedProfiles =
          await loadProfiles();

        setProfiles(savedProfiles);
      } catch (error) {
        console.error(
          'Unable to load profiles:',
          error
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadProfileList();
    }, [loadProfileList])
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <Text style={styles.brand}>
          PARKER FITNESS
        </Text>

        <Text style={styles.title}>
          Manage Profiles
        </Text>

        <Text style={styles.subtitle}>
          Manage family profiles and nutrition goals.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            style={styles.loading}
          />
        ) : (
          <View style={styles.profileList}>
            {profiles.map((profile) => (
              <View
                key={profile.id}
                style={styles.profileCard}
              >
                <Text style={styles.profileName}>
                  {profile.name}
                </Text>

                <View style={styles.goalRow}>
                  <View style={styles.goalItem}>
                    <Text style={styles.goalLabel}>
                      CALORIES
                    </Text>

                    <Text style={styles.goalValue}>
                      {profile.calorieGoal.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.goalItem}>
                    <Text style={styles.goalLabel}>
                      PROTEIN
                    </Text>

                    <Text style={styles.goalValue}>
                      {profile.proteinGoal}g
                    </Text>
                  </View>
                </View>
                <Pressable
  style={styles.editButton}
  onPress={() =>
    startEditingProfile(profile)
  }
>
  <Text style={styles.editButtonText}>
    Edit Profile
  </Text>
</Pressable>
                <Pressable
  style={styles.deleteButton}
  onPress={() =>
    handleDeleteProfile(profile)
  }
>
  <Text style={styles.deleteButtonText}>
    Delete Profile
  </Text>
</Pressable>
              </View>
            ))}
          </View>
        )}
{editingProfile && (
  <View style={styles.formCard}>
    <Text style={styles.formTitle}>
      Edit Profile
    </Text>

    <Text style={styles.inputLabel}>
      NAME
    </Text>

    <TextInput
      style={styles.input}
      value={editName}
      onChangeText={setEditName}
      placeholder="Profile name"
    />

<Text style={styles.inputLabel}>
  DAILY CALORIE GOAL
</Text>

<TextInput
  style={styles.input}
  value={editCalorieGoal}
  onChangeText={setEditCalorieGoal}
  placeholder="2000"
  keyboardType="number-pad"
/>

<Text style={styles.inputLabel}>
  DAILY PROTEIN GOAL
</Text>

<TextInput
  style={styles.input}
  value={editProteinGoal}
  onChangeText={setEditProteinGoal}
  placeholder="150"
  keyboardType="number-pad"
/>

<Text style={styles.inputLabel}>
  GOAL WEIGHT (LB)
</Text>

<TextInput
  style={styles.input}
  value={editWeightGoal}
  onChangeText={setEditWeightGoal}
  placeholder="200"
  keyboardType="decimal-pad"
/>

    <Pressable
      style={styles.saveButton}
      onPress={handleUpdateProfile}
    >
      <Text style={styles.saveButtonText}>
        Save Changes
      </Text>
    </Pressable>

    <Pressable
      style={styles.cancelButton}
      onPress={() => {
        setEditingProfile(null);
        setEditName('');
        setEditCalorieGoal('');
        setEditProteinGoal('');
        setEditWeightGoal('');
      }}
    >
      <Text style={styles.cancelButtonText}>
        Cancel
      </Text>
    </Pressable>
  </View>
)}
     {showAddForm ? (
  <View style={styles.formCard}>
    <Text style={styles.formTitle}>
      Add Profile
    </Text>

    <Text style={styles.inputLabel}>
      NAME
    </Text>

    <TextInput
      style={styles.input}
      value={name}
      onChangeText={setName}
      placeholder="Profile name"
    />

    <Text style={styles.inputLabel}>
      DAILY CALORIE GOAL
    </Text>

    <TextInput
      style={styles.input}
      value={calorieGoal}
      onChangeText={setCalorieGoal}
      placeholder="2000"
      keyboardType="number-pad"
    />

    <Text style={styles.inputLabel}>
      DAILY PROTEIN GOAL
    </Text>

    <TextInput
      style={styles.input}
      value={proteinGoal}
      onChangeText={setProteinGoal}
      placeholder="150"
      keyboardType="number-pad"
    />

    <Pressable
      style={styles.saveButton}
      onPress={handleAddProfile}
    >
      <Text style={styles.saveButtonText}>
        Save Profile
      </Text>
    </Pressable>

    <Pressable
      style={styles.cancelButton}
      onPress={() => {
        setShowAddForm(false);
        setName('');
        setCalorieGoal('');
        setProteinGoal('');
      }}
    >
      <Text style={styles.cancelButtonText}>
        Cancel
      </Text>
    </Pressable>
  </View>
) : (
  <Pressable
    style={styles.addButton}
    onPress={() => setShowAddForm(true)}
  >
    <Text style={styles.addButtonText}>
      + Add Profile
    </Text>
  </Pressable>
)}

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Back
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  brand: {
    color: '#2D6B48',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },

  title: {
    color: '#173D2A',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 12,
  },

  subtitle: {
    color: '#6D7972',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 24,
  },

  loading: {
    marginVertical: 40,
  },

  profileList: {
    gap: 12,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },

  profileName: {
    color: '#173D2A',
    fontSize: 21,
    fontWeight: '900',
  },
  editButton: {
  marginTop: 16,
  paddingVertical: 11,
  alignItems: 'center',
  borderRadius: 12,
  backgroundColor: '#E7F0EA',
},

editButtonText: {
  color: '#2D6B48',
  fontSize: 14,
  fontWeight: '800',
},
deleteButton: {
  marginTop: 16,
  paddingVertical: 11,
  alignItems: 'center',
  borderRadius: 12,
  backgroundColor: '#FBECEC',
},

deleteButtonText: {
  color: '#A63D3D',
  fontSize: 14,
  fontWeight: '800',
},
  goalRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },

  goalItem: {
    flex: 1,
    backgroundColor: '#EDF1EF',
    borderRadius: 14,
    padding: 14,
  },

  goalLabel: {
    color: '#6D7972',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  goalValue: {
    color: '#173D2A',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
formCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 18,
  marginTop: 20,
},

formTitle: {
  color: '#173D2A',
  fontSize: 21,
  fontWeight: '900',
  marginBottom: 18,
},

inputLabel: {
  color: '#557063',
  fontSize: 10,
  fontWeight: '800',
  letterSpacing: 1,
  marginBottom: 6,
  marginTop: 10,
},

input: {
  backgroundColor: '#EDF1EF',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 13,
  color: '#173D2A',
  fontSize: 16,
},

saveButton: {
  backgroundColor: '#2D6B48',
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: 'center',
  marginTop: 20,
},

saveButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '800',
},

cancelButton: {
  paddingVertical: 12,
  alignItems: 'center',
  marginTop: 4,
},

cancelButtonText: {
  color: '#6D7972',
  fontSize: 14,
  fontWeight: '700',
},
  addButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  backButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },

  backButtonText: {
    color: '#2D6B48',
    fontSize: 15,
    fontWeight: '800',
  },
});