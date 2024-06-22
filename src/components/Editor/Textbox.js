import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import TinyMCEEditor from './TinyMCE/TinyMCEEditor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Textbox = forwardRef((props, ref) => {
  const { mode } = props;
  const x = useSharedValue(props.x);
  const y = useSharedValue(props.y);
  const boxWidth = useSharedValue(props.width);
  const boxHeight = useSharedValue(props.height);

  const previewX = useSharedValue(x.value);
  const previewY = useSharedValue(y.value);
  const previewWidth = useSharedValue(boxWidth.value);
  const previewHeight = useSharedValue(boxHeight.value);
  const showPreview = useSharedValue(false);

  const editorRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);

  useImperativeHandle(ref, () => ({
    executeCommand: (command, value) => {
      if (editorRef.current) {
        editorRef.current.executeCommand(command, value);
      }
    },
    getContent: () => {
      return editorRef.current.getContent();
    },
    getData: () => {
      return {
        x: x.value,
        y: y.value,
        boxWidth: boxWidth.value,
        boxHeight: boxHeight.value,
      };
    },
    setContent: (content) => {
      if (editorRef.current) {
        console.log("content setting in the imperative handle? ", content.content);
        editorRef.current.setContent(JSON.parse(content).content);
      }
    }
  }));

  const handleMove = () => {
    if (props.onMove) {
      props.onMove();
    }
  };

  const handleEditorFocus = () => {
    if (props.setActiveEditor) {
      props.setActiveEditor(editorRef);
    }
  };

  const handleResize = (height) => {
    boxHeight.value = height;
  };

  const moveGesture = Gesture.Pan()
    .onStart(() => {
      previewX.value = x.value;
      previewY.value = y.value;
      showPreview.value = true;
      runOnJS(handleMove)();
    })
    .onUpdate((event) => {
      previewX.value = x.value + event.translationX;
      previewY.value = y.value + event.translationY;
      runOnJS(handleMove)();
    })
    .onEnd(() => {
      x.value = previewX.value;
      y.value = previewY.value;
      showPreview.value = false;
      runOnJS(handleMove)();
    });

  const noOpGesture = Gesture.Tap();

  const createResizeGesture = (dx, dy, axis) => {
    return Gesture.Pan()
      .onStart(() => {
        previewWidth.value = boxWidth.value;
        previewHeight.value = boxHeight.value;
        showPreview.value = true;
      })
      .onUpdate((event) => {
        if (dx !== 0) {
          previewWidth.value = boxWidth.value + event.translationX * dx;
        }
        if (dy !== 0) {
          previewHeight.value = boxHeight.value + event.translationY * dy;
        }
        if (axis === 'horizontal') {
          previewX.value = x.value;
        } else if (axis === 'vertical') {
          previewY.value = y.value;
        }
      })
      .onEnd(() => {
        boxWidth.value = previewWidth.value;
        boxHeight.value = previewHeight.value;
        showPreview.value = false;
      });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withTiming(x.value) }, { translateY: withTiming(y.value) }],
      width: withTiming(boxWidth.value),
      height: withTiming(boxHeight.value),
      borderWidth: mode === 'view' ? 0 : 1,
    };
  });

  const previewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: previewX.value }, { translateY: previewY.value }],
      width: previewWidth.value,
      height: previewHeight.value,
      borderColor: 'gray',
      borderWidth: 1,
      borderStyle: 'dashed',
      opacity: showPreview.value ? 1 : 0,
    };
  });

  useEffect(() => {
    if (props.content && editorReady) {
      console.log('setting props in textbox.js use effect?? ', props.content);
      editorRef.current.setContent(props.content);
    }
  }, [props.content, editorReady]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={mode !== 'view' ? moveGesture : noOpGesture}>
        <Animated.View style={[styles.textbox, animatedStyle]}>
          <TinyMCEEditor 
            ref={editorRef}
            apiKey={props.apiKey} 
            editorId={props.editorId}
            onFocus={handleEditorFocus}
            onResize={handleResize}
            width={boxWidth.value}
            height={boxHeight.value}
            onReady={() => setEditorReady(true)} // Add this to handle when editor is ready
            disabled={mode === 'view'} // Disable editor when in view mode
          />
          {mode !== 'view' && (
            <>
              <GestureDetector gesture={createResizeGesture(1, 0, 'horizontal')}>
                <Animated.View style={[styles.resizeHandle, styles.right]} />
              </GestureDetector>
              <GestureDetector gesture={createResizeGesture(0, 1, 'vertical')}>
                <Animated.View style={[styles.resizeHandle, styles.bottom]} />
              </GestureDetector>
              <GestureDetector gesture={createResizeGesture(1, 1, null)}>
                <Animated.View style={[styles.resizeHandle, styles.corner]} />
              </GestureDetector>
              <GestureDetector gesture={createResizeGesture(-1, 0, 'horizontal')}>
                <Animated.View style={[styles.resizeHandle, styles.left]} />
              </GestureDetector>
              <GestureDetector gesture={createResizeGesture(0, -1, 'vertical')}>
                <Animated.View style={[styles.resizeHandle, styles.top]} />
              </GestureDetector>
              <GestureDetector gesture={createResizeGesture(-1, -1, null)}>
                <Animated.View style={[styles.resizeHandle, styles.topLeft]} />
              </GestureDetector>
              <GestureDetector gesture={createResizeGesture(1, -1, null)}>
                <Animated.View style={[styles.resizeHandle, styles.topRight]} />
              </GestureDetector>
              <GestureDetector gesture={createResizeGesture(-1, 1, null)}>
                <Animated.View style={[styles.resizeHandle, styles.bottomLeft]} />
              </GestureDetector>
            </>
          )}
        </Animated.View>
      </GestureDetector>
      {mode !== 'view' && <Animated.View style={[styles.previewBox, previewStyle]} pointerEvents="none" />}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textbox: {
    backgroundColor: 'white',
    borderColor: 'blue',
    position: 'absolute',
  },
  previewBox: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  resizeHandle: {
    width: 10,
    height: 10,
    backgroundColor: 'blue',
    position: 'absolute',
  },
  right: {
    right: -5,
    top: '50%',
    marginTop: -5,
  },
  bottom: {
    bottom: -5,
    left: '50%',
    marginLeft: -5,
  },
  corner: {
    right: -5,
    bottom: -5,
  },
  left: {
    left: -5,
    top: '50%',
    marginTop: -5,
  },
  top: {
    top: -5,
    left: '50%',
    marginLeft: -5,
  },
  topLeft: {
    left: -5,
    top: -5,
  },
  topRight: {
    right: -5,
    top: -5,
  },
  bottomLeft: {
    left: -5,
    bottom: -5,
  },
  bottomRight: {
    right: -5,
    bottom: -5,
  },
});

export default Textbox;
