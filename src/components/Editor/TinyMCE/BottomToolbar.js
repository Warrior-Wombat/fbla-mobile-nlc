import React, { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import ColorPickerComponent from '../ColorPicker';

const BottomToolbar = ({ executeCommand, editorRef }) => {
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    forecolor: false,
    backcolor: false,
  });
  const [currentColorCommand, setCurrentColorCommand] = useState(null);
  const [alignmentVisible, setAlignmentVisible] = useState(false);
  const [listStyleVisible, setListStyleVisible] = useState(false);
  const [currentAlignment, setCurrentAlignment] = useState('format-align-left');

  const alignmentIcons = {
    justifyLeft: 'format-align-left',
    justifyCenter: 'format-align-center',
    justifyRight: 'format-align-right',
    justifyFull: 'format-align-justify',
  };

  const listStyleIcons = {
    insertUnorderedList: 'format-list-bulleted',
    insertOrderedList: 'format-list-numbered',
  };

  const handlePress = useCallback((command) => {
    if (command === 'Forecolor' || command === 'Backcolor') {
      setCurrentColorCommand(command);
      setColorPickerVisible(true);
    } else {
      const newValue = !active[command];
      setActive({ ...active, [command]: newValue });
      executeCommand(command, newValue ? 'on' : 'off');
    }
  }, [active, executeCommand]);

  const handleColorSelect = (color) => {
    executeCommand(currentColorCommand, color);
    setColorPickerVisible(false);
  };

  const handleAlignmentPress = (alignment) => {
    setCurrentAlignment(alignmentIcons[alignment]);
    setAlignmentVisible(false);
    executeCommand(alignment, null);
  };

  const handleListStylePress = (style) => {
    setListStyleVisible(false);
    executeCommand(style, null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbarContainer}>
        <TouchableOpacity
          style={[styles.button, active.bold && styles.activeButton]}
          onPress={() => handlePress('bold')}
        >
          <MaterialIcon name="format-bold" size={20} color={active.bold ? '#000' : '#333'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, active.italic && styles.activeButton]}
          onPress={() => handlePress('italic')}
        >
          <MaterialIcon name="format-italic" size={20} color={active.italic ? '#000' : '#333'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, active.underline && styles.activeButton]}
          onPress={() => handlePress('underline')}
        >
          <MaterialIcon name="format-underlined" size={20} color={active.underline ? '#000' : '#333'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, active.strikethrough && styles.activeButton]}
          onPress={() => handlePress('strikethrough')}
        >
          <MaterialIcon name="format-strikethrough" size={20} color={active.strikethrough ? '#000' : '#333'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, active.forecolor && styles.activeButton]}
          onPress={() => handlePress('Forecolor')}
        >
          <MaterialIcon name="format-color-text" size={20} color={active.forecolor ? '#000' : '#333'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, active.backcolor && styles.activeButton]}
          onPress={() => handlePress('Backcolor')}
        >
          <MaterialIcon name="format-color-fill" size={20} color={active.backcolor ? '#000' : '#333'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setAlignmentVisible(!alignmentVisible)}
        >
          <MaterialIcon name={currentAlignment} size={20} color="#333" />
        </TouchableOpacity>
        {alignmentVisible && (
          <View style={styles.accordion}>
            <TouchableOpacity style={styles.button} onPress={() => handleAlignmentPress('justifyLeft')}>
              <MaterialIcon name="format-align-left" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleAlignmentPress('justifyCenter')}>
              <MaterialIcon name="format-align-center" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleAlignmentPress('justifyRight')}>
              <MaterialIcon name="format-align-right" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleAlignmentPress('justifyFull')}>
              <MaterialIcon name="format-align-justify" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => setListStyleVisible(!listStyleVisible)}
        >
          <MaterialIcon name="format-list-bulleted" size={20} color="#333" />
        </TouchableOpacity>
        {listStyleVisible && (
          <View style={styles.accordion}>
            <TouchableOpacity style={styles.button} onPress={() => handleListStylePress('insertUnorderedList')}>
              <MaterialIcon name="format-list-bulleted" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleListStylePress('insertOrderedList')}>
              <MaterialIcon name="format-list-numbered" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {colorPickerVisible && (
        <View style={styles.colorPickerContainer}>
          <ColorPickerComponent
            onSelectColor={handleColorSelect}
            onClose={() => setColorPickerVisible(false)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#f1f1f1',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  toolbarContainer: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  colorPickerContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ccc',
    zIndex: 1000,
  },
  accordion: {
    position: 'absolute',
    bottom: 60,
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
  activeButton: {
    backgroundColor: 'rgba(0, 0, 255, 0.1)',
  },
});

export default BottomToolbar;
