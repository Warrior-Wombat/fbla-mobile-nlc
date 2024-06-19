import React, { forwardRef, useImperativeHandle } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Imagebox = forwardRef(({ source, initialWidth, initialHeight, x, y }, ref) => {
  const posX = useSharedValue(x);
  const posY = useSharedValue(y);
  const boxWidth = useSharedValue(initialWidth);
  const boxHeight = useSharedValue(initialHeight);

  const previewX = useSharedValue(posX.value);
  const previewY = useSharedValue(posY.value);
  const previewWidth = useSharedValue(boxWidth.value);
  const previewHeight = useSharedValue(boxHeight.value);
  const showPreview = useSharedValue(false);

  useImperativeHandle(ref, () => ({
    setPosition: (newX, newY) => {
      posX.value = newX;
      posY.value = newY;
    },
    setSize: (newWidth, newHeight) => {
      boxWidth.value = newWidth;
      boxHeight.value = newHeight;
    },
    getData: () => ({
      x: posX.value,
      y: posY.value,
      boxWidth: boxWidth.value,
      boxHeight: boxHeight.value,
      uri: source.uri
    })
  }));

  const moveGesture = Gesture.Pan()
    .onStart(() => {
      previewX.value = posX.value;
      previewY.value = posY.value;
      showPreview.value = true;
    })
    .onUpdate((event) => {
      previewX.value = posX.value + event.translationX;
      previewY.value = posY.value + event.translationY;
    })
    .onEnd(() => {
      posX.value = previewX.value;
      posY.value = previewY.value;
      showPreview.value = false;
    });

  const createResizeGesture = (dx, dy) => {
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
      })
      .onEnd(() => {
        boxWidth.value = previewWidth.value;
        boxHeight.value = previewHeight.value;
        showPreview.value = false;
      });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withTiming(posX.value) }, { translateY: withTiming(posY.value) }],
      width: withTiming(boxWidth.value),
      height: withTiming(boxHeight.value),
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

  return (
    <View style={styles.container}>
      <GestureDetector gesture={moveGesture}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Image source={source} style={styles.image} resizeMode="stretch" />
          <GestureDetector gesture={createResizeGesture(1, 0)}>
            <Animated.View style={[styles.resizeHandle, styles.right]} />
          </GestureDetector>
          <GestureDetector gesture={createResizeGesture(0, 1)}>
            <Animated.View style={[styles.resizeHandle, styles.bottom]} />
          </GestureDetector>
          <GestureDetector gesture={createResizeGesture(1, 1)}>
            <Animated.View style={[styles.resizeHandle, styles.corner]} />
          </GestureDetector>
          <GestureDetector gesture={createResizeGesture(-1, 0)}>
            <Animated.View style={[styles.resizeHandle, styles.left]} />
          </GestureDetector>
          <GestureDetector gesture={createResizeGesture(0, -1)}>
            <Animated.View style={[styles.resizeHandle, styles.top]} />
          </GestureDetector>
          <GestureDetector gesture={createResizeGesture(-1, -1)}>
            <Animated.View style={[styles.resizeHandle, styles.topLeft]} />
          </GestureDetector>
          <GestureDetector gesture={createResizeGesture(1, -1)}>
            <Animated.View style={[styles.resizeHandle, styles.topRight]} />
          </GestureDetector>
          <GestureDetector gesture={createResizeGesture(-1, 1)}>
            <Animated.View style={[styles.resizeHandle, styles.bottomLeft]} />
          </GestureDetector>
          <GestureDetector gesture={createResizeGesture(1, 1)}>
            <Animated.View style={[styles.resizeHandle, styles.bottomRight]} />
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
      <Animated.View style={[styles.previewBox, previewStyle]} pointerEvents="none" />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'absolute',
    borderColor: 'blue',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
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

export default Imagebox;
