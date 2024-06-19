import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DynamicDrawer = ({ navigation, pages, onAddPage, setSelectedPageId, mode }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {pages.map((page) => (
        <View key={page.id} style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              setSelectedPageId(page.id);
              navigation.navigate(page.title);
            }}>
            <Text style={styles.text}>{page.title}</Text>
          </TouchableOpacity>
        </View>
      ))}
      {mode !== 'view' && (
        <TouchableOpacity style={styles.addButton} onPress={onAddPage}>
          <AntDesign name="plus" size={24} color="black" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
  },
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  item: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flex: 1,
  },
  addButton: {
    padding: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'black',
  },
});

export default DynamicDrawer;
