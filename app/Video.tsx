// [1] Import the function that calls your removed describe-video endpoint.
// Adjust the path if your file structure is different.
import React, {useRef, useState} from 'react';
import {View, StyleSheet, ScrollView, Share, Alert} from 'react-native';
import {ActivityIndicator, Title, Paragraph, IconButton, Chip, Text, Button, TextInput, useTheme, Menu} from 'react-native-paper';
import {useRoute} from '@react-navigation/native';
import {Video} from 'expo-av';
import {useSettings} from "@/utility/SettingsContext";
import {collection, doc, getFirestore, updateDoc} from "firebase/firestore";
import Markdown from 'react-native-markdown-display';
import {deleteVideoOnServer, describeVideo} from '@/utility/apiDescribe';
import UtilityMenu from '@/utility/UtilityMenu';
import {router} from "expo-router";
import { shareVideoToPublic} from "@/utility/shareFunctions";

function normalizeHighlight(h) {
    // Check if this is a user video (has videoUrl) or general feed video (has video)
    const isUserVideo = !!h.videoUrl;

    return {
        image: h.thumbnailUrl || h.image || '',
        video: h.videoUrl || h.video || '', // User videos use videoUrl, feed uses video
        id: h.id || h.clip_id || '',
        title: h.title || '',
        clip_team_name: h.clip_team_name || '',
        moment_name: h.moment_name || '',
        description: h.description || '',
        isUserVideo: isUserVideo, // Flag to track source
        uploadedAt: h.uploadedAt || null, // Only user videos have this
        videoFileName: h.videoFileName || '', // Original filename for user videos
        docId: h.docId || '',
    };
}

