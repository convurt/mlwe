import React from 'react';
import {StyleSheet, View, ScrollView} from 'react-native';
import {Avatar, Button, Card, Title, Paragraph, List, Text} from 'react-native-paper';
import {useSettings} from '@/utility/SettingsContext';
import {EULA_CONTENT} from "@/utility/eula";
import {Stack} from 'expo-router';

export default function EULAScreen() {
    const {user} = useSettings();

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Privacy & Terms',
                    headerBackTitle: 'Back'
                }}
            />
            <ScrollView style={styles.scrollView}>
                <View style={styles.container}>
                            <View style={styles.contentContainer}>
                                {EULA_CONTENT.split('\n\n').map((paragraph, index) => (
                                    <Text key={index} style={styles.paragraph}>
                                        {paragraph.split('\n').map((line, lineIndex) => (
                                            <Text key={`${index}-${lineIndex}`} style={
                                                line.startsWith('-') ? styles.bulletPoint :
                                                    line.match(/^\d+\./) ? styles.sectionTitle :
                                                        styles.normalText
                                            }>
                                                {line}
                                                {lineIndex < paragraph.split('\n').length - 1 ? '\n' : ''}
                                            </Text>
                                        ))}
                                    </Text>
                                ))}
                            </View>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
        borderRadius: 8,
        elevation: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    lastUpdated: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    contentContainer: {
        marginTop: 16,
    },
    paragraph: {
        marginBottom: 16,
        lineHeight: 24,
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
    },
    bulletPoint: {
        marginLeft: 16,
        color: '#333',
    },
    normalText: {
        color: '#333',
    },
});
