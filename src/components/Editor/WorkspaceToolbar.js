import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const WorkspaceToolbar = ({ addTextbox, addImage }) => {
  return (
    <View style={styles.toolbarContainer}>
      <TouchableOpacity style={styles.button} onPress={addTextbox}>
        <MaterialIcons name="text-fields" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={addImage}>
        <MaterialIcons name="add-photo-alternate" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    padding: 10,
  },
});

export default WorkspaceToolbar;
