import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';

export async function captureViewImage(ref: RefObject<View | null>): Promise<string> {
  // Lazy import — native module is only required when actually called,
  // preventing a startup crash when the binary hasn't been rebuilt yet.
  const { captureRef } = await import('react-native-view-shot');
  return captureRef(ref as RefObject<View>, { format: 'png', quality: 1, result: 'tmpfile' });
}

export async function shareImage(uri: string, title: string): Promise<void> {
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title });
}
