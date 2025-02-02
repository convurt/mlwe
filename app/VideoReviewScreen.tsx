// 1) Displays the newly uploaded video, asks for a caption/comment,
//    then hits your "Gemini" (AI commentary) endpoint with user settings.

import React, {useState} from 'react';
import {View, Text, TextInput, Button, StyleSheet} from 'react-native';
import {Video} from 'expo-av';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useSettings} from '@/utility/SettingsContext';

export default function VideoReviewScreen() {
    // 2) Retrieve the videoUrl passed from UploadVideoScreen
    const route = useRoute();
    const navigation = useNavigation();
    const {videoUrl} = route.params || {};

    // 3) Local state for user’s typed comment
    const [comment, setComment] = useState('');

    // 4) Grab user + settings from context
    const {user, settings} = useSettings();

    // 5) Submit to "Gemini" AI with user settings
    const handleSubmitToGemini = async () => {
        try {
            const requestBody = {
                userId: user?.uid,
                style: settings.style,
                gender: settings.gender,
                accent: settings.accent,
                videoUrl: videoUrl,
                userComment: comment
            };

            // Example AI endpoint; replace with your actual back-end.
            const response = await fetch('https://your-backend.com/gemini/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Gemini request failed: ${response.status}`);
            }

            const data = await response.json();
            alert(`Gemini commentary created:\n${data.commentary}`);

            // Possibly navigate to another screen or show the result more elegantly
            // navigation.navigate('SomeOtherScreen', { commentary: data.commentary });
        } catch (error) {
            console.error('Gemini error:', error);
            // @ts-ignore
            alert('Error creating commentary: ' + error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Review Your Video</Text>

            {/* Show the uploaded video */}
            {videoUrl ? (
                <Video
                    source={{uri: videoUrl}}
                    style={styles.video}
                    useNativeControls
                    resizeMode="contain"
                />
            ) : (
                <Text>No video URL provided</Text>
            )}

            {/* Text input for user to add a caption/comment */}
            <TextInput
                style={styles.textInput}
                placeholder="Add your commentary..."
                value={comment}
                onChangeText={setComment}
            />

            {/* Button to submit to Gemini AI */}
            <Button title="Generate Commentary" onPress={handleSubmitToGemini}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, padding: 16, backgroundColor: '#fff'},
    title: {fontSize: 20, fontWeight: 'bold', marginVertical: 12, textAlign: 'center'},
    video: {width: '100%', height: 250, backgroundColor: '#000'},
    textInput: {
        borderWidth: 1, borderColor: '#ccc', padding: 10,
        marginVertical: 12, borderRadius: 5
    }
});
