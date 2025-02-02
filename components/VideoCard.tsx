// VideoCard.tsx
import React from 'react';
import {View, Image, StyleSheet, Text} from 'react-native';
import {Card, Title, Paragraph, Chip} from 'react-native-paper';
import {VideoDoc} from '@/components/Types';

interface VideoCardProps {
    video: VideoDoc;
    onPress: () => void;
}

export default function VideoCard({video, onPress}: VideoCardProps) {
    return (
        <Card style={styles.card} onPress={onPress}>
            {video.thumbnailUrl ? (
                <Image source={{uri: video.thumbnailUrl}} style={styles.thumbnail}/>
            ) : (
                <View style={styles.noThumb}>
                    <Text>No Thumbnail</Text>
                </View>
            )}
            <Card.Content>
                <View style={styles.headerRow}>
                    {/* Left side for the chip */}
                    <View style={styles.leftSide}>
                        {video.moment_name && (
                            <Chip style={styles.chip} textStyle={styles.chipText}>
                                {video.moment_name}
                            </Chip>
                        )}
                    </View>
                </View>
                <Title>{video.title || 'No Title Yet'}</Title>
                <Paragraph>{video.description || 'No Description Yet'}</Paragraph>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 0,
        borderRadius: 8,
    },
    thumbnail: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,
    },
    noThumb: {
        width: '100%',
        height: 200,
        backgroundColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center'
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
});
