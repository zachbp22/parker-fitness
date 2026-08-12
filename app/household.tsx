import {
  getTodayDate,
  syncFoodToCloud,
  syncWaterToCloud,
} from '@/services/storage';
import {
  getCloudProfiles,
  getCurrentUserCloudProfile,
  supabase,
} from '@/services/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function HouseholdScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] =
    useState(false);
async function testCloudProfiles() {
  try {
    const profiles =
      await getCloudProfiles();

    console.log(
      'CLOUD PROFILES:',
      profiles
    );

    Alert.alert(
      'Cloud Profiles',
      profiles
        .map(
          (profile) =>
            `${profile.name}\n${profile.id}`
        )
        .join('\n\n')
    );
  } catch (error) {
    console.error(
      'Cloud profile test failed:',
      error
    );

    Alert.alert(
      'Cloud Profile Error',
      'Unable to load cloud profiles.'
    );
  }
}
async function testCurrentCloudProfile() {
  try {
    const profile =
      await getCurrentUserCloudProfile();

    if (!profile) {
      Alert.alert(
        'Current Cloud Profile',
        'No cloud profile found for the signed-in user.'
      );
      return;
    }

    console.log(
      'CURRENT CLOUD PROFILE:',
      profile
    );

    Alert.alert(
      'Current Cloud Profile',
      `${profile.name}\n${profile.id}`
    );
  } catch (error) {
    console.error(
      'Current cloud profile test failed:',
      error
    );

    Alert.alert(
      'Cloud Profile Error',
      'Unable to identify the current cloud profile.'
    );
  }
}
async function testCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    console.log(
      'CURRENT SUPABASE USER:',
      user?.id
    );

    Alert.alert(
      'Current Supabase User',
      user?.id ?? 'No authenticated user'
    );
  } catch (error) {
    console.error(
      'Current user test failed:',
      error
    );
  }
}
async function testWaterCloud() {
  try {
    const today = getTodayDate();

    await syncWaterToCloud(
      today,
      64
    );

    console.log(
      'CLOUD WATER TEST SUCCESS:',
      {
        profileId: 'authenticated user',
        date: today,
        ounces: 64,
      }
    );

    Alert.alert(
  'Water Cloud Test',
  `Successfully synced 64 oz for the signed-in profile on ${today}.`
);
  } catch (error) {
    console.error(
      'Cloud water test failed:',
      error
    );

    Alert.alert(
      'Water Cloud Error',
      'Unable to sync water to Supabase.'
    );
  }
}
async function testFoodCloud() {
  try {
    const today = getTodayDate();

    await syncFoodToCloud({
      id: `cloud-test-${Date.now()}`,
      name: 'Cloud Test Chicken',
      servingSize: '4',
      servingUnit: 'oz',
      calories: 180,
      protein: 35,
      carbs: 0,
      fat: 4,
      meal: 'Lunch',
      date: today,
      profileId: 'wife',
    });

    Alert.alert(
      'Food Cloud Test',
      'Cloud Test Chicken successfully synced.'
    );
  } catch (error) {
    console.error(
      'Cloud food test failed:',
      error
    );

    Alert.alert(
      'Food Cloud Error',
      'Unable to sync food to Supabase.'
    );
  }
}
  async function sendInvitation() {
    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert(
        'Email Required',
        'Enter the email address of the person you want to invite.'
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.rpc(
          'create_household_invitation',
          {
            invite_email: cleanEmail,
          }
        );

      if (error) {
        console.error(
          'Invitation error:',
          error
        );

        Alert.alert(
          'Unable to Send Invite',
          error.message
        );

        return;
      }

      console.log(
        'HOUSEHOLD INVITATION CREATED:',
        data
      );

      Alert.alert(
        'Invitation Created',
        `An invitation has been created for ${cleanEmail}.`
      );

      setEmail('');
    } catch (error) {
      console.error(
        'Invitation failed:',
        error
      );

      Alert.alert(
        'Unable to Send Invite',
        'Something went wrong while creating the invitation.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Text style={styles.back}>
              ‹ Back
            </Text>
          </Pressable>

          <Text style={styles.brand}>
            PARKER FITNESS
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>
            Household
          </Text>

          <Text style={styles.subtitle}>
            Invite someone to join your
            household and connect their own
            Parker Fitness account.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Parker Household
            </Text>

            <Text style={styles.infoText}>
              Each person uses their own
              email and password while
              remaining connected to the
              same household.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Invite Member
          </Text>

          <Text style={styles.label}>
            Email Address
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
<Pressable
  style={styles.secondaryButton}
  onPress={testCloudProfiles}
>
  <Text style={styles.secondaryButtonText}>
    TEST CLOUD PROFILES
  </Text>
</Pressable>
<Pressable
  style={styles.secondaryButton}
  onPress={testFoodCloud}
>
  <Text style={styles.secondaryButtonText}>
    TEST FOOD CLOUD
  </Text>
</Pressable>
<Pressable
  style={styles.secondaryButton}
  onPress={testCurrentCloudProfile}
>
  <Text style={styles.secondaryButtonText}>
    TEST CURRENT CLOUD PROFILE
  </Text>
</Pressable>
<Pressable
  style={styles.secondaryButton}
  onPress={testCurrentUser}
>
  <Text style={styles.secondaryButtonText}>
    TEST CURRENT USER
  </Text>
</Pressable>
<Pressable
  style={styles.secondaryButton}
  onPress={testWaterCloud}
>
  <Text style={styles.secondaryButtonText}>
    TEST WATER CLOUD
  </Text>
</Pressable>
          <Pressable
            style={[
              styles.primaryButton,
              loading &&
                styles.disabledButton,
            ]}
            onPress={sendInvitation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Send Invitation
              </Text>
            )}
          </Pressable>

          <Text style={styles.note}>
            Phase 2A household testing
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f1115',
  },

  container: {
    flex: 1,
    padding: 24,
  },

  header: {
    marginTop: 8,
    marginBottom: 32,
  },

  back: {
    color: '#4ade80',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 22,
  },

  brand: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },

  card: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },

  subtitle: {
    color: '#a1a1aa',
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 24,
  },

  infoCard: {
    backgroundColor: '#1c1f26',
    borderWidth: 1,
    borderColor: '#30343d',
    borderRadius: 14,
    padding: 18,
    marginBottom: 30,
  },

  infoTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 7,
  },

  infoText: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 21,
  },

  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },

  label: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#1c1f26',
    borderWidth: 1,
    borderColor: '#30343d',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },

  primaryButton: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#08120c',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
  borderWidth: 1,
  borderColor: '#4ade80',
  borderRadius: 12,
  paddingVertical: 15,
  alignItems: 'center',
  marginBottom: 18,
},

secondaryButtonText: {
  color: '#4ade80',
  fontSize: 16,
  fontWeight: '800',
},

  disabledButton: {
    opacity: 0.6,
  },

  note: {
    color: '#71717a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});