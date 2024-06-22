import { TINYMCE_API_KEY } from '@env';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import uuid from 'react-native-uuid';
import Imagebox from './Imagebox';
import Textbox from './Textbox';
import BottomToolbar from './TinyMCE/BottomToolbar';
import TopToolbar from './TinyMCE/TopToolbar';
import WorkspaceToolbar from './WorkspaceToolbar';

const FreeformWorkspace = forwardRef(({ route }, ref) => {
  const { pageId, mode, pageData } = route.params;
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

    console.log("Page Data:", pageData);
    if (mode === 'edit' || mode === 'view') {
      loadPageData(pageData);
    }

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [pageId, mode, pageData]);

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
    setComponents([...components, { id, type: 'textbox', editorId, ref: React.createRef(), x: 50, y: 50, width: 300, height: 400, content: '' }]);
  };

  const addImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Disable cropping
      quality: 1,
    });
  
    console.log('Image picker result:', result);
  
    if (!result.canceled) {
      const { uri, width: imageWidth, height: imageHeight } = result.assets[0];
      const id = uuid.v4();
  
      // Scale the image to fit on the screen, reducing its size by half
      const scaledWidth = imageWidth / 8;
      const scaledHeight = imageHeight / 8;
  
      console.log('Adding image with URI:', uri);
      setComponents([...components, { id, type: 'image', uri: uri, ref: React.createRef(), x: 50, y: 50, width: scaledWidth, height: scaledHeight }]);
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

  const collectPageData = async () => {
    try {
      const textboxes = [];
      const images = [];
  
      await Promise.all(
        components.map(async (component) => {
          if (component.type === 'textbox') {
            const content = await component.ref.current.getContent();
            const { x, y, boxWidth, boxHeight } = component.ref.current.getData();
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
            images.push({
              id: component.id,
              x,
              y,
              width: boxWidth,
              height: boxHeight,
              uri,
            });
          }
        })
      );
  
      return {
        textboxes: textboxes.length ? textboxes : [],
        images: images.length ? images : [],
      };
    } catch (error) {
      console.error('Error collecting workspace data: ', error);
    }
  };

  const loadPageData = (pageData) => {
    if (pageData) {
      console.log("Loading page data:", pageData);
      const loadedComponents = [
        ...pageData.textboxes.map(textbox => ({
          ...textbox,
          type: 'textbox',
          ref: React.createRef(),
          content: JSON.stringify(textbox.content),
          editorId: textbox.id,
        })),
        ...pageData.images.map(image => ({
          ...image,
          type: 'image',
          ref: React.createRef(),
          uri: image.uri,
        })),
      ];
      setComponents(loadedComponents);

      // Set content for each component
      loadedComponents.forEach(component => {
        if (component.type === 'textbox' && component.ref.current) {
          component.ref.current.setContent(component.content);
        }
      });
    } else {
      console.log("No page data to load.");
    }
  };

  useImperativeHandle(ref, () => ({
    collectPageData,
    loadPageData,
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      {mode !== 'view' && (
        <Animated.View style={[styles.topToolbarContainer, { transform: [{ translateY: slideAnim }] }]}>
          <TopToolbar executeCommand={executeCommand} editorRef={activeEditor} />
        </Animated.View>
      )}
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
                editable={mode !== 'view'}
                x={component.x}
                y={component.y}
                width={component.width}
                height={component.height}
                content={component.content}
                mode={mode} // Pass mode prop here
              />
            );
          } else if (component.type === 'image') {
            return (
              <Imagebox
                key={component.id}
                ref={component.ref}
                source={{ uri: component.uri }}
                initialWidth={component.width}
                initialHeight={component.height}
                x={component.x}
                y={component.y}
                mode={mode}
              />
            );
          }
          return null;
        })}
      </View>
      {mode !== 'view' && (
        isKeyboardVisible ? (
          <BottomToolbar executeCommand={executeCommand} editorRef={activeEditor} />
        ) : (
          <WorkspaceToolbar addTextbox={addTextbox} addImage={addImage} />
        )
      )}
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  workspace: {
    flex: 1,
  },
  topToolbarContainer: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});

export default FreeformWorkspace;
