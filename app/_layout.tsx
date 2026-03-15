import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ title: 'Товар' }} />
          <Stack.Screen name="request/[id]" options={{ title: 'Заявка', headerShown: true }} />
          <Stack.Screen
            name="modal/add-product"
            options={{ title: 'Новый товар', presentation: 'modal', headerShown: true }}
          />
          <Stack.Screen
            name="modal/add-request-item"
            options={{ title: 'Добавить товар', presentation: 'modal', headerShown: true }}
          />
          <Stack.Screen name="categories" options={{ title: 'Категории' }} />
          <Stack.Screen name="category/[id]" options={{ title: 'Категория' }} />
          <Stack.Screen
            name="modal/add-category"
            options={{ title: 'Новая категория', presentation: 'modal', headerShown: true }}
          />
          <Stack.Screen
            name="modal/assign-products"
            options={{ title: 'Выбрать товары', presentation: 'modal', headerShown: true }}
          />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
