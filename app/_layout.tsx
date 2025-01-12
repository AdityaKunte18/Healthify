// _layout.tsx

import React from 'react';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatabaseProvider, useDatabase } from '../context/DatabaseContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3498db" />
    </View>
  );
}

function RootLayoutContent() {
  const { isDbInitialized } = useDatabase();

  if (!isDbInitialized) {
    return <LoadingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        // Add any global screen options here
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Home',
          headerBackVisible: false
         }}
      />
     
      <Stack.Screen name="addpatient" 
        options={{ title: 'Add Patient' }} 
      />

      <Stack.Screen name="addtasks" 
          options={{ title: 'Add Tasks',
           }} 
      />

    <Stack.Screen name="reviewpatients" 
          options={{ title: 'Review Current Patients',
           }} 
      />
    
    <Stack.Screen name="reviewoldpatients" 
          options={{ title: 'Review Discharged Patients',
           }} 
      />

  <Stack.Screen name="editpatient" 
          options={{ title: 'Edit Details',
           }} 
      />

  <Stack.Screen name="viewtasks" 
          options={{ title: 'View Tasks',
           }} 
      />
  
  <Stack.Screen name="edittask" 
          options={{ title: 'Edit Task',
           }} 
      />

<Stack.Screen name="pendingtasks" 
          options={{ title: 'Pending Tasks',
           }} 
      />

<Stack.Screen name="collectedtasks" 
          options={{ title: 'Reports To Collect',
           }} 
      />

<Stack.Screen name="completedtasks" 
          options={{ title: 'View Completed Tasks',
           }} 
      />


    </Stack>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <DatabaseProvider>
      <RootLayoutContent />
    </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
