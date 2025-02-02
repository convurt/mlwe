// 1) Renamed "Event" to "Moment" and references throughout
// 2) Renamed "onSelectEvent" to "onSelectMoment" and variables from "events" to "moments"
// 3) Changed "mom.name" to "mom.moment_name" to fix the chip display
// 4) Adjusted "maxHeight" to prevent cutting off the modal
// 5) Sorted moments alphabetically by "moment_name"

import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Portal, Modal, Text, Button, Chip} from 'react-native-paper';
import {collection, getDocs} from 'firebase/firestore';
import {db} from '@/utility/firebaseConfig'; // (6) Adjust your import path

// 7) Interface for a Moment object
interface Moment {
    moment_name: string;  // (8) Field name must match your Firestore doc structure
    m_id: number;
}

// 9) Interface for modal props
interface MomentSelectorModalProps {
    visible: boolean;                         // (10) Controls modal visibility
    onClose: () => void;                     // (11) Called when modal is dismissed
    onSelectMoment: (moment: Moment) => void; // (12) Called with the selected Moment
}

export default function MomentSelectorModal({
                                                visible,
                                                onClose,
                                                onSelectMoment
                                            }: MomentSelectorModalProps) {
    // 13) Local state for fetched moments
    const [moments, setMoments] = useState<Moment[]>([]);

    // 14) Fetch moments from Firestore each time modal opens, then sort them alphabetically
    useEffect(() => {
        async function fetchMoments() {
            try {
                const ref = collection(db, 'moments');
                const snapshot = await getDocs(ref);
                const temp: Moment[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    temp.push({
                        moment_name: data.name,
                        m_id: parseInt(data.m_id)
                    });
                });

                // Sort alphabetically by "moment_name"
                temp.sort((a, b) => a.moment_name.localeCompare(b.moment_name));
                setMoments(temp);
            } catch (err) {
                console.log('Error fetching moments:', err);
            }
        }

        if (visible) fetchMoments();
    }, [visible]);

    // 15) Render the list of moments as Chips inside a taller modal
    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.container}>
                <Text style={styles.title}>Select a Moment</Text>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.chipGrid}>
                        {moments.map((mom) => (
                            <Chip
                                key={mom.m_id}
                                mode="outlined"
                                style={styles.chip}
                                onPress={() => {
                                    onSelectMoment({
                                        moment_name: mom.moment_name,
                                        m_id: mom.m_id
                                    });
                                    onClose();
                                }}
                            >
                                {mom.moment_name}
                            </Chip>
                        ))}
                    </View>
                </ScrollView>
                <Button onPress={onClose}>Cancel</Button>
            </Modal>
        </Portal>
    );
}

// 16) Increase maxHeight to prevent the modal from getting cut off.
//     Adjust the value as needed.
const styles = StyleSheet.create({
    container: {
        margin: 20,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 16, // Increased border radius for a more modern look
        maxHeight: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Android shadow
    },
    title: {
        fontSize: 20, // Slightly larger
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center', // Center the "Select a Moment" text
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center', // Center the chips
        gap: 4, // Consistent spacing between chips
    },
    scrollView: {
        paddingBottom: 8, // Add some bottom padding
    },
    chip: {
        margin: 4,
        borderRadius: 16, // More rounded corners
        backgroundColor: '#f8f9fa',
        padding: 4,
        borderWidth: 1,
        borderColor: '#e1e4e8',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    chipText: { // New style for the text inside chips
        fontSize: 14,
        fontWeight: '500',
        color: '#2c3e50',
        letterSpacing: 0.3,
    }
});
