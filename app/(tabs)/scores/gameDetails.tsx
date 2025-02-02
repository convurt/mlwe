// (1) Add a filter step after fetching allPlays so you only see certain events (e.g. "Double")
//     You can adjust the filter logic to match "Single", "Home Run", etc.

// GameDetailsScreen.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, ActivityIndicator, FlatList, StyleSheet} from 'react-native';
import {Button, Surface, Title} from 'react-native-paper';
import {router} from "expo-router";
import {useLocalSearchParams} from 'expo-router';

interface Play {
    playId: string;
    description: string;
    inning?: number;
    halfInning?: string;
    // Add other fields if needed
}

export default function GameDetails() {
    // (2) Get route params from React Navigation
    const {search, gamePk} = useLocalSearchParams();
    console.log('GameDetailsScreen gamePk:', gamePk);
    console.log('GameDetailsScreen search:', search);


    // (3) Local states
    const [plays, setPlays] = useState<Play[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [homeId, setHomeId] = useState<number | null>(null);
    const [awayId, setAwayId] = useState<number | null>(null);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [homeTeam, setHomeTeam] = useState<any>(null);
    const [awayTeam, setAwayTeam] = useState<any>(null);
    const [gameDate, setGameDate] = useState('');

    // (4) Fetch plays data
    // (4) Fetch and filter plays
    useEffect(() => {
        if (!gamePk) return;

        (async () => {
            try {
                const response = await fetch(
                    `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`
            );
                const data = await response.json();

                // (4) Extract team info from gameData
                const gameData = data?.gameData;
                const homeTeam = gameData?.teams?.home;
                const awayTeam = gameData?.teams?.away;

                setAwayTeam(awayTeam);
                setHomeTeam(homeTeam);

                // (3) Extract current runs (scores) from liveData.linescore
                const liveData = data?.liveData;
                const homeRuns = liveData?.linescore?.teams?.home?.runs ?? 0;
                const awayRuns = liveData?.linescore?.teams?.away?.runs ?? 0;

                // (3.3) Extract date from gameData.datetime
                // Adjust 'dateTime' if you want it in a different format
                const extractedDate = gameData?.datetime?.dateTime || 'No date found';
                setGameDate(extractedDate);

                // [2] Update state -> triggers a re-render if new data
                setHomeScore(homeRuns);
                setAwayScore(awayRuns);

                // (5) Build a title like "HomeTeam vs AwayTeam"
                if (homeTeam && awayTeam) {
                    const newTitle = `${homeTeam.name} vs ${awayTeam.name}`;
                    setTitle(newTitle);

                    // (6) Capture the IDs if needed
                    setHomeId(homeTeam.id);
                    setAwayId(awayTeam.id);
                }

                const allPlays = data?.liveData?.plays?.allPlays || [];

                // (3) Filter by event type
                const filteredPlays = allPlays.filter((p: any) => {
                    const ev = p.result?.event?.toLowerCase() || '';
                    return (
                        ev.includes('double') ||
                        ev.includes('triple') ||
                        ev.includes('error') ||
                        ev.includes('home run')
                    );
                });

                // (4) For the real playId, use the last pitch event in p.playEvents
                const mappedPlays: Play[] = filteredPlays.map((p: any) => {
                    const events = p.playEvents || [];
                    const lastEvt = events[events.length - 1];
                    return {
                        playId: lastEvt?.playId ?? 'NO_PLAYID', // real ID or fallback
                        description: p.result?.description || 'No description',
                        inning: p.about?.inning || 0,
                        halfInning: p.about?.halfInning || 'top',
                    };
                });
                setPlays(mappedPlays);
                //console.log('Filtered plays:', mappedPlays);
            } catch (error) {
                console.error('GameDetails fetch error:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, [gamePk]);

    // [8] Handle navigation to the UploadVideoScreen, passing the gamePk
    const handleAddHighlight = () => {
        const playsString = JSON.stringify(plays);
        router.push({pathname: '/videoUpload', params: {gamePk, title, gameDate, game_history: playsString}});
    };


    // (7) Show loading spinner if needed
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large"/>
            </View>
        );
    }


    // (8) Render each play
    const renderPlay = ({item}: { item: Play }) => {
        return (
            <View style={styles.playItem}>
                <Text style={styles.playText}>{item.description}</Text>
                <Text style={styles.playText}>Inning: {item.inning}</Text>
            </View>
        );
    };

    // (9) Main UI with FlatList
    return (
        <View style={styles.container}>
            {/* Game Header */}
            <Surface style={styles.headerContainer}>
                <View style={styles.teamContainer}>
                    <View style={styles.teamScore}>
                        <Title style={styles.teamName}>{awayTeam?.name}</Title>
                        <Text style={styles.score}>{awayScore}</Text>
                    </View>
                    <Text style={styles.divider}>-</Text>
                    <View style={styles.teamScore}>
                        <Text style={styles.score}>{homeScore}</Text>
                        <Title style={styles.teamName}>{homeTeam?.name}</Title>
                    </View>
                </View>
            </Surface>

            <View>
                <Button
                    mode="contained"
                    style={styles.button}
                    onPress={handleAddHighlight}
                >
                    Add Your Own Highlight with WeSPN
                </Button>
            </View>
            <FlatList
                data={plays}
                keyExtractor={(p) => p.playId}
                renderItem={renderPlay}
            />
        </View>
    );
}

// (10) Basic styles
const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    playItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    playText: {
        fontSize: 14,
        color: '#000',
    },
    button: {
        marginTop: 8,
        marginBottom: 16,
        marginHorizontal: 16,
    },
    headerContainer: {
        padding: 16,
        marginBottom: 8,
        elevation: 1,
    },
    teamContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    teamScore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    teamName: {
        fontSize: 16,
    },
    score: {
        fontSize: 16,
        marginHorizontal: 4,
    },
    divider: {
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 4,
    },
    gameInfo: {
        textAlign: 'center',
        color: '#666',
    },
});
