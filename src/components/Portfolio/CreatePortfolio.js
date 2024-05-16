import React, { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

const CreatePortfolio = () => {
  const richText = useRef(null);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.editorContainer} keyboardDismissMode="on-drag">
        <RichEditor
          ref={richText}
          style={styles.editor}
          initialContentHTML='Start editing your portfolio here!'
          editorStyle={{ backgroundColor: '#fff' }}
        />
      </ScrollView>
      <RichToolbar
        style={styles.toolbar}
        getEditor={() => richText.current}
        iconTint="#000000"
        selectedIconTint="#2095F2"
        iconSize={30}
        actions={[
          'insertImage',
          'bold',
          'italic',
          'unorderedList',
          'orderedList'
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#fff',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  editorContainer: {
    flex: 1,
    padding: 10,
  },
  editor: {
    backgroundColor: '#fff',
    minHeight: 300, // Set the minimum height for the editor
  },
  toolbar: {
    minHeight: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'space-evenly',
  },
});

export default CreatePortfolio;
