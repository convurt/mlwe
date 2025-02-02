// UploadVideoScreen.tsx
// 1) Use "MomentSelectorModal" (renamed from "EventSelectorModal")
// 2) Rename all references to "Moment"
// 3) Trigger modal after video selection, then upload after moment is chosen

import React, {useState, useEffect} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Button, ActivityIndicator, useTheme} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import {getFirestore, doc, collection, onSnapshot, query, orderBy} from 'firebase/firestore';
import {useSettings} from '@/utility/SettingsContext';
import {useNavigation} from "@react-navigation/native";
import {VideoDoc, Moment} from '@/components/Types';
import {uploadVideoAndThumbnail} from '@/utility/uploadService';
import VideoCard from '@/components/VideoCard';
import MomentSelectorModal from '@/components/MomentSelectorModal';
import {useLocalSearchParams} from 'expo-router';

export default function UploadVideoScreen() {

    // [3] Extract gamePk from the search parameters
    const {gamePk, title, gameDate, game_history} = useLocalSearchParams();
    //console.log('gamePk:', plays);

    // 5) Local states
    const [modalVisible, setModalVisible] = useState(false); // (6) Controls the Moment modal
    const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
    const [uploading, setUploading] = useState(false);
    const [videos, setVideos] = useState<VideoDoc[]>([]);
    const [localVideoUri, setLocalVideoUri] = useState('');
    const gameName = title ?? '';

    //console.log('gameName:', gameName);

    const {user, settings} = useSettings();
    const theme = useTheme();
    const navigation = useNavigation();
    const db = getFirestore();



    // 7) Listen for user's uploaded videos
    useEffect(() => {
        if (!user?.uid) return;
        const userDocRef = doc(db, '', user.uid);
        const videosRef = collection(userDocRef, 'videos');
        const q = query(videosRef, orderBy('uploadedAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const newVideos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as VideoDoc));
            setVideos(newVideos);
        });
    }, [user]);

    // 8) Prompt for video selection, then open Moment modal
    const pickVideo = async () => {
        if (uploading) return;

        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Camera roll permission is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 1
        });

        if (!result.canceled && result.assets?.length) {
            setLocalVideoUri(result.assets[0].uri);
            setModalVisible(true); // (9) Open the modal to pick a Moment
        }
    };

    // 10) Handle selected moment, then start the upload
    const handleSelectMoment = async (moment: Moment) => {
        if (!user?.uid || !localVideoUri) return;

        setSelectedMoment(moment);
        setModalVisible(false); // (11) Close the modal right after choosing
        setUploading(true);

        try {
            // (12) Upload the video and thumbnail to Firestore/Storage
            await uploadVideoAndThumbnail(localVideoUri, moment, user.uid, settings, gamePk, gameName, gameDate, game_history);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading video: ' + error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            {uploading ? (
                // 13) Show a loader while uploading
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loading}/>
            ) : (
                <Button mode="contained" style={styles.button} onPress={pickVideo}>
                    Pick A Video From Library
                </Button>
            )}

            {/* 14) Renders the MomentSelectorModal to pick a Moment before uploading */}
            <MomentSelectorModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelectMoment={handleSelectMoment}
            />

            <ScrollView style={styles.scrollArea}>
                {videos.map((video) => (
                    <VideoCard
                        key={video.id}
                        video={video}
                        onPress={() => navigation.navigate('Video', {highlight: video})}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

// 15) Basic styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loading: {
        marginVertical: 8
    },
    scrollArea: {
        marginTop: 16
    },
    button: {
        marginTop: 16,
        marginHorizontal: 16,
    },
    headerRow: {
        flexDirection: 'row',            // Lay out horizontally
        justifyContent: 'space-between', // Name on left, menu on right
        alignItems: 'center',            // Vertically centered
        marginVertical: 8,
    },
});