export default function VideoScreen() {
    const route = useRoute();
    const highlightParam = route.params?.highlight || {};
    const {user, settings} = useSettings();
    const highlight = normalizeHighlight(highlightParam);
    // console.log(highlight)

    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [title, setTitle] = useState(highlight?.title || '');
    const [description, setDescription] = useState(highlight?.description || '');
    const [message, setMessage] = useState('');
    const [generating, setGenerating] = useState(false);
    const theme = useTheme();

    // Menu & Snackbar states
    const [menuVisible, setMenuVisible] = useState(null);
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    // For user videos
    const canEdit = highlight.isUserVideo && user?.uid;

    // Handler for UtilityMenu's "Delete"
    const handleDelete = async () => {
        try {
            // Example: pass the video ID or URL to your removed
            setGenerating(true);
            await deleteVideoOnServer({video_id: highlight.id, video_name: highlight.videoFileName, user_id: user.uid});
            // if delete, remove from UI, alert message confirming, and back up screen
            setGenerating(false);
            Alert.alert('Video deleted successfully!');
            console.log('Deleted video:', highlight.video);
            router.back();
        } catch (error) {
            console.error('Error deleting:', error);
            setGenerating(false);
        } finally {
            setGenerating(false);
        }
    };

    // Handler for UtilityMenu's "Share on Social"
    async function handleShareSocial() {
        try {
            // Format a nicer message
            const shareMessage =
                `${title}\n\n` +
                `${description}\n\n` +
                `Watch it here: ${highlight.video}`;

            // For iOS, you can also supply `url: videoUrl` alongside `message`
            await Share.share({
                message: shareMessage,
                url: highlight.video, // sometimes recognized by iOS
            });
        } catch (err) {
            console.error('Share error:', err);
        }
    }

    // Handler for UtilityMenu's "Share on WeSPN" (placeholder)
    const handleShareWeSPN = async () => {
        try {
            // highlight is your current highlight object
            // user.id is the current user
            await shareVideoToPublic(highlight, user.uid);
            console.log('Successfully shared to new public_videos collection');
        } catch (error) {
            console.error('Share failed:', error);
        }
    };

    // [2] Existing save function
    const handleSave = async () => {
        if (!canEdit) return;

        try {
            const db = getFirestore();
            const userDocRef = doc(db, 'users', user.uid);
            const videosRef = collection(userDocRef, 'videos');

            await updateDoc(doc(videosRef, highlight.id), {
                title,
                description,
            });

            setMessage('Saved!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving:', error);
            setMessage('Error saving changes');
        }
    };

    // [3] New function to generate commentary from removed
    const handleGenerateCommentary = async () => {
        /*
         payload: used to send relevant data to your removed.
         - video_id, user_id: Required by your removed to identify the video doc.
         - style, gender, accent, video_name: Example fields to control commentary style.
        */
        // 4e) Build your commentator prompt details
        const contextStr = 'baseball'; // default
        const style = settings?.commentator?.style;
        const gender = settings?.commentator?.gender;
        const accent = settings?.commentator?.accent;

        setGenerating(true);
        setMessage('Generating commentary...');


        try {
            const payload = {
                video_id: highlight.id,
                user_id: user.uid,                 // The current user ID
                style: style || "exciting",        // Optional style
                gender: gender || "male",          // Optional gender
                accent: accent || "normal USA",    // Optional accent
                video_name: highlight.videoFileName, // or your original "videoFileName"
            };
            // console.log('Payload:', payload);

            // Calls your describeVideo function (removed)
            const {title: newTitle, description: newDescription} = await describeVideo(payload);

            // Update local state
            setTitle(newTitle);
            setDescription(newDescription);

            // Optionally save to Firestore (saving in main online function)
            // await handleSave();

            setMessage('');
        } catch (error) {
            console.error('Error generating commentary:', error);
            setMessage('Error generating commentary');
        } finally {
            setGenerating(false);
        }
    };

    // [4] Video player controls (no changes)
    const handlePlayPause = () => {
        if (isPlaying) {
            videoRef.current?.pauseAsync();
        } else {
            videoRef.current?.playAsync();
        }
        setIsPlaying(!isPlaying);
    };

    const handleReplay = () => {
        videoRef.current?.setPositionAsync(0);
        videoRef.current?.playAsync();
        setIsPlaying(true);
    };

    const handleFastForward = () => {
        videoRef.current?.getStatusAsync().then(status => {
            if (status.isLoaded) {
                videoRef.current?.setPositionAsync(status.positionMillis + 10000);
            }
        });
    };

    const handleRewind = () => {
        videoRef.current?.getStatusAsync().then(status => {
            if (status.isLoaded) {
                videoRef.current?.setPositionAsync(Math.max(status.positionMillis - 10000, 0));
            }
        });
    };

    return (
        <View style={styles.container}>
            {/* Fixed video section */}
            <View style={styles.videoSection}>
                <Video
                    ref={videoRef}
                    source={{uri: highlight.video}}
                    rate={1.0}
                    volume={1.0}
                    isMuted={false}
                    shouldPlay
                    style={styles.video}
                />
                <View style={styles.controls}>
                    <IconButton
                        icon={isPlaying ? 'pause' : 'play'}
                        size={24}
                        onPress={handlePlayPause}
                        style={styles.iconButton}
                    />
                    <IconButton
                        icon="replay"
                        size={24}
                        onPress={handleReplay}
                        style={styles.iconButton}
                    />
                    <IconButton
                        icon="rewind"
                        size={24}
                        onPress={handleRewind}
                        style={styles.iconButton}
                    />
                    <IconButton
                        icon="fast-forward"
                        size={24}
                        onPress={handleFastForward}
                        style={styles.iconButton}
                    />
                </View>
            </View>

            {/* Scrollable content section */}
            <ScrollView style={styles.scrollContent}>

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
                        {highlight.isUserVideo ? (
                        <UtilityMenu
                            index={0}
                            menuVisible={menuVisible}
                            setMenuVisible={setMenuVisible}
                            snackbarVisible={snackbarVisible}
                            setSnackbarVisible={setSnackbarVisible}
                            onDelete={handleDelete}
                            onShareSocial={handleShareSocial}
                            onShareWeSPN={handleShareWeSPN}
                        />
                        ) : null}
                    </View>
                </View>


                <Paragraph>{highlight.clip_team_name}</Paragraph>

                {/* Content section depends on whether it's a user video */}
                {highlight.isUserVideo ? (

                    // User uploaded video - show editable form
                    <View style={styles.detailsContainer}>

                        <TextInput
                            label="Title"
                            mode="outlined"
                            value={title}
                            onChangeText={setTitle}
                            style={styles.input}
                            multiline={true}
                        />
                        <TextInput
                            label="Description"
                            mode="outlined"
                            value={description}
                            onChangeText={setDescription}
                            style={styles.input}
                            multiline={true}
                        />
                        <Button mode="contained" onPress={handleSave}>
                            Save Changes
                        </Button>

                        {/* [4] Show ActivityIndicator while generating, else show "Generate Commentary" button */}
                        {generating ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} style={{marginTop: 8}}/>
                        ) : (
                            (!title.trim() && !description.trim()) && (
                                <Button mode="outlined" onPress={handleGenerateCommentary} style={{marginTop: 8}}>
                                    Generate Commentary
                                </Button>
                            )
                        )}

                        <Text style={styles.info}>{message}</Text>
                    </View>
                ) : (
                    // General feed video - show read-only content
                    <View style={styles.detailsContainer}>
                        {highlight.title && (
                            <Title style={styles.title}>{highlight.title}</Title>
                        )}
                        {highlight.description && (
                            <Markdown style={markdownStyles}>
                                {highlight.description}
                            </Markdown>
                        )}
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    videoSection: {
        backgroundColor: '#000',
        width: '100%',
    },
    video: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3, // for Android
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    contentCard: {
        margin: 8,
        elevation: 2,
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
    detailsContainer: {
        marginTop: 0,
    },
    title: {
        fontSize: 20,
        marginBottom: 8,
    },
    input: {
        marginBottom: 16,
    },
    info: {
        marginTop: 10,
        fontStyle: 'italic',
        alignSelf: 'center',
        color: 'green',
    },
});

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
