import { createDrawerNavigator } from '@react-navigation/drawer';
import React, { forwardRef } from 'react';
import uuid from 'react-native-uuid';
import FreeformWorkspace from '../components/Editor/FreeformWorkspace';
import DynamicDrawer from './DynamicDrawer';

const Drawer = createDrawerNavigator();

const PortfolioNavigator = forwardRef((props, ref) => {
  const { pages, onAddPage, setSelectedPageId, mode } = props;

  const initialPageData = {
    id: uuid.v4(),
    title: 'New Page',
    workspace: {
      images: [],
      textboxes: [],
    },
  };

  return (
    <Drawer.Navigator
      initialRouteName="FreeformWorkspace"
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
                ref={(instance) => ref.current[page.id] = instance}
              />
            )}
          </Drawer.Screen>
        ))
      ) : (
        <Drawer.Screen name="New Page" initialParams={{ pageId: initialPageData.id, mode: mode, pageData: initialPageData.workspace }}>
          {(screenProps) => (
            <FreeformWorkspace
              {...screenProps}
              ref={(instance) => ref.current[initialPageData.id] = instance}
            />
          )}
        </Drawer.Screen>
      )}
    </Drawer.Navigator>
  );
});

export default PortfolioNavigator;
