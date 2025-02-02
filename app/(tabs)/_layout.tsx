import {router, Tabs, useRouter} from 'expo-router';
import React, {useEffect} from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {useSettings} from "@/utility/SettingsContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
    const {user} = useSettings();
    const router = useRouter();



  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: true,
          // headerStyle: {
          //     backgroundColor: '#131022', // MLB Blue (Pantone 286 C)
          // },
          // headerTintColor: '#fff', // White text
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
            headerTitle: 'Home Plate',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
        <Tabs.Screen
            name="scores"
            options={{
                title: 'Scores',
                headerTitle: 'MLB Scores',
                headerShown: false, // Hide parent tab header
                tabBarIcon: ({color}) => <IconSymbol size={28} name="baseball" color={color}/>,
            }}
        />
        <Tabs.Screen
            name="videoUpload"
            options={{
                title: 'Upload',
                headerTitle: 'Upload A Video',
                tabBarIcon: ({color}) => <IconSymbol size={28} name="square.and.arrow.up" color={color}/>,
            }}
        />
      <Tabs.Screen
        name="wespn"
        options={{
          title: 'WeSPN',
            headerTitle: 'WeSPN',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="video" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
            headerTitle: 'Chat With Gemini MLB',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
