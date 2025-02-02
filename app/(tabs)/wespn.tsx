// 1) Import and define your new interface so it matches what's in "public_videos".
import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, ScrollView, Image, View, ActivityIndicator, RefreshControl} from 'react-native';
import {Card, Chip, Menu, IconButton, Text, Snackbar} from 'react-native-paper';
import {getDocs, collection, doc, updateDoc, query, orderBy, limit} from 'firebase/firestore';
import {db} from '@/utility/firebaseConfig';
import {useNavigation} from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import {util} from "protobufjs";
import float = util.float;

interface Highlight {
    // [1] Keep a separate field for the Firestore doc ID:
    id: string;               // 'id' field from your original video
    image: string;
    moment_name: string;
    clip_team_name: string;
    minute?: string;
    title?: string;
    description?: string;
    flagged?: boolean;
    video?: string;
    // ... other fields
}

export default function HomeScreen() {
    // 2) State for highlights, loading, etc.
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // for pull-to-refresh
    const [menuVisible, setMenuVisible] = useState<number | null>(null);
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    const navigation = useNavigation();

    const fetchData = useCallback(async () => {
        // [1] Set loading state
        setLoading(true);
        try {
            // [2] Build a Firestore query:
            const videosQuery = query(
                collection(db, ''),
                orderBy('sharedAt', 'desc'),
                limit(100)
            );

            // [3] Execute the query
            const querySnapshot = await getDocs(videosQuery);
            const items: Highlight[] = [];

            // [4] Iterate through docs to map data with doc ID
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data() as Omit<Highlight, 'id'>;
                items.push({
                    id: docSnap.id,
                    ...data
                });
            });

            // [5] Filter out flagged highlights and update state
            setHighlights(items.filter(item => !item.flagged));
        } catch (error) {
            // [6] Log any errors
            console.error('Error fetching public_videos:', error);
        } finally {
            // [7] Reset loading and refreshing states
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // [3] Fetch once on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // [4] Pull-to-refresh handler
    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };



    // 4) Handle "Report" by setting flagged = true on the doc in "public_videos".
    const handleReport = async (index: number) => {
        try {
            const highlight = highlights[index];
            if (!highlight.id) {
                console.error('No doc ID found for highlight');
                return;
            }
            console.log(highlight)
            const highlightRef = doc(db, '', highlight.id);
            // Update the doc to set flagged: true
            await updateDoc(highlightRef, {flagged: true});
            // Update local state to remove from the list
            setHighlights(prev =>
                prev.filter((_, i) => i !== index)
            );
            setSnackbarVisible(true);
            console.log('Successfully flagged highlight in ');
        } catch (error) {
            console.error('Error flagging highlight:', error);
        } finally {
            setMenuVisible(null);
        }
    };

    // 5) Utility to truncate text
    const truncateText = (text: string, maxLength: number) => {
        if (!text) return '';
        return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
    };

    // 6) If still loading, show a spinner
    if (loading) {
        return (
            <View style={styles.centeredLoading}>
                <ActivityIndicator size="large"/>
            </View>
        );
    }

    // 7) Render the list of highlights from public_videos
    return (
        <View>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                }
            >
                {highlights.map((highlight, index) => (
                    <Card
                        key={highlight.id}
                        style={styles.card}
                        onPress={() => navigation.navigate('Video', {highlight})}
                    >
                        <Image source={{uri: highlight.image}} style={styles.cardCover}/>
                        <Card.Content>
                            {/* [1] Always have two children in a row: a left View for the chip, a right View for the menu. */}
                            <View style={styles.headerRow}>
                                {/* Left side for the chip */}
                                <View style={styles.leftSide}>
                                    {highlight.moment_name && (
                                        <Chip style={styles.chip} textStyle={styles.chipText}>
                                            {highlight.moment_name}
                                        </Chip>
                                    )}
                                </View>

                                {/* Right side for the three-dots menu */}
                                <View>
                                    <Menu
                                        visible={menuVisible === index}
                                        onDismiss={() => setMenuVisible(null)}
                                        anchor={
                                            <IconButton
                                                icon="dots-horizontal"
                                                size={20}
                                                onPress={() => setMenuVisible(index)}
                                                style={styles.menuButton}
                                            />
                                        }
                                    >
                                        {/* 2) The lines that were omitted: */}
                                        <Menu.Item onPress={() => handleReport(index)} title="Report"/>
                                        <Menu.Item onPress={() => setMenuVisible(null)} title="Cancel"/>
                                    </Menu>
                                </View>
                            </View>


                            <Text style={styles.teamName}>{highlight.clip_team_name}</Text>
                            <Text variant="titleLarge">{highlight.title}</Text>

                            {/* Show description, truncated to 125 chars */}
                            {highlight.description && (
                                <View style={styles.descriptionContainer}>
                                    <Markdown style={markdownStyles} numberOfLines={3}>
                                        {truncateText(highlight.description, 125)}
                                    </Markdown>
                                    {highlight.description.length > 125 && (
                                        <Text
                                            style={styles.readMore}
                                            onPress={() => navigation.navigate('Video', {highlight})}
                                        >
                                            Read more
                                        </Text>
                                    )}
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={styles.snackbar}
            >
                Thank you for your report. The video will be reviewed.
            </Snackbar>
        </View>
    );
}

// 8) Styles
const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 0,
    },
    cardCover: {
        margin: 0,
        padding: 0,
        aspectRatio: 16 / 9,
        width: '100%',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    headerRow: {
        flexDirection: 'row',            // Lay out horizontally
        justifyContent: 'space-between', // Name on left, menu on right
        alignItems: 'center',            // Vertically centered
        marginVertical: 8,
    },
    chip: {
        alignSelf: 'flex-start',
        marginVertical: 8,
        backgroundColor: '#041E42',
    },
    chipText: {
        color: '#FFF',
        marginVertical: 2,
    },
    menuButton: {
        margin: 0,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    descriptionContainer: {
        marginTop: 8,
    },
    readMore: {
        color: '#3498db',
        marginTop: 4,
        fontWeight: '500',
    },
    centeredLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    snackbar: {
        marginBottom: 80,
    },
});

// 9) Markdown styles
const markdownStyles = {
    body: {
        color: '#333',
        fontSize: 14,
    },
    paragraph: {
        marginVertical: 8,
    },
    heading1: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    heading2: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 8,
    },

};
