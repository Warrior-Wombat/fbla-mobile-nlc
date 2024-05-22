import { TINYMCE_API_KEY } from '@env';
import 'expo-dev-client';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import 'react-native-get-random-values';
import FreeformWorkspace from './src/components/Editor/FreeformWorkspace';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Welcome to the Freeform Workspace!</Text>
      <View style={styles.workspaceContainer}>
        <FreeformWorkspace apiKey={TINYMCE_API_KEY} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  workspaceContainer: {
    flex: 1,
    width: '100%',
  },
});

export default App;
