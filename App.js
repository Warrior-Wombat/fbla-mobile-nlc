import 'expo-dev-client';
import React from 'react';
import { StyleSheet } from 'react-native';
import RootNavigation from './src/navigation/RootNavigation';

const App = () => {
  return (
    <RootNavigation />
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
