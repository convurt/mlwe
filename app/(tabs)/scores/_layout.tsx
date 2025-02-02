import {Stack} from 'expo-router';

export default function ScoresLayout() {
    return (
        <Stack>
            {/* Main tab route: index.tsx */}
            <Stack.Screen
                name="index"
                options={{title: 'MLB Scores',}}
            />

            {/* The detail screen with a back arrow */}
            <Stack.Screen
                name="gameDetails"
                options={{
                    title: 'Game Details',
                    headerBackVisible: true,
                }}
            />
        </Stack>
    );
}
