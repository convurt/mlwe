// 1) Pull in previously saved settings from the context when this screen first loads.
//    That way, the user's last saved style, gender, and accent automatically show up.

import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, Image, ScrollView} from 'react-native';
import {Card, Paragraph, Chip, Title, Divider, Button} from 'react-native-paper';
import libraryImage from "@/assets/images/field-camera.png";
import {useSettings} from "@/utility/SettingsContext";

export default function WeSPN() {
    // 2) Access global settings from context.
    //    We'll seed initial states from context if commentator settings exist.
    const {settings, saveSettings} = useSettings();

    // 3) Initial state is set to context's existing values (if any).
    const [selectedStyle, setSelectedStyle] = useState<string | null>(
        settings.commentator?.style || null
    );
    const [selectedGender, setSelectedGender] = useState<string | null>(
        settings.commentator?.gender || null
    );
    const [selectedAccent, setSelectedAccent] = useState<string | null>(
        settings.commentator?.accent || null
    );

    // 4) Arrays for your Chip options.
    const styleOptions = [
        'Funny',
        'Witty',
        'Serious',
        'Entertaining',
        'Old School',
        'Storyteller',
        'Stats Guru'
    ];
    const genders = ['Male', 'Female', 'Neutral'];
    const accents = ['American', 'Southern', 'Northern', 'British', 'Australian'];

    // 5) Handler function to save commentator personality to global settings (and AsyncStorage).
    const handleSaveCommentator = () => {

        // alert message to show that the settings have been saved
        alert("Commentator Personality Saved!");

        saveSettings({
            ...settings,
            commentator: {
                style: selectedStyle,
                gender: selectedGender,
                accent: selectedAccent
            }
        });
    };

    return (
        <View style={styles.container}>
        <ScrollView >
            <Card style={styles.card}>
                <View style={styles.coverContainer}>
                    <Image source={libraryImage} style={styles.cardCover} resizeMode="cover"/>
                </View>
                <Card.Content>
                    <Title>WeSPN: The People's Playbook</Title>
                    <Paragraph style={styles.paragraph}>
                        WeSPN is transforming every fan into a commentator. Powered by Hylytr's cutting-edge AI technology,
                        you can now create, share, and experience sports highlights through the authentic voices
                        of "We" the fans. WeSPN turns passionate fans into the new face of sports media.
                        Don't just watch the game – shape how it's shared with the world.
                    </Paragraph>
                    <Paragraph style={styles.paragraph}>
                        Make your mark by building your unique commentator personality. Whether you're a stats guru,
                        storyteller, or passionate superfan, customize your commentary style to match your sports perspective.
                        When you upload a video, the commentary will be generated based on your settings, capturing your
                        distinctive voice and analysis. Fine-tune the generated commentary to perfect your narrative,
                        then share it on WeSPN for the world to experience sports through your eyes.
                    </Paragraph>
                    <Paragraph>Join the community of fan commentators who are revolutionizing how sports stories are told.
                    </Paragraph>
                </Card.Content>
            </Card>

            {/* Personal Style Section */}
            <Card style={styles.card}>
                <Card.Title title="Create Your Personality"/>
                <Card.Content>
                    <Paragraph>Mix and match to make your commentary uniquely you!</Paragraph>
                    <View style={styles.badgesContainer}>
                        {styleOptions.map((option) => (
                            <Chip
                                key={option}
                                selected={selectedStyle === option}
                                onPress={() => setSelectedStyle(option)}
                                style={styles.chip}
                            >
                                {option}
                            </Chip>
                        ))}
                    </View>
                    <Divider style={styles.divider}/>
                </Card.Content>
            </Card>

            {/* Accent Section */}
            <Card style={styles.card}>
                <Card.Title title="Accent"/>
                <Card.Content>
                    <Paragraph>Make your commentary as unique as you are.</Paragraph>
                    <View style={styles.badgesContainer}>
                        {accents.map((accent) => (
                            <Chip
                                key={accent}
                                selected={selectedAccent === accent}
                                onPress={() => setSelectedAccent(accent)}
                                style={styles.chip}
                            >
                                {accent}
                            </Chip>
                        ))}
                    </View>
                </Card.Content>
            </Card>

            {/* Gender Section */}
            <Card style={styles.card}>
                <Card.Title title="Voice Gender"/>
                <Card.Content>
                    <Paragraph>It's your voice, your way.</Paragraph>
                    <View style={styles.badgesContainer}>
                        {genders.map((gender) => (
                            <Chip
                                key={gender}
                                selected={selectedGender === gender}
                                onPress={() => setSelectedGender(gender)}
                                style={styles.chip}
                            >
                                {gender}
                            </Chip>
                        ))}
                    </View>
                    <Divider style={styles.divider}/>
                </Card.Content>
            </Card>

            {/* Save Button */}
            <Button
                mode="contained"
                style={styles.button}
                onPress={handleSaveCommentator}
            >
                Save Commentator Personality
            </Button>
        </ScrollView>
        </View>
    );
}

// 6) Style definitions
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 40,
        flexGrow: 1,
    },
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
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
    },
    chip: {
        marginRight: 8,
        marginBottom: 8,
    },
    divider: {
        marginTop: 16,
    },
    button: {
        marginTop: 10,
        marginBottom: 32,
        marginHorizontal: 24
    },
    paragraph: {
        marginBottom: 8
    }
});
