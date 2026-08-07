import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { lookupBarcode } from '@/services/barcodeApi';

export default function BarcodeScannerScreen() {
  const params = useLocalSearchParams<{
    meal?: string;
    date?: string;
    profile?: string;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  if (!permission) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#2D6B48" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.title}>Barcode Scanner</Text>
        <Text style={styles.permissionText}>
          Parker Fitness needs camera access to scan food barcodes.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow Camera</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned || isLookingUp) return;

    setScanned(true);
    setIsLookingUp(true);

    try {
      const food = await lookupBarcode(data);

      if (!food) {
        Alert.alert(
          'Food Not Found',
          `Barcode ${data} was scanned, but no food information was found.`,
          [
            {
              text: 'Scan Again',
              onPress: () => {
                setScanned(false);
                setIsLookingUp(false);
              },
            },
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          ]
        );
        return;
      }

      router.replace({
        pathname: '/(tabs)/meals',
        params: {
          scannedBarcode: food.barcode,
          scannedName: food.name,
          scannedBrand: food.brand ?? '',
          scannedServingSize: String(food.servingSize),
          scannedServingUnit: food.servingUnit,
          scannedCalories: String(food.calories),
          scannedProtein: String(food.protein),
          scannedCarbs: String(food.carbs),
          scannedFat: String(food.fat),
          scannedMeal: params.meal ?? 'Breakfast',
          scannedDate: params.date ?? '',
          scannedProfile: params.profile ?? 'zach',
        },
      });
    } catch (error) {
      console.error('Barcode lookup error:', error);
      Alert.alert(
        'Lookup Error',
        error instanceof Error ? error.message : 'Unable to look up this barcode.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setIsLookingUp(false);
            },
          },
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
        ]
      );
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Scan Food</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.scannerArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={styles.scanLine} />
          </View>
          <Text style={styles.instructions}>Position the barcode inside the box</Text>
          <Text style={styles.subInstructions}>UPC and EAN food barcodes are supported</Text>
        </View>

        <View style={styles.bottomArea}>
          {isLookingUp ? (
            <View style={styles.lookupCard}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.lookupText}>Looking up food...</Text>
            </View>
          ) : (
            <Text style={styles.bottomText}>The barcode will scan automatically</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centerScreen: { flex: 1, backgroundColor: '#F4F6F5', alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: '#557063', fontSize: 15, fontWeight: '700', marginTop: 14 },
  permissionScreen: { flex: 1, backgroundColor: '#F4F6F5', justifyContent: 'center', paddingHorizontal: 28 },
  title: { color: '#17211C', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  permissionText: { color: '#6D7972', fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 14, marginBottom: 28 },
  primaryButton: { backgroundColor: '#2D6B48', borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  cancelButton: { paddingVertical: 17, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#6D7972', fontSize: 15, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.30)' },
  header: { paddingTop: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  closeButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  headerSpacer: { width: 46 },
  scannerArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  scanFrame: { width: '100%', maxWidth: 340, height: 220, position: 'relative' },
  corner: { position: 'absolute', width: 42, height: 42, borderColor: '#FFFFFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 10 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 10 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 10 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 10 },
  scanLine: { position: 'absolute', left: 18, right: 18, top: '50%', height: 2, backgroundColor: '#FFFFFF' },
  instructions: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', textAlign: 'center', marginTop: 28 },
  subInstructions: { color: '#E5E9E7', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 7 },
  bottomArea: { minHeight: 140, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  bottomText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  lookupCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14 },
  lookupText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
