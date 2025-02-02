// firebaseConfig.ts
import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {initializeAuth, getReactNativePersistence} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// (2) Use initializeAuth instead of getAuth, providing AsyncStorage
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

// If you also want to export app:
export {app};
