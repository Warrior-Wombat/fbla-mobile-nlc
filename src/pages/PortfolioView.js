import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { htmlToText } from 'html-to-text';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import uuid from 'react-native-uuid';
import PortfolioNavigator from '../navigation/PortfolioNavigator';
import { supabase } from '../utils/supabase';

const PortfolioView = ({ route }) => {
  const { mode, portfolioData } = route.params;
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const navigatorRef = useRef(null);
  const pageRefs = useRef({});
  const navigation = useNavigation();

  useEffect(() => {
    const initializePages = async () => {
      console.log("Initializing pages with portfolioData:", portfolioData);

      if (mode === 'create' || !portfolioData || !portfolioData.pages || !portfolioData.pages.length) {
        const initialPages = [{
          id: uuid.v4(),
          title: 'Page 1',
          workspace: {
            images: [],
            textboxes: [],
          },
        }];
        setPages(initialPages);
        setSelectedPageId(initialPages[0]?.id || null);
        await AsyncStorage.setItem('currentPortfolio', JSON.stringify({ id: uuid.v4(), title: 'Untitled Portfolio', pages: initialPages }));
        navigation.navigate(initialPages[0]?.title || 'Page 1', { pageId: initialPages[0]?.id || null });
      } else {
        console.log("Setting pages from portfolioData:", portfolioData.pages);
        setPages(portfolioData.pages);
        setSelectedPageId(portfolioData.pages[0]?.id || null);
        await AsyncStorage.setItem('currentPortfolio', JSON.stringify({ ...portfolioData, pages: portfolioData.pages }));
        navigation.navigate(portfolioData.pages[0]?.title, { pageId: portfolioData.pages[0]?.id || null });
      }
    };

    initializePages();
  }, [mode, portfolioData]);

  const handleAddPage = async () => {
    const getNextPageTitle = () => {
      const lastPageNumber = pages.reduce((max, page) => {
        const match = page.title.match(/^Page (\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      return `Page ${lastPageNumber + 1}`;
    };

    const newPage = {
      id: uuid.v4(),
      title: getNextPageTitle(),
      workspace: {
        images: [],
        textboxes: [],
      },
    };
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    await savePortfolioData(updatedPages);
    setSelectedPageId(newPage.id);
    navigation.navigate(newPage.title, { pageId: newPage.id });
  };

  const savePortfolioData = async (updatedPages) => {
    const jsonData = await AsyncStorage.getItem('currentPortfolio');
    if (jsonData) {
      const portfolioData = JSON.parse(jsonData);
      portfolioData.pages = updatedPages;
      await AsyncStorage.setItem('currentPortfolio', JSON.stringify(portfolioData));
    }
  };

  const gatherText = async () => {
    const finalText = [];
  
    for (let pageId in pageRefs.current) {
      if (pageRefs.current.hasOwnProperty(pageId) && pageRefs.current[pageId]) {
        const workspace = await pageRefs.current[pageId].collectPageData();
        console.log('Workspace:', workspace);
        const pageText = workspace.textboxes.map(textbox => {
          let content = '';
          try {
            // Check if content is an object and has a 'content' property
            if (typeof textbox.content === 'object' && textbox.content.content) {
              content = textbox.content.content;
            } else {
              content = JSON.parse(textbox.content).content; // Adjust if your content structure is different
            }
          } catch (error) {
            // If parsing fails, assume content is already plain text
            content = textbox.content;
          }
  
          const plainText = htmlToText(content, {
            wordwrap: 130,
            // other options you might need
          });
          console.log('Plain text from content:', plainText);
          return plainText;
        }).join(' ');
        console.log('Collected page text:', pageText);
        finalText.push(pageText);
      }
    }
  
    console.log('Final text:', finalText.join(' '));
    return finalText.join(' ');
  };

  const gatherAndSavePortfolio = async () => {
    const portfolioId = uuid.v4();
    const portfolioTitle = 'Untitled Portfolio';
    const finalPages = [];

    // Collect page data
    for (let pageId in pageRefs.current) {
      if (pageRefs.current.hasOwnProperty(pageId) && pageRefs.current[pageId]) {
        const workspace = await pageRefs.current[pageId].collectPageData();
        finalPages.push({
          id: pageId,
          title: pages.find(p => p.id === pageId).title,
          workspace,
        });
      }
    }

    // Upload images and update URLs
    for (let page of finalPages) {
      for (let image of page.workspace.images) {
        const { uri } = image;
        const fileExt = uri.split('.').pop();
        const fileName = `${image.id}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: fileName,
          type: `image/${fileExt}`,
        });

        const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(fileName, formData);

        if (uploadError && uploadError.statusCode != 409) {
          console.error('Error uploading image in PortfolioView: ', uploadError);
          continue;
        }

        const { publicURL } = supabase.storage.from('images').getPublicUrl(fileName);
        image.url = publicURL;
      }
    }

    const portfolio = {
      id: portfolioId,
      title: portfolioTitle,
      pages: finalPages,
    };

    // Save to Supabase
    const { data, error } = await supabase.from('portfolios').insert([{
      id: portfolioId,
      components: {
        title: portfolioTitle,
        pages: finalPages,
      },
    }]);

    if (error) {
      console.error('Error saving portfolio to Supabase: ', error);
    } else {
      console.log('Portfolio saved successfully: ', data);
      navigation.navigate('Overview');
    }
  };

  return (
    <View style={styles.container}>
      <PortfolioNavigator
        mode={mode}
        pages={pages}
        onAddPage={handleAddPage}
        setSelectedPageId={setSelectedPageId}
        navigatorRef={navigatorRef}
        ref={pageRefs}
        gatherAndSavePortfolio={gatherAndSavePortfolio}
        gatherText={gatherText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PortfolioView;
