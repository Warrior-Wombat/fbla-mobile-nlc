import { TINYMCE_API_KEY } from '@env';
import React, { useRef } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Textbox from './src/components/Editor/Textbox';
import BottomToolbar from './src/components/Editor/TinyMCE/BottomToolbar';

const App = () => {
  const textboxRef = useRef(null);

  const executeCommand = (command, value) => {
    if (textboxRef.current) {
      textboxRef.current.executeCommand(command, value);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Welcome to the TinyMCE Editor!</Text>
        <View style={styles.editorContainer}>
          <Textbox ref={textboxRef} apiKey={TINYMCE_API_KEY} />
        </View>
        <View style={styles.toolbarContainer}>
          <BottomToolbar executeCommand={executeCommand} editorRef={textboxRef} />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  },
  editorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});

export default App;
