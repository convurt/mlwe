// I just replaced your Image with an example SvgUri so that you could see how to load an SVG
// in that same card if you wanted. You can absolutely keep your original <Image> using the
// libraryImage asset if you prefer.
//
// Here’s a version that keeps your original “WeSPN” card exactly the same as before, still
// using libraryImage, and only adds the new logic for showing the favorite teams as SVG if desired.

import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, Image} from 'react-native';
import {Card, Title, Paragraph, Button} from 'react-native-paper';
import {useRouter} from 'expo-router';
import {useSettings} from '@/utility/SettingsContext';
import {getFirestore, doc, onSnapshot} from 'firebase/firestore';
import libraryImage from '@/assets/images/field-camera.png';
import newImage from '@/assets/images/select-team.png';
import {SvgUri} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import MlbTeamSearchScreen from "@/app/MlbTeamSearchScreen";

function FavTeamLogo({team}: { team: any }) {
    const [logoFailed, setLogoFailed] = useState(false);
    const router = useRouter();

    if (logoFailed) {
        return (
            <View style={styles.favItem}>
                <Ionicons name="baseball-outline" size={40} color="#aaa"/>
                <Text style={styles.favText}>
                    {team.name}
                </Text>
            </View>
        );
    }

    return (
        <Button style={styles.favItem} mode="outlined" onPress={() => router.push(`/(tabs)/scores?search=${encodeURIComponent(team.name)}`)}>
            <SvgUri
                width={40}
                height={40}
                uri={team.logo}
                onError={(err) => {
                    console.error(`SVG load error for ${team.name}`, err);
                    setLogoFailed(true);
                }}
            />
        </Button>
    );
}

export default function LibraryScreen() {
    const router = useRouter();
    const {user} = useSettings();
    const userID = user?.uid;

    const [favoriteTeams, setFavoriteTeams] = useState<any[]>([]);

    useEffect(() => {
        if (!userID) return;
        const db = getFirestore();
        const userRef = doc(db, 'users', userID);
        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setFavoriteTeams(data.favoriteTeams || []);
            }
        });
        return () => unsubscribe();
    }, [userID]);



    return (
        <View style={{flex: 1}}>
            {/* (1) Keep your original WeSPN card as-is, with libraryImage */}
            <Card style={styles.card} onPress={() => router.push('/WeSPN')}>
                <View style={styles.coverContainer}>
                    <Image
                        source={libraryImage}
                        style={styles.cardCover}
                        resizeMode="cover"
                    />
                </View>
                <Card.Content>
                    <Title>WeSPN: The People&apos;s Playbook</Title>
                    <Paragraph>Step into the commentary box...</Paragraph>
                </Card.Content>
            </Card>

            {/* (2) If no favorites, show the 'Favorite Teams' card as usual; otherwise show the logos */}
            {favoriteTeams.length === 0 ? (
                <Card style={styles.card} onPress={() => router.push('/MlbTeamSearchScreen')}>
                    <View style={styles.coverContainer}>
                        <Image
                            source={newImage}
                            style={styles.cardCover}
                            resizeMode="cover"
                        />
                    </View>
                    <Card.Content>
                        <Title>Favorite Teams</Title>
                        <Paragraph>Customize your lineup of favorite teams to follow.</Paragraph>
                    </Card.Content>
                </Card>
            ) : (
                <View style={styles.favContainer}>
                    <Text style={styles.favTitle}>Your Favorite Teams</Text>
                    <View style={styles.favRow}>
                        {favoriteTeams.map((team) => (
                            <FavTeamLogo key={team.teamID} team={team}/>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    coverContainer: {
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardCover: {
        width: '100%',
        height: '100%',
    },
    favContainer: {
        margin: 16,
    },
    favTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 16,
        textAlign: 'center',
    },
    favRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    favItem: {
        width: 1/4 * 100 + '%',
        alignItems: 'center',
        marginHorizontal: 8,
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
    },
    favText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
});
