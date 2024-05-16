import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

const BottomToolbar = ({ executeCommand }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [active, setActive] = useState({ bold: false, italic: false, underline: false, strikethrough: false, forecolor: false, backcolor: false });
  const [currentColorCommand, setCurrentColorCommand] = useState(null);

  const colors = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#000000',
    '#FFFFFF',
    '#FFA500',
  ];

  useEffect(() => {
    const keyboardDidShow = (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsVisible(true);
    };
    const keyboardDidHide = () => {
      setIsVisible(false);
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const hideSubscription = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handlePress = (command, color = null) => {
    if (command === 'Forecolor' || command === 'Backcolor') {
      setColorPickerVisible(!colorPickerVisible);
      setCurrentColorCommand(command);
      if (color) {
        executeCommand(command, color);
      }
    } else {
      const newValue = !active[command];
      setActive({ ...active, [command]: newValue });
      executeCommand(command, newValue ? 'on' : 'off');
    }
  };

  const handleColorSelect = (color) => {
    setColorPickerVisible(false);
    handlePress(currentColorCommand, color);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.toolbar, { bottom: Platform.OS === 'ios' ? keyboardHeight : 0 }]}>
      <TouchableOpacity onPress={() => handlePress('Bold')}>
        <MaterialIcon name="format-bold" size={20} color={active.bold ? '#000' : '#333'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handlePress('Italic')}>
        <MaterialIcon name="format-italic" size={20} color={active.italic ? '#000' : '#333'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handlePress('Underline')}>
        <MaterialIcon name="format-underlined" size={20} color={active.underline ? '#000' : '#333'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handlePress('Strikethrough')}>
        <MaterialIcon name="format-strikethrough" size={20} color={active.strikethrough ? '#000' : '#333'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handlePress('Forecolor')}>
        <MaterialIcon name="format-color-text" size={20} color={active.forecolor ? '#000' : '#333'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handlePress('Backcolor')}>
        <FontAwesome name="highlighter" size={20} color={active.backcolor ? '#000' : '#333'} />
      </TouchableOpacity>
      {colorPickerVisible && (
        <View style={styles.colorPickerOverlay}>
          <ScrollView contentContainerStyle={styles.colorsGrid}>
            {colors.map((color, index) => (
              <TouchableOpacity key={index} style={[styles.colorButton, { backgroundColor: color }]} onPress={() => handleColorSelect(color)}>
                <Text style={styles.colorText}>{color}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  colorPickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorButton: {
    width: 40,
    height: 40,
    margin: 5,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorText: {
    color: '#FFF',
    fontSize: 12,
  },
});

export default BottomToolbar;
