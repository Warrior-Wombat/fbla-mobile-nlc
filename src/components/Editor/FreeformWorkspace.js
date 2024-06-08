import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import uuid from 'react-native-uuid';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Imagebox from './Imagebox';
import Textbox from './Textbox';
import BottomToolbar from './TinyMCE/BottomToolbar';
import TopToolbar from './TinyMCE/TopToolbar';

const FreeformWorkspace = () => {
  const [components, setComponents] = useState([]);
  const [activeEditor, setActiveEditor] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const slideAnim = useState(new Animated.Value(-60))[0];

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
      setActiveEditor(null);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isKeyboardVisible ? 0 : -60,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isKeyboardVisible]);

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

  const executeCommand = (command, value) => {
    if (activeEditor && activeEditor.current) {
      activeEditor.current.executeCommand(command, value);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Animated.View style={[styles.topToolbarContainer, { transform: [{ translateY: slideAnim }] }]}>
        <TopToolbar executeCommand={executeCommand} />
      </Animated.View>
      <View style={styles.workspace}>
        {components.map((component) => {
          if (component.type === 'textbox') {
            return (
              <Textbox
                key={component.id}
                ref={component.ref}
                apiKey="your-tinymce-api-key"
                onFocus={() => setActiveEditor(component.ref)}
                onBlur={() => setActiveEditor(null)}
              />
            );
          } else if (component.type === 'image') {
            return (
              <Imagebox
                key={component.id}
                ref={component.ref}
                source={{ uri: component.uri }}
                initialWidth={200}
                initialHeight={200}
              />
            );
          }
          return null;
        })}
      </View>
      {isKeyboardVisible ? (
        <BottomToolbar executeCommand={executeCommand} editorRef={activeEditor} />
      ) : (
        <View style={styles.toolbarContainer}>
          <TouchableOpacity style={styles.button} onPress={addTextbox}>
            <MaterialIcons name="text-fields" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={addImage}>
            <MaterialIcons name="add-photo-alternate" size={24} color="black" />
          </TouchableOpacity>
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  workspace: {
    flex: 1,
    paddingBottom: 200,
  },
  topToolbarContainer: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    zIndex: 100,
  },
  button: {
    padding: 10,
    alignItems: 'center',
  },
});

export default FreeformWorkspace;
