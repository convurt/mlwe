// AppNavigator.js
// 1) Import required libraries
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

// 2) Import your screens
import HomeScreen from './screens/HomeScreen';
import UploadVideoScreen from './screens/UploadVideoScreen';
import VideoReviewScreen from './screens/VideoReviewScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                {/* 3) Manually define routes */}
                <Stack.Screen name="Home" component={HomeScreen}/>
                <Stack.Screen name="UploadVideoScreen" component={UploadVideoScreen}/>
                <Stack.Screen name="VideoReviewScreen" component={VideoReviewScreen}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
}
