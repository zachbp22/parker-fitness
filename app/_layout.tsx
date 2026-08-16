import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <KeyboardAvoidingView
        style={styles.app}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="profiles"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="household"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="join-household"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
            }}
          />
        </Stack>

        <StatusBar style="auto" />
      </KeyboardAvoidingView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
});
