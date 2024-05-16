import { TINYMCE_API_KEY } from '@env';
import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import TinyMCEEditor from './src/components/TinyMCE/TinyMCEEditor';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Welcome to the TinyMCE Editor!</Text>
      <TinyMCEEditor apiKey={TINYMCE_API_KEY} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  }
});

export default App;
