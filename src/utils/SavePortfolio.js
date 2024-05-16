import * as FileSystem from 'expo-file-system';

const saveContentToFile = async (content) => {
  const fileUri = FileSystem.documentDirectory + 'savedContent.html';
  try {
    await FileSystem.writeAsStringAsync(fileUri, content);
    console.log('File saved successfully:', fileUri);
  } catch (error) {
    console.error('Error saving file:', error);
  }
};

onMessage={(event) => {
  const content = event.nativeEvent.data;
  saveContentToFile(content);
}}

////////////////////////////////// 
const saveContentToServer = async (content) => {
    try {
        const response = await fetch('https://your-backend-server.com/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
        });
        const result = await response.json();
        console.log('Content saved successfully:', result);
    } catch (error) {
        console.error('Error saving content to server:', error);
    }
};

// Use the saveContentToServer function inside the onMessage handler:
onMessage={(event) => {
const content = event.nativeEvent.data;
saveContentToServer(content);
}}
  