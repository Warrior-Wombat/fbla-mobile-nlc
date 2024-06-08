import { TINYMCE_API_KEY } from '@env';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import uuid from 'react-native-uuid';
import supabase from '../../utils/supabase';
import Imagebox from './Imagebox';
import Textbox from './Textbox';
import BottomToolbar from './TinyMCE/BottomToolbar';
import TopToolbar from './TinyMCE/TopToolbar';
import WorkspaceToolbar from './WorkspaceToolbar';

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
    const editorId = `${id}`;
    console.log(`Creating textbox with editorId: ${editorId}`);
    setComponents([...components, { id, type: 'textbox', editorId, ref: React.createRef() }]);
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
    console.log("Executing command:", command, "with value:", value, "on editor:", activeEditor);
    if (activeEditor && activeEditor.current) {
      activeEditor.current.executeCommand(command, value);
    }
  };

  const setActiveEditorRef = (ref) => {
    setActiveEditor(ref);
  };

  const saveContent = async () => {
    try {
        const textboxes = [];
        const images = [];

        await Promise.all(
            components.map(async (component) => {
                if (component.type === 'textbox') {
                    const content = await component.ref.current.getContent();
                    const { x, y, boxWidth, boxHeight } = component.ref.current.getData();
                    console.log(`Saving textbox with id: ${component.id}, content: ${content}`);
                    textboxes.push({
                        id: component.editorId,
                        content: JSON.parse(content),
                        x,
                        y,
                        width: boxWidth,
                        height: boxHeight,
                    });
                } else if (component.type === 'image') {
                    const { x, y, boxWidth, boxHeight, uri } = component.ref.current.getData();
                    const fileExt = uri.split('.').pop();
                    const fileName = `${uuid.v4()}.${fileExt}`;
                    const formData = new FormData();
                    formData.append('file', {
                        uri,
                        name: fileName,
                        type: `image/${fileExt}`,
                    });

                    const { data, error } = await supabase.storage.from('images').upload(fileName, formData);

                    if (error) {
                        console.error('Error uploading image: ', error);
                        return;
                    }

                    const { publicURL } = supabase.storage.from('images').getPublicUrl(fileName);
                    images.push({
                        id: component.id,
                        x,
                        y,
                        width: boxWidth,
                        height: boxHeight,
                        url: publicURL,
                    });
                }
            })
        );

        const workspaceData = {
            textboxes: textboxes.length ? textboxes : [],
            images: images.length ? images : [],
        };

        const { data, error } = await supabase
            .from('workspace')
            .insert([{ id: uuid.v4(), components: workspaceData }]);

        if (error) {
            console.error('Error saving workspace: ', error);
        } else {
            console.log('Workspace saved successfully: ', data);
        }
    } catch (error) {
        console.error('Error saving workspace: ', error);
    }
};


  const loadWorkspace = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace')
        .select('components')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading workspace: ', error);
        return;
      }

      const componentsData = data.components;

      setComponents(
        componentsData.map((component) => {
          if (component.type === 'textbox') {
            return {
              id: component.id,
              type: 'textbox',
              x: component.x,
              y: component.y,
              width: component.width,
              height: component.height,
              content: JSON.stringify(component.content),
              editorId: component.editorId,
              ref: React.createRef(),
            };
          } else if (component.type === 'image') {
            return {
              id: component.id,
              type: 'image',
              x: component.x,
              y: component.y,
              width: component.width,
              height: component.height,
              uri: component.url,
              ref: React.createRef(),
            };
          }
        })
      );
    } catch (error) {
      console.error('Error loading workspace: ', error);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Animated.View style={[styles.topToolbarContainer, { transform: [{ translateY: slideAnim }] }]}>
        <TopToolbar executeCommand={executeCommand} editorRef={activeEditor} />
      </Animated.View>
      <View style={styles.workspace}>
        {components.map((component) => {
          if (component.type === 'textbox') {
            return (
              <Textbox
                key={component.id}
                ref={component.ref}
                apiKey={TINYMCE_API_KEY}
                editorId={component.editorId}
                setActiveEditor={setActiveEditorRef}
              />
            );
          } else if (component.type === 'image') {
            return (
              <Imagebox
                key={component.id}
                ref={component.ref}
                source={{ uri: component.uri }}
              />
            );
          }
          return null;
        })}
      </View>
      {isKeyboardVisible ? (
        <BottomToolbar executeCommand={executeCommand} editorRef={activeEditor} />
      ) : (
        <WorkspaceToolbar addTextbox={addTextbox} addImage={addImage} saveContent={saveContent} />
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
    paddingBottom: 1000,
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
