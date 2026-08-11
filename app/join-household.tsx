import { supabase } from '@/services/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

type PendingInvitation = {
  invitation_id: string;
  household_id: string;
  household_name: string;
  invited_email: string;
  invited_at: string;
};

export default function JoinHouseholdScreen() {
  const [invitation, setInvitation] =
    useState<PendingInvitation | null>(null);

  const [profileName, setProfileName] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [joining, setJoining] =
    useState(false);

  useEffect(() => {
    loadInvitation();
  }, []);

  async function loadInvitation() {
    try {
      setLoading(true);

      const { data, error } =
        await supabase.rpc(
          'get_my_pending_household_invitation'
        );

      if (error) {
        console.error(
          'Pending invitation error:',
          error
        );

        Alert.alert(
          'Unable to Load Invitation',
          error.message
        );

        return;
      }

      const pendingInvitation =
        data?.[0] ?? null;

      setInvitation(pendingInvitation);
    } catch (error) {
      console.error(
        'Unable to load invitation:',
        error
      );

      Alert.alert(
        'Unable to Load Invitation',
        'Something went wrong while checking your household invitation.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function joinHousehold() {
    if (!invitation) {
      return;
    }

    const cleanName =
      profileName.trim();

    if (!cleanName) {
      Alert.alert(
        'Profile Name Required',
        'Enter the name you want to use for your fitness profile.'
      );
      return;
    }

    try {
      setJoining(true);

      const { data, error } =
        await supabase.rpc(
          'accept_household_invitation',
          {
            invitation_id:
              invitation.invitation_id,
            profile_name: cleanName,
          }
        );

      if (error) {
        console.error(
          'Join household error:',
          error
        );

        Alert.alert(
          'Unable to Join Household',
          error.message
        );

        return;
      }

      console.log(
        'HOUSEHOLD JOIN SUCCESS:',
        data
      );

      Alert.alert(
        'Welcome!',
        `You joined ${invitation.household_name}.`,
        [
          {
            text: 'Continue',
            onPress: () =>
              router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error(
        'Unable to join household:',
        error
      );

      Alert.alert(
        'Unable to Join Household',
        'Something went wrong while joining the household.'
      );
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Checking invitations...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!invitation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.brand}>
              PARKER FITNESS
            </Text>

            <Text style={styles.title}>
              No Invitation Found
            </Text>

            <Text style={styles.subtitle}>
              There is no pending household
              invitation for this account.
            </Text>

            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                router.replace('/(tabs)')
              }
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
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
            Household Invitation
          </Text>

          <Text style={styles.subtitle}>
            You've been invited to join:
          </Text>

          <View style={styles.inviteCard}>
            <Text
              style={styles.householdName}
            >
              {invitation.household_name}
            </Text>

            <Text style={styles.inviteText}>
              Your Parker Fitness account
              will be connected to this
              household.
            </Text>
          </View>

          <Text style={styles.label}>
            Profile Name
          </Text>

          <TextInput
            style={styles.input}
            value={profileName}
            onChangeText={setProfileName}
            placeholder="Your name"
            placeholderTextColor="#777"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!joining}
          />

          <Pressable
            style={[
              styles.primaryButton,
              joining &&
                styles.disabledButton,
            ]}
            onPress={joinHousehold}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Join{' '}
                {invitation.household_name}
              </Text>
            )}
          </Pressable>

          <Text style={styles.note}>
            Signed-in accounts can only
            accept invitations sent to their
            own email address.
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

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
  },

  subtitle: {
    color: '#a1a1aa',
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 20,
  },

  inviteCard: {
    backgroundColor: '#1c1f26',
    borderWidth: 1,
    borderColor: '#30343d',
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
  },

  householdName: {
    color: '#4ade80',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },

  inviteText: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 21,
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
  },

  secondaryButtonText: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingText: {
    color: '#a1a1aa',
    fontSize: 15,
    marginTop: 14,
  },

  note: {
    color: '#71717a',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 22,
  },
});