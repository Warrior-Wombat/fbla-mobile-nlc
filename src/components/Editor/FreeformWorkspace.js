import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import uuid from 'react-native-uuid';
import Imagebox from './Imagebox';
import Textbox from './Textbox';

const FreeformWorkspace = () => {
  const [components, setComponents] = useState([]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const addTextbox = () => {
    const id = uuid.v4();
    setComponents([...components, { id, type: 'textbox', ref: React.createRef() }]);
  };

  const addImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      const id = uuid.v4();
      setComponents([...components, { id, type: 'image', uri: result.assets[0].uri, ref: React.createRef() }]);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView contentContainerStyle={styles.workspace}>
        {components.map((component) => {
          if (component.type === 'textbox') {
            return <Textbox key={component.id} ref={component.ref} apiKey="your-tinymce-api-key" />;
          } else if (component.type === 'image') {
            return <Imagebox key={component.id} ref={component.ref} source={{ uri: component.uri }} initialWidth={200} initialHeight={200} />;
          }
          return null;
        })}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button title="Add Textbox" onPress={addTextbox} />
        <Button title="Add Imagebox" onPress={addImage} />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  workspace: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
});

export default FreeformWorkspace;
