// app/login.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {View, ImageBackground, Platform, StyleSheet, Image, ScrollView, TouchableOpacity} from 'react-native';
import {Button, Text, Surface, Portal, Dialog, Checkbox} from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
    GoogleAuthProvider,
    signInWithCredential,
    OAuthProvider
} from 'firebase/auth';
import {auth} from '@/utility/firebaseConfig';
import {StatusBar} from 'expo-status-bar';
import {useFonts} from "expo-font";
import * as SplashScreen from 'expo-splash-screen';
import {doc, setDoc} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Ionicons} from "@expo/vector-icons";
import {EULA_CONTENT, EULA_SUMMARY} from "@/utility/eula";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

WebBrowser.maybeCompleteAuthSession();

const EULA_STORAGE_KEY = '@eula_accepted';

export default function LoginScreen() {
    const [fontsLoaded] = useFonts({
        'RockSalt-Regular': require('../assets/fonts/RockSalt-Regular.ttf'),
    });

    const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
    const [showFullEula, setShowFullEula] = useState<boolean>(false);

    // Load previously accepted terms
    useEffect(() => {
        AsyncStorage.getItem(EULA_STORAGE_KEY).then(value => {
            if (value === 'true') setTermsAccepted(true);
        });
    }, []);

    useEffect(() => {
        const prepare = async () => {
            if (fontsLoaded) {
                await SplashScreen.hideAsync();
            }
        };
        prepare();
    }, [fontsLoaded]);

    // Google Auth Setup
    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: '',
        androidClientId: '',
        webClientId: '',
        scopes: ['profile', 'email'],
    });


    // Handle Google Sign In
    useEffect(() => {
        if (response?.type === 'success') {
            const {authentication} = response;
            if (authentication?.accessToken) {
                const credential = GoogleAuthProvider.credential(
                    null,
                    authentication.accessToken
                );
                signInWithCredential(auth, credential).catch((err) => {
                    console.error('Firebase sign-in error:', err);
                });
            }
        }
    }, [response]);

    // Handle Apple Sign In
    const handleAppleSignIn = async () => {
        try {
            // ❶ Request Apple credential
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            // ❷ Optional: Extract name (only returned first time, if user shares it)
            const firstName = credential?.fullName?.givenName || '';
            const lastName = credential?.fullName?.familyName || '';
            const combinedName = `${firstName} ${lastName}`.trim();

            // ❸ Prepare Firebase credential
            const provider = new OAuthProvider('apple.com');
            const oauthCredential = provider.credential({
                idToken: credential.identityToken,
                rawNonce: credential.nonce,
            });

            // ❹ Sign in with Firebase
            await signInWithCredential(auth, oauthCredential);

            // ❺ Optionally store the name in Firestore if available
            if (combinedName) {
                const userRef = doc(db, '', auth.currentUser.uid);
                await setDoc(userRef, {displayName: combinedName}, {merge: true});
            }
        } catch (error) {
            console.error('Apple sign-in error:', error);
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    const handleTermsAcceptance = async (accepted: boolean) => {
        setTermsAccepted(accepted);
        try {
            await AsyncStorage.setItem(EULA_STORAGE_KEY, accepted.toString());
        } catch (error) {
            console.error('Error saving terms acceptance:', error);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light"/>
            <ImageBackground
                source={require('@/assets/images/splash.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/hylytr-baseball-white-large.png')}
                            style={styles.logoImage}
                        />
                        <Text style={styles.logoText}>Baseball</Text>
                    </View>

                    <Surface style={styles.buttonContainer}>
                        <View style={styles.termsContainer}>
                            <View style={styles.checkboxRow}>
                                <TouchableOpacity
                                    onPress={() => handleTermsAcceptance(!termsAccepted)}
                                    style={styles.checkbox}
                                >
                                    {termsAccepted ? (
                                        <Ionicons name="checkmark-circle" size={24} color="#4285F4"/>
                                    ) : (
                                        <Ionicons name="ellipse-outline" size={24} color="#4285F4"/>
                                    )}
                                </TouchableOpacity>
                                <Button
                                    mode="text"
                                    compact
                                    onPress={() => setShowFullEula(true)}
                                    style={styles.readMoreButton}
                                >
                                    I agree to the terms of service (EULA)
                                </Button>
                            </View>

                        </View>
                        <Button
                            mode="contained"
                            icon="google"
                            onPress={() => promptAsync()}
                            disabled={!request || !termsAccepted}
                            style={[
                                styles.googleButton,
                                !termsAccepted && styles.disabledButton
                            ]}
                            labelStyle={styles.buttonLabel}
                        >
                            Continue with Google
                        </Button>

                        {Platform.OS === 'ios' && (
                            <Button
                                mode="contained"
                                icon="apple"
                                onPress={handleAppleSignIn}
                                labelStyle={styles.buttonLabel}
                                disabled={!termsAccepted}
                                style={[
                                    styles.appleButton,
                                    !termsAccepted && styles.disabledButton
                                ]}
                            >
                                Continue with Apple
                            </Button>
                        )}
                    </Surface>
                </View>
            </ImageBackground>
            {/* Full EULA Dialog */}
            <Portal>
                <Dialog visible={showFullEula} onDismiss={() => setShowFullEula(false)}>
                    <Dialog.Title>Terms of Service</Dialog.Title>
                    <Dialog.ScrollArea style={styles.scrollArea}>
                        <ScrollView>
                            <Text style={styles.eulaText}>{EULA_CONTENT}</Text>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setShowFullEula(false)}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'space-between',
        paddingTop: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginVertical: 60,
    },
    logoText: {
        fontSize: 28,
        marginTop: 8,
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: -1, height: 1},
        textShadowRadius: 10,
        fontFamily: 'RockSalt-Regular',
    },
    tagline: {
        fontSize: 16,
        color: 'white',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: -1, height: 1},
        textShadowRadius: 10,
    },
    buttonContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        padding: 20,
        margin: 20,
        elevation: 4,
    },
    googleButton: {
        marginBottom: 12,
        padding: 8,
        backgroundColor: '#4285F4',
    },
    appleButton: {
        marginBottom: 12,
        padding: 8,
        backgroundColor: '#000',
    },
    buttonLabel: {
        fontSize: 16,
        padding: 4,
    },
    termsText: {
        textAlign: 'center',
        fontSize: 10,
        color: '#666',
        marginTop: 8,
    },
    logoImage: {
        width: 310,
        height: 104,
        resizeMode: 'contain',
    },
    scrollArea: {
        maxHeight: 600,
    },
    eulaText: {
        lineHeight: 20,
    },
    termsContainer: {
        marginBottom: 16,
    },
    checkboxContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
    },
    checkbox: {
    },
    readMoreButton: {
    },
    disabledButton: {
        backgroundColor: '#ccc',  // or any color you prefer
        opacity: 0.7,
    },

});
