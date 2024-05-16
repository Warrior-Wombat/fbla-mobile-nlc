import React, { useState } from 'react';
import { Dimensions, StyleSheet, TextInput } from 'react-native';
import { PanGestureHandler, PinchGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const CustomTextArea = () => {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    },
  });

  const pinchGestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = event.scale;
    },
    onEnd: () => {
      scale.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={panGestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
          <Animated.View style={styles.resizableBox}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              style={[styles.textInput, { height: inputHeight }]}
              onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
              placeholder="Type here..."
            />
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: width / 4,
    top: height / 4,
    width: 200,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    overflow: 'hidden',
  },
  resizableBox: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});

export default CustomTextArea;
