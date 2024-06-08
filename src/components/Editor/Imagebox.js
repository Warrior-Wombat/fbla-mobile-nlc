import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Imagebox = forwardRef((props, ref) => {
  const { x: initialX, y: initialY, width: initialWidth, height: initialHeight, source } = props;

  const x = useSharedValue(initialX || 50);
  const y = useSharedValue(initialY || 50);
  const boxWidth = useSharedValue(initialWidth || 200);
  const boxHeight = useSharedValue(initialHeight || 200);

  const previewX = useSharedValue(x.value);
  const previewY = useSharedValue(y.value);
  const previewWidth = useSharedValue(boxWidth.value);
  const previewHeight = useSharedValue(boxHeight.value);
  const showPreview = useSharedValue(false);

  useImperativeHandle(ref, () => ({
    setPosition: (newX, newY) => {
      x.value = newX;
      y.value = newY;
    },
    setSize: (newWidth, newHeight) => {
      boxWidth.value = newWidth;
      boxHeight.value = newHeight;
    }
  }));

  useEffect(() => {
    Image.getSize(source.uri, (width, height) => {
      const aspectRatio = width / height;
      let adjustedWidth = width;
      let adjustedHeight = height;

      if (width > SCREEN_WIDTH || height > SCREEN_HEIGHT) {
        if (aspectRatio > 1) {
          adjustedWidth = SCREEN_WIDTH * 0.8;
          adjustedHeight = adjustedWidth / aspectRatio;
        } else {
          adjustedHeight = SCREEN_HEIGHT * 0.5;
          adjustedWidth = adjustedHeight * aspectRatio;
        }
      }

      setImageDimensions({ width: adjustedWidth, height: adjustedHeight });
      boxWidth.value = adjustedWidth;
      boxHeight.value = adjustedHeight;
    });
  }, [source]);

  const moveGesture = Gesture.Pan()
    .onStart(() => {
      previewX.value = x.value;
      previewY.value = y.value;
      showPreview.value = true;
    })
    .onUpdate((event) => {
      previewX.value = x.value + event.translationX;
      previewY.value = y.value + event.translationY;
    })
    .onEnd(() => {
      x.value = previewX.value;
      y.value = previewY.value;
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
      transform: [{ translateX: withTiming(x.value) }, { translateY: withTiming(y.value) }],
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
