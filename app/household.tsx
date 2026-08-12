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

export default function HouseholdScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] =
    useState(false);
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

  disabledButton: {
    opacity: 0.6,
  },
});