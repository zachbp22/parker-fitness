import {
  restoreFoodsFromCloud,
  restoreWaterFromCloud,
  restoreWeightsFromCloud,
  restoreWorkoutsFromCloud,
} from '@/services/storage';
import { supabase } from '@/services/supabase';
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

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] =
    useState('');
  const [loading, setLoading] =
    useState(false);

 async function bootstrapHousehold() {
  try {
    const { data, error } =
      await supabase.rpc(
        'create_household_and_profile',
        {
          household_name: 'Parker Household',
          profile_name: 'Zach',
          calorie_goal: 2005,
          protein_goal: 150,
          water_goal: 96,
        }
      );

    if (error) {
      console.error(
        'Household bootstrap error:',
        error
      );

      Alert.alert(
        'Setup Error',
        error.message
      );

      return;
    }

    console.log(
      'HOUSEHOLD BOOTSTRAP SUCCESS:',
      data
    );

    Alert.alert(
      'Setup Complete',
      'Parker Household and Zach cloud profile were created.'
    );
  } catch (error) {
    console.error(
      'Household bootstrap failed:',
      error
    );
  }
}
    async function signIn() {
    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        'Missing Information',
        'Enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        Alert.alert(
          'Unable to Sign In',
          error.message
        );
        return;
      }

      const { data: invitationData, error: invitationError } =
  await supabase.rpc(
    'get_my_pending_household_invitation'
  );

if (invitationError) {
  console.error(
    'Invitation check error:',
    invitationError
  );

  Alert.alert(
    'Sign In Error',
    'Signed in successfully, but Parker Fitness could not check your household status.'
  );

  return;
}

if (invitationData?.length) {
  router.replace('/join-household');
  return;
}

try {
await Promise.all([
    restoreFoodsFromCloud(),
    restoreWaterFromCloud(),
    restoreWeightsFromCloud(),
    restoreWorkoutsFromCloud(),
  ]);

  console.log(
    'Initial cloud restore completed successfully.'
  );
} catch (syncError) {
  console.error(
    'Initial cloud restore failed:',
    syncError
  );

  // Do not block sign-in if cloud restoration
  // temporarily fails. Existing local data remains.
}

router.replace('/(tabs)');
    } catch (error) {
      console.error(
        'Sign in error:',
        error
      );

      Alert.alert(
        'Unable to Sign In',
        'Something went wrong while signing in.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function createAccount() {
    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        'Missing Information',
        'Enter your email and password.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password Too Short',
        'Use a password with at least 6 characters.'
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

      if (error) {
        Alert.alert(
          'Unable to Create Account',
          error.message
        );
        return;
      }

      if (!data.session) {
        Alert.alert(
          'Check Your Email',
          'Your account was created. Check your email to confirm your account before signing in.'
        );
        return;
      }

     const { data: invitationData, error: invitationError } =
  await supabase.rpc(
    'get_my_pending_household_invitation'
  );

if (invitationError) {
  console.error(
    'Invitation check error:',
    invitationError
  );

  Alert.alert(
    'Account Created',
    'Your account was created, but Parker Fitness could not check your household invitation.'
  );

  return;
}

if (invitationData?.length) {
  router.replace('/join-household');
  return;
}

Alert.alert(
  'Account Created',
  'Your Parker Fitness account is ready.'
);

try {
  await Promise.all([
    restoreFoodsFromCloud(),
    restoreWaterFromCloud(),
    restoreWeightsFromCloud(),
    restoreWorkoutsFromCloud(),
  ]);

  console.log(
    'Initial cloud restore completed successfully.'
  );
} catch (syncError) {
  console.error(
    'Initial cloud restore failed:',
    syncError
  );

  // Do not block sign-in if cloud restoration
  // temporarily fails. Existing local data remains.
}

router.replace('/(tabs)');
    } catch (error) {
      console.error(
        'Create account error:',
        error
      );

      Alert.alert(
        'Unable to Create Account',
        'Something went wrong while creating your account.'
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
        <View style={styles.card}>
          <Text style={styles.brand}>
            PARKER FITNESS
          </Text>

          <Text style={styles.title}>
            Welcome
          </Text>

          <Text style={styles.subtitle}>
            Sign in to sync your fitness data
            across devices.
          </Text>

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#777"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Pressable
            style={[
              styles.primaryButton,
              loading &&
                styles.disabledButton,
            ]}
            onPress={signIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text
                style={styles.primaryButtonText}
              >
                Sign In
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={createAccount}
            disabled={loading}
          >
            <Text
              style={styles.secondaryButtonText}
            >
              Create Account
            </Text>
          </Pressable>

        <Pressable
  style={styles.secondaryButton}
  onPress={bootstrapHousehold}
  disabled={loading}
>
  <Text style={styles.secondaryButtonText}>
    Create Parker Household
  </Text>
</Pressable>

<Text style={styles.testNote}>
  Phase 2A account testing
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
    justifyContent: 'center',
    padding: 24,
  },

  card: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  brand: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 18,
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
    marginBottom: 30,
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
    marginTop: 8,
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
    marginTop: 12,
  },

  secondaryButtonText: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.6,
  },

  testNote: {
    color: '#71717a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});


