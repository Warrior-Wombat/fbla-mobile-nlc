import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import React, { forwardRef, useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Share from 'react-native-share';
import uuid from 'react-native-uuid';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { captureScreen } from 'react-native-view-shot';
import FreeformWorkspace from '../components/Editor/FreeformWorkspace';
import DynamicDrawer from './DynamicDrawer';

const Drawer = createDrawerNavigator();

const PortfolioNavigator = forwardRef((props, ref) => {
  const { pages, onAddPage, setSelectedPageId, mode, gatherAndSavePortfolio, gatherText } = props;
  const navigation = useNavigation();
  const originalRoute = useRef(null);

  const captureAndSavePage = async (pageId, pageTitle) => {
    console.log(`Navigating to page: ${pageTitle}`);
    await navigation.navigate(pageTitle);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Capturing screen for page: ${pageTitle}`);
    const uri = await captureScreen({ format: 'png', quality: 0.9 });
    const filePath = `${FileSystem.documentDirectory}portfolio_${pageId}_${uuid.v4()}.png`;
    console.log(`Saving captured screen to: ${filePath}`);
    await FileSystem.moveAsync({ from: uri, to: filePath });
    await MediaLibrary.saveToLibraryAsync(filePath);
    return filePath;
  };

  const capturePortfolio = async () => {
    const filePaths = [];
    for (const page of pages) {
      const pageId = page.id;
      const pageTitle = page.title;

      if (pageTitle) {
        const filePath = await captureAndSavePage(pageId, pageTitle);
        filePaths.push(filePath);
      } else {
        console.error(`Page title is undefined for pageId: ${pageId}`);
      }
    }
    return filePaths;
  };

  const sharePortfolio = async () => {
    try {
      const filePaths = await capturePortfolio();
      console.log('Captured file paths:', filePaths);

      const shareOptions = {
        title: 'Share Portfolio',
        urls: filePaths,
        type: 'image/png',
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error sharing portfolio:', error);
    }
  };

  const HeaderRightButton = () => {
    const handlePress = () => {
      if (mode === 'create') {
        gatherAndSavePortfolio();
      } else if (mode === 'view') {
        sharePortfolio();
      }
    };

    return (
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <MaterialIcons name={mode === 'create' ? 'save' : 'share'} size={24} color="black" />
      </TouchableOpacity>
    );
  };

  return (
    <Drawer.Navigator
      initialRouteName="FreeformWorkspace"
      screenOptions={{
        headerRight: () => <HeaderRightButton />,
      }}
      drawerContent={(drawerProps) => (
        <DynamicDrawer
          {...drawerProps}
          pages={pages}
          onAddPage={onAddPage}
          setSelectedPageId={setSelectedPageId}
          mode={mode}
        />
      )}
    >
      {pages && pages.length > 0 ? (
        pages.map((page) => (
          <Drawer.Screen
            key={page.id}
            name={page.title}
            initialParams={{ pageId: page.id, mode: mode, pageData: page.workspace }}
          >
            {(screenProps) => (
              <FreeformWorkspace
                {...screenProps}
                ref={el => ref.current[page.id] = el}
              />
            )}
          </Drawer.Screen>
        ))
      ) : (
        <Drawer.Screen name="New Page" initialParams={{ pageId: uuid.v4(), mode: mode, pageData: { images: [], textboxes: [] } }}>
          {(screenProps) => (
            <FreeformWorkspace
              {...screenProps}
              ref={el => ref.current[screenProps.route.params.pageId] = el}
            />
          )}
        </Drawer.Screen>
      )}
    </Drawer.Navigator>
  );
});

const styles = StyleSheet.create({
  button: {
    padding: 10,
    marginRight: 5,
  },
});

export default PortfolioNavigator;
