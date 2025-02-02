// uploadService.ts
import {getStorage, ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {getFirestore, doc, collection, addDoc} from 'firebase/firestore';
import * as VideoThumbnails from 'expo-video-thumbnails';
import {Platform} from 'react-native';
import {Moment, VideoUploadPayload} from '@/components/Types';
import {describeVideo} from '@/utility/apiDescribe';

export async function uploadVideoAndThumbnail(
    videoUri: string,
    moment: Moment,
    userId: string,
    settings: any,
    gamePk: any,
    game_name: any,
    gameDate: any,
    game_history: any
) {
    const storage = getStorage();
    const db = getFirestore();
    const now = Date.now();

    // Generate thumbnail
    let localThumbUri = '';
    if (Platform.OS !== 'web') {
        const thumbResult = await VideoThumbnails.getThumbnailAsync(videoUri, {time: 0});
        localThumbUri = thumbResult.uri;
    }

    // Upload video
    const videoBlob = await (await fetch(videoUri)).blob();
    const videoFileName = `${userId}_${now}.mp4`;
    const videoFilePath = `/${videoFileName}`;
    const videoStorageRef = ref(storage, videoFilePath);

    await uploadBytes(videoStorageRef, videoBlob);
    const videoDownloadURL = await getDownloadURL(videoStorageRef);

    // Upload thumbnail if exists
    let thumbDownloadURL = '';
    if (localThumbUri) {
        const thumbBlob = await (await fetch(localThumbUri)).blob();
        const thumbFileName = `${userId}_${now}_thumb.jpg`;
        const thumbFilePath = `/${thumbFileName}`;
        const thumbStorageRef = ref(storage, thumbFilePath);

        await uploadBytes(thumbStorageRef, thumbBlob);
        thumbDownloadURL = await getDownloadURL(thumbStorageRef);
    }

    // Create Firestore document
    const userDocRef = doc(db, '', userId);
    const videosRef = collection(userDocRef, '');

    const newDocRef = await addDoc(videosRef, {
        videoUrl: videoDownloadURL,
        thumbnailUrl: thumbDownloadURL,
        uploadedAt: new Date(),
        title: '',
        description: '',
        gsUri: `removed/${videoFilePath}`,
        videoFileName,
        m_id: moment?.m_id,
        moment_name: moment?.moment_name,
        gamePk: gamePk,
        game_name: game_name,
        game_date: gameDate
    });

    // Generate description
    const payload: VideoUploadPayload = {
        video_id: newDocRef.id,
        user_id: userId,
        style: settings?.commentator?.style || "exciting",
        gender: settings?.commentator?.gender || "male",
        accent: settings?.commentator?.accent || "normal USA",
        moment_name: moment?.moment_name,
        video_name: videoFileName,
        game_name: game_name,
        game_date: gameDate,
        game_history: game_history
    };

    try {
        // console.log("Describing video:", payload);
        return await describeVideo(payload);
    } catch (error) {
        console.error("Error describing video:", error);
        return {title: '', description: ''};
    }
}
