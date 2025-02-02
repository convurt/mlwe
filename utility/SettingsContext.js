// @/utility/SettingsContext.js
import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {onAuthStateChanged} from 'firebase/auth';
import {auth} from './firebaseConfig';

const SettingsContext = createContext({
    settings: {},
    saveSettings: async () => {
    },
    user: null,
    isLoading: true
});

export function SettingsProvider({children}) {
    const [settings, setSettings] = useState({});
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings from AsyncStorage
    useEffect(() => {
        loadSettings();
    }, []);

    // Listen for Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    const loadSettings = async () => {
        try {
            const storedSettings = await AsyncStorage.getItem('settings');
            if (storedSettings) {
                setSettings(JSON.parse(storedSettings));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    return (
        <SettingsContext.Provider value={{settings, saveSettings, user, isLoading}}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
