import { TINYMCE_API_KEY } from '@env';
import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, Keyboard, ScrollView, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Imagebox from './Imagebox';
import Textbox from './Textbox';
import BottomToolbar from './TinyMCE/BottomToolbar';
import TopToolbar from './TinyMCE/TopToolbar';
import WorkspaceToolbar from './WorkspaceToolbar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FreeformWorkspace = forwardRef(({ route }, ref) => {
  const { pageId, mode, pageData } = route.params;
  const [components, setComponents] = useState([]);
  const [activeEditor, setActiveEditor] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const slideAnim = useSharedValue(-60);

  const workspaceHeight = useSharedValue(SCREEN_HEIGHT);
  const workspaceWidth = useSharedValue(SCREEN_WIDTH * 2);
  const scrollViewRef = useRef(null);

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

    if (mode === 'edit' || mode === 'view') {
      loadPageData(pageData);
    }

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [pageId, mode, pageData]);

  useEffect(() => {
    slideAnim.value = withTiming(isKeyboardVisible ? 0 : -60, { duration: 300 });
  }, [isKeyboardVisible, slideAnim]);

  const addTextbox = useCallback(() => {
    const id = randomUUID();
    const editorId = `${id}`;
    const visibleCenterX = SCREEN_WIDTH / 2;
    const visibleCenterY = SCREEN_HEIGHT / 2;

    setComponents((prevComponents) => [
      ...prevComponents,
      { 
        id, 
        type: 'textbox', 
        editorId, 
        ref: React.createRef(), 
        x: visibleCenterX - 150, // Center horizontally
        y: visibleCenterY - 200, // Center vertically
        width: 300, 
        height: 400, 
        content: '' 
      }
    ]);
  }, []);

  const addImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const { uri, width: imageWidth, height: imageHeight } = result.assets[0];
      const id = randomUUID();

      const scaledWidth = imageWidth / 8;
      const scaledHeight = imageHeight / 8;

      const visibleCenterX = SCREEN_WIDTH / 2;
      const visibleCenterY = SCREEN_HEIGHT / 2;

      setComponents((prevComponents) => [
        ...prevComponents,
        { 
          id, 
          type: 'image', 
          uri: uri, 
          ref: React.createRef(), 
          x: visibleCenterX - scaledWidth / 2, // Center horizontally
          y: visibleCenterY - scaledHeight / 2, // Center vertically
          width: scaledWidth, 
          height: scaledHeight 
        }
      ]);
    }
  }, []);

  const executeCommand = (command, value) => {
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
    }
  };

  useImperativeHandle(ref, () => ({
    collectPageData,
    loadPageData,
  }));

  const workspaceStyle = useAnimatedStyle(() => ({
    width: workspaceWidth.value,
    height: workspaceHeight.value,
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      {mode !== 'view' && (
        <Animated.View style={[styles.topToolbarContainer, { transform: [{ translateY: slideAnim }] }]}>
          <TopToolbar executeCommand={executeCommand} editorRef={activeEditor} />
        </Animated.View>
      )}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        horizontal={true}
        showsHorizontalScrollIndicator={true}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={true}
        >
          <Animated.View style={[styles.workspace, workspaceStyle]}>
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
                    mode={mode}
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
          </Animated.View>
        </ScrollView>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  workspace: {
    position: 'relative',
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
