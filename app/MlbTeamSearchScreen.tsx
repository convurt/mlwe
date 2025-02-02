import React, {useState, useEffect} from 'react';
import {View, TextInput, FlatList, Text, StyleSheet} from 'react-native';
import {
    doc,
    getFirestore,
    onSnapshot,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import {useSettings} from '@/utility/SettingsContext';
import {SegmentedButtons} from 'react-native-paper';
import {Ionicons} from '@expo/vector-icons';
import {SvgUri} from 'react-native-svg';
import {TouchableRipple} from 'react-native-paper';

type MlbTeam = {
    TeamID: number;
    Name: string;
    Key: string;
    City: string;
    Logo: string; // SVG URL
};

// (A) Child component for each row (safe place for local state hooks).
function TeamRow({
                     item,
                     isFavorite,
                     onToggle,
                 }: {
    item: MlbTeam;
    isFavorite: boolean;
    onToggle: (team: MlbTeam) => void;
}) {
    // (B) Track if the logo fails.
    const [logoFailed, setLogoFailed] = useState(false);

    return (
        <TouchableRipple onPress={() => onToggle(item)}>
            <View style={[styles.teamRow, isFavorite && styles.selectedRow]}>
                {logoFailed ? (
                    <Ionicons
                        name="baseball-outline"
                        size={40}
                        color="#aaa"
                        style={{marginRight: 10}}
                    />
                ) : (
                    <SvgUri
                        width={40}
                        height={40}
                        uri={item.Logo}
                        onError={(err) => {
                            console.error(`SVG load error for ${item.Name}`, err);
                            setLogoFailed(true);
                        }}
                    />
                )}
                <Text style={styles.teamText}>
                    {item.City} {item.Name}
                </Text>
                {isFavorite && (
                    <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="green"
                        style={styles.checkIcon}
                    />
                )}
            </View>
        </TouchableRipple>
    );
}

export default function MlbTeamSearchScreen() {
    const [searchText, setSearchText] = useState('');
    const [teams, setTeams] = useState<MlbTeam[]>([]);
    const [favoriteTeams, setFavoriteTeams] = useState<MlbTeam[]>([]);
    const [sportId, setSportId] = useState('1');

    const {user} = useSettings();
    const userID = user?.uid;
    const db = getFirestore();

    // (C) Fetch teams with .svg logos.
    useEffect(() => {
        (async () => {
            try {
                const resp = await fetch(`https://statsapi.mlb.com/api/v1/teams?sportId=${sportId}`);
                const data = await resp.json();
                if (!data.teams) {
                    setTeams([]);
                    return;
                }
                const mapped: MlbTeam[] = data.teams.map((t: any) => ({
                    TeamID: t.id,
                    Name: t.name,
                    Key: t.teamCode,
                    City: t.locationName || '',
                    Logo: `https://www.mlbstatic.com/team-logos/${t.id}.svg`,
                }));
                setTeams(mapped);
            } catch (err) {
                console.error('Error fetching teams:', err);
            }
        })();
    }, [sportId]);

    // (D) Ensure user doc, subscribe to favorites
    useEffect(() => {
        if (!userID) return;
        const userRef = doc(db, 'users', userID);

        (async () => {
            try {
                const snap = await getDoc(userRef);
                if (!snap.exists()) {
                    await setDoc(userRef, {favoriteTeams: []});
                }
                const unsub = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setFavoriteTeams(data.favoriteTeams || []);
                    }
                });
                return () => unsub();
            } catch (err) {
                console.error('Error ensuring user doc:', err);
            }
        })();
    }, [userID]);

    // (E) Filter and sort so favorites appear first
    const filteredTeams = teams.filter((team) => {
        const fullName = `${team.City} ${team.Name}`.toLowerCase();
        return fullName.includes(searchText.toLowerCase());
    });

    // Sort by isFavorite => favorites at top
    filteredTeams.sort((a, b) => {
        const aFav = favoriteTeams.some((fav) => fav.teamID === a.TeamID);
        const bFav = favoriteTeams.some((fav) => fav.teamID === b.TeamID);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
    });

    // (F) Toggle
    const toggleFavorite = async (team: MlbTeam) => {
        try {
            if (!userID) throw new Error('No userID found.');
            const userRef = doc(db, 'users', userID);
            const isFavorite = favoriteTeams.some((fav) => fav.teamID === team.TeamID);

            if (isFavorite) {
                await updateDoc(userRef, {
                    favoriteTeams: arrayRemove({
                        teamID: team.TeamID,
                        name: team.Name,
                        city: team.City,
                        key: team.Key,
                        logo: team.Logo,
                    }),
                });
            } else {
                await updateDoc(userRef, {
                    favoriteTeams: arrayUnion({
                        teamID: team.TeamID,
                        name: team.Name,
                        city: team.City,
                        key: team.Key,
                        logo: team.Logo,
                    }),
                });
            }
        } catch (err) {
            console.error('Error toggling favorite team:', err);
        }
    };

    // (G) Render each item as a <TeamRow />
    const renderItem = ({item}: { item: MlbTeam }) => {
        const isFavorite = favoriteTeams.some((fav) => fav.teamID === item.TeamID);
        return <TeamRow item={item} isFavorite={isFavorite} onToggle={toggleFavorite}/>;
    };

    return (
        <View style={styles.container}>
            <SegmentedButtons
                value={sportId}
                style={{marginBottom: 12}}
                onValueChange={setSportId}
                buttons={[
                    {value: '1', label: 'MLB'},
                    {value: '16', label: 'College'},
                    {value: '17', label: 'HighSchool'},
                ]}
            />
            <TextInput
                style={styles.searchInput}
                placeholder="Search for a team"
                value={searchText}
                onChangeText={setSearchText}
            />
            <FlatList
                data={filteredTeams}
                keyExtractor={(team) => team.TeamID.toString()}
                renderItem={renderItem}
            />
        </View>
    );
}

// (H) Basic styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    searchInput: {
        height: 40,
        borderColor: '#aaa',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingHorizontal: 8,
    },
    selectedRow: {
        backgroundColor: '#eff',
    },
    teamText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    checkIcon: {
        marginLeft: 12,
    },
});
