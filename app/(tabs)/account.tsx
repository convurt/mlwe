// 1) Show Firebase Auth details, add "Logout," "Delete Account," and save to Firestore.

// (a) Import required Firebase items:
import React, {useEffect} from 'react';
import {StyleSheet, View, Alert} from 'react-native';
import {Avatar, Button, Card, Title, Paragraph, List} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {signOut, deleteUser} from 'firebase/auth';
import {deleteDoc, doc, setDoc} from 'firebase/firestore';
import {auth, db} from '@/utility/firebaseConfig'; // adjust path
import {useSettings} from '@/utility/SettingsContext';
import {router} from "expo-router";


export default function AccountScreen() {
    // 2) Grab navigation + user context
    const navigation = useNavigation();
    const {user} = useSettings();

    // 3) Example: Save user details to Firestore on mount (once).
    //    Adjust this logic if you want to save only on first login, or allow updates.
    useEffect(() => {
        if (user && user.uid) {
            const userRef = doc(db, 'users', user.uid);
            setDoc(
                userRef,
                {
                    displayName: user.displayName || '',
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                },
                {merge: true} // merges so you can update without overwriting everything
            ).catch((err) => console.error('Failed to save user:', err));
        }
    }, [user]);

    // 4) Logout button => sign out from Firebase, user is set to null in onAuthStateChanged.
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    // 5) Delete user => calls Firebase deleteUser(), then logs out.
    //    Only works if the user recently logged in (Firebase security).
    //    If you get a "Requires Recent Login" error, re-auth first or prompt them to log in again.
    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            if (!auth.currentUser) return;

                            // ❶ Delete Firestore document
                            await deleteDoc(doc(db, 'users', auth.currentUser.uid));

                            // ❷ Delete Auth user
                            await deleteUser(auth.currentUser);

                        } catch (err) {
                            // ❸ If requires recent login, show message
                            if (err.code === 'auth/requires-recent-login') {
                                Alert.alert(
                                    'Security Notice',
                                    'For security, please log out and log in again before deleting your account.'
                                );
                            } else {
                                Alert.alert('Error', 'Could not delete account: ' + err.message);
                            }
                        }
                    },
                },
            ]
        );
    };

    // 6) Render the account screen
    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Avatar.Image
                        size={80}
                        source={{uri: user?.photoURL || 'https://example.com/avatar.jpg'}}
                        style={styles.avatar}
                    />
                    <Title style={styles.title}>
                        {user?.displayName || 'Anonymous User'}
                    </Title>
                    <Paragraph style={styles.title}>{user?.email || 'No email available'}</Paragraph>

                    {/* Delete account */}
                    <Button
                        mode="contained"
                        onPress={handleDeleteAccount}
                        style={styles.deleteButton}
                    >
                        Delete Account
                    </Button>

                    {/* Logout */}
                    <Button
                        mode="outlined"
                        onPress={handleLogout}
                        style={{marginTop: 8}}
                    >
                        Logout
                    </Button>
                </Card.Content>
            </Card>

            <List.Item
                title="WeSPN: The People's Playbook"
                description="Step into the commentary box with Hylytr's AI."
                style={styles.listItem}
                left={(props) => <List.Icon {...props} icon="folder"/>}
                onPress={() => navigation.navigate('WeSPN')}
            />
            <List.Item
                title="Favorite Teams"
                description="Click here to select the teams you want to follow."
                style={styles.listItem}
                left={(props) => <List.Icon {...props} icon="heart"/>}
                onPress={() => navigation.navigate('MlbTeamSearchScreen')}
            />
            <List.Item
                title="Privacy & Terms"
                description="Protection, privacy policy,and terms of service."
                style={styles.listItem}
                left={(props) => <List.Icon {...props} icon="lock"/>}
                onPress={() => navigation.navigate('EULAScreen')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    // 7) Basic styling
    container: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    title: {
        marginVertical: 8,
        textAlign: 'center',
    },
    avatar: {
        marginBottom: 16,
        alignSelf: 'center',
    },
    card: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        overflow: 'hidden',
        width: '100%',
    },
    deleteButton: {
        marginTop: 16,
        backgroundColor: '#d9534f', // Red color for delete
    },
    listItem: {
        marginVertical: 8,
        width: '100%',
        borderTopWidth: 1,
        borderColor: '#e0e0e0',
    },
});
