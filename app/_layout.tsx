// app/_layout.tsx
import {Stack, useRouter, useSegments} from 'expo-router';
import {
    DarkTheme,
    DefaultTheme as NavigationDefaultTheme,
    ThemeProvider
} from '@react-navigation/native';
import {
    Provider as PaperProvider,
    DefaultTheme as PaperDefaultTheme
} from 'react-native-paper';
import {useColorScheme} from '@/hooks/useColorScheme';
import {StatusBar} from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect} from 'react';
import {useFonts} from 'expo-font';
import {SettingsProvider, useSettings} from '@/utility/SettingsContext';

SplashScreen.preventAutoHideAsync();

const CustomPaperTheme = {
    ...PaperDefaultTheme,
    roundness: 4,
    colors: {
        ...PaperDefaultTheme.colors,
        primary: '#3498db',
        accent: '#f1c40f',
    },
};

// Protected route wrapper component
function ProtectedRoute({children}: { children: React.ReactNode }) {
    const {user, isLoading} = useSettings();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {

            // Handle initial route or invalid routes
            if (segments[0] === '+not-found') {
                if (user) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/Login');
                }
                return;
            }

            // console.log('Current segments:', segments);
            // console.log('Current user:', user);
            // console.log('First segment:', segments[0]);
            // Check if the user is in a protected segment
            const inProtectedRoute = segments[0] === '(tabs)';

            if (!user && inProtectedRoute) {
                // Redirect to login if trying to access protected route while not authenticated
                // console.log('Redirecting to login...');
                router.replace('/Login');
            } else if (user && segments[0] === 'Login') {
                // console.log('Redirecting to home...');
                // Redirect to home if trying to access login while authenticated
                router.replace('/(tabs)');
            }
        }
    }, [user, segments, isLoading]);

    if (isLoading) return null;

    return <>{children}</>;
}

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) return null;

    return (
        <SettingsProvider>
            <PaperProvider theme={CustomPaperTheme}>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : NavigationDefaultTheme}>
                    <ProtectedRoute>
                        <Stack>
                            <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                            <Stack.Screen
                                name="Login"
                                options={{
                                    headerShown: false,
                                    gestureEnabled: false,
                                }}
                            />
                            <Stack.Screen
                                name="Video"
                                options={{
                                    title: 'Video',
                                    headerBackTitle: 'Back'
                            }}/>
                            <Stack.Screen
                                name="WeSPN"
                                options={{
                                    title: 'WeSPN',
                                    headerBackTitle: 'Back'
                                }}
                            />
                            <Stack.Screen
                                name="MlbTeamSearchScreen"
                                options={{title: 'Favorite Teams',
                                    headerBackTitle: 'Back'}}
                            />
                        </Stack>
                        <StatusBar style="auto"/>
                    </ProtectedRoute>
                </ThemeProvider>
            </PaperProvider>
        </SettingsProvider>
    );
}
