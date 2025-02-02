import React, {useEffect, useState, useMemo} from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import {Searchbar, IconButton, Divider} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {router, useLocalSearchParams} from 'expo-router';

interface TeamData {
    id: number;
    name: string;
}

interface GameTeam {
    score: number;
    team: TeamData;
    isWinner: boolean;
}

interface Game {
    gamePk: number;
    gameDate: string;
    status: { detailedState: string };
    teams: { away: GameTeam; home: GameTeam };
}

// (1) Utility to remove duplicates
function removeDuplicates(games: Game[]): Game[] {
    const seen = new Set<number>();
    return games.filter((g) => {
        if (seen.has(g.gamePk)) return false;
        seen.add(g.gamePk);
        return true;
    });
}

export default function PaginatedMLBScoresScreen() {
    const navigation = useNavigation();
    // (2) We only fetch & set once
    const [allGames, setAllGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const {search} = useLocalSearchParams() as { search?: string };
    // console.log('search:', search);

    // (3) Pagination state
    const [page, setPage] = useState<number>(1);
    const PAGE_SIZE = 50;

    // (4) Search
    const [searchQuery, setSearchQuery] = useState('');

    // (6) Once we have 'search', set it to the local searchQuery if present
    useEffect(() => {
        if (search) {
            setSearchQuery(search);
        }
    }, [search]);

    // ----------------------------------------------------------------
    // FETCH on mount, store in allGames, no repeated calls
    // ----------------------------------------------------------------
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const response = await fetch(
                    'https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=2024&gameType=R'
                );
                const data = await response.json();
                if (!mounted) return;

                // Flatten out everything
                // Example: sorting dates descending by date
                data.dates.sort((a, b) => new Date(b.date) - new Date(a.date));

                // Then flatten in sorted order
                let flattened = [];
                data.dates.forEach((dateObj) => {
                    (dateObj.games || []).forEach((g) => {
                        flattened.push(g);
                    });
                });

                // Remove duplicates
                flattened = removeDuplicates(flattened);
                setAllGames(flattened);
            } catch (error) {
                console.error('MLB fetch error:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []); // empty dependency => runs once

    // ----------------------------------------------------------------
    // FILTER + PAGINATE in a stable memo
    // ----------------------------------------------------------------
    const filteredGames = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return allGames.filter((g) => {
            const awayName = g.teams.away.team.name.toLowerCase();
            const homeName = g.teams.home.team.name.toLowerCase();
            return awayName.includes(q) || homeName.includes(q);
        });
    }, [allGames, searchQuery]);

    // Decide how many of the filtered games to show
    const displayedGames = useMemo(() => {
        const sliceEnd = page * PAGE_SIZE;
        return filteredGames.slice(0, sliceEnd);
    }, [filteredGames, page]);

    // ----------------------------------------------------------------
    // SCROLL: load more if available
    // ----------------------------------------------------------------
    const handleEndReached = () => {
        if (displayedGames.length < filteredGames.length) {
            setPage((prev) => prev + 1);
        }
    };

    // ----------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large"/>
            </View>
        );
    }


    // Single row
    const renderGame = ({item}: { item: Game }) => {
        const {away, home} = item.teams;
        return (
            <TouchableOpacity
                style={styles.gameBlock}
                onPress={() => {
                    // (B) Navigate to 'GameDetailsScreen' with param:
                    router.push(`/(tabs)/scores/gameDetails?gamePk=${item.gamePk}`);
                }}
            >
                {/* Away row */}
                <View style={styles.teamRow}>
                    <View style={styles.leftContainer}>
                        {away.isWinner && (
                            <IconButton icon="star" size={16} style={styles.iconStyle}/>
                        )}
                        <Text style={[styles.teamName, away.isWinner && styles.winnerText]}>
                            {away.team.name}
                        </Text>
                    </View>
                    <Text style={styles.score}>{away.score}</Text>
                </View>
                <Divider style={styles.divider}/>

                {/* Home row */}
                <View style={styles.teamRow}>
                    <View style={styles.leftContainer}>
                        {home.isWinner && (
                            <IconButton icon="star" size={16} style={styles.iconStyle}/>
                        )}
                        <Text style={[styles.teamName, home.isWinner && styles.winnerText]}>
                            {home.team.name}
                        </Text>
                    </View>
                    <Text style={styles.score}>{home.score}</Text>
                </View>

                {/* Status/date row */}
                <View style={styles.statusRow}>
                    <Text style={styles.statusText}>
                        {item.status.detailedState}
                        {item.gameDate ? ` · ${item.gameDate.substring(0, 10)}` : ''}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Search */}
            <Searchbar
                placeholder="Search teams..."
                value={searchQuery}
                onChangeText={(text) => {
                    // reset to first page on new search
                    setPage(1);
                    setSearchQuery(text);
                }}
                style={styles.searchbar}
            />

            {/* Paginated list */}
            <FlatList
                data={displayedGames}
                keyExtractor={(g) => String(g.gamePk)}
                renderItem={renderGame}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.4}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    searchbar: {
        margin: 8,
        borderRadius: 8,
    },
    listContent: {
        paddingHorizontal: 8,
        paddingBottom: 16,
    },
    gameBlock: {
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        marginVertical: 6,
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconStyle: {
        margin: 0,
    },
    teamName: {
        fontSize: 16,
        marginLeft: 4,
    },
    winnerText: {
        color: '#1976D2',
        fontWeight: '600',
    },
    score: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 4,
    },
    statusRow: {
        marginTop: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#666',
    },
});
