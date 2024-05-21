import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const generateShades = (baseColor) => {
  const shades = [];
  for (let i = 0; i < 10; i++) {
    const shade = shadeColor(baseColor, (i + 1) * 10);
    shades.push(shade);
  }
  return shades;
};

const shadeColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
  const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
  const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

  return "#" + RR + GG + BB;
};

const baseColors = [
  '#FF0000', // Red
  '#FFA500', // Orange
  '#FFFF00', // Yellow
  '#008000', // Green
  '#0000FF', // Blue
  '#4B0082', // Indigo
  '#EE82EE', // Violet
  '#A52A2A', // Brown
  '#808080', // Gray
  '#000000', // Black
  '#FFFFFF'  // White
];

const colorPalette = baseColors.map(color => generateShades(color));

const ColorPickerComponent = ({ onSelectColor, onClose }) => {
  const [selectedColor, setSelectedColor] = useState(null);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    onSelectColor(color);
  };

  return (
    <View style={styles.colorPickerContainer}>
      <ScrollView contentContainerStyle={styles.colorsGrid}>
        {colorPalette.map((colorRow, rowIndex) => (
          <View key={rowIndex} style={styles.colorRow}>
            {colorRow.map((color, colorIndex) => (
              <TouchableOpacity
                key={colorIndex}
                style={[styles.colorButton, { backgroundColor: color }]}
                onPress={() => handleColorSelect(color)}
              >
                {selectedColor === color && (
                  <FontAwesome name="check" size={16} color="#FFF" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
      <Button title="Close" onPress={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  colorPickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  colorsGrid: {
    flexDirection: 'column',
    padding: 20,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  colorButton: {
    width: 30,
    height: 30,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute',
  }
});

export default ColorPickerComponent;
