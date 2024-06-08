import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

const TopToolbar = ({ executeCommand, isVisible }) => {
  const [fontFamilyVisible, setFontFamilyVisible] = useState(false);
  const [fontSizeVisible, setFontSizeVisible] = useState(false);
  const slideAnim = useSharedValue(-120);

  const fontFamilies = ['Arial', 'Comic Sans MS', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
  const fontSizes = ['10px', '12px', '14px', '16px', '18px', '24px', '36px'];

  useEffect(() => {
    slideAnim.value = withTiming(isVisible ? -120 : 60, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: slideAnim.value }],
    };
  });

  const handleFontFamilyPress = useCallback((fontFamily) => {
    executeCommand('fontName', fontFamily);
    setFontFamilyVisible(false);
  }, [executeCommand]);

  const handleFontSizePress = useCallback((fontSize) => {
    executeCommand('fontSize', fontSize);
    setFontSizeVisible(false);
  }, [executeCommand]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.toolbarContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => executeCommand('undo')}
        >
          <MaterialIcon name="undo" size={20} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => executeCommand('redo')}
        >
          <MaterialIcon name="redo" size={20} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setFontFamilyVisible(!fontFamilyVisible)}
        >
          <Text style={styles.dropdownText}>Font Family <MaterialIcon name="arrow-drop-down" size={20} color="#333" /></Text>
        </TouchableOpacity>
        {fontFamilyVisible && (
          <View style={styles.accordion}>
            {fontFamilies.map((fontFamily) => (
              <TouchableOpacity
                key={fontFamily}
                style={styles.button}
                onPress={() => handleFontFamilyPress(fontFamily)}
              >
                <Text style={{ fontFamily }}>{fontFamily}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => setFontSizeVisible(!fontSizeVisible)}
        >
          <Text style={styles.dropdownText}>Font Size <MaterialIcon name="arrow-drop-down" size={20} color="#333" /></Text>
        </TouchableOpacity>
        {fontSizeVisible && (
          <View style={styles.accordion}>
            {fontSizes.map((fontSize) => (
              <TouchableOpacity
                key={fontSize}
                style={styles.button}
                onPress={() => handleFontSizePress(fontSize)}
              >
                <Text style={{ fontSize }}>{fontSize}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f1f1f1',
    zIndex: 1000,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  toolbarContainer: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  accordion: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ccc',
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  button: {
    padding: 5,
  },
  dropdownText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default TopToolbar;
