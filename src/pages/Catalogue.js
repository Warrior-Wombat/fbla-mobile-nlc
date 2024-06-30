import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BackButton from '../navigation/BackButton';
import { supabase } from '../utils/supabase';

const Catalogue = () => {
  const navigation = useNavigation();
  const [portfolios, setPortfolios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [tooltipStep, setTooltipStep] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchPortfolios();
      navigation.setOptions({
        headerTitle: 'Overview',
        headerStyle: { backgroundColor: '#f9f9f9' },
        headerTintColor: '#333',
        headerTitleStyle: { fontWeight: 'bold' },
      });
    }, [navigation])
  );

  const fetchPortfolios = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('id, components->>title, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPortfolios = data.map(portfolio => ({
        portfolio_id: portfolio.id,
        title: portfolio.title,
        image: require('../../assets/portfolio.webp'),
      }));

      formattedPortfolios.push(
        {
          portfolio_id: 'new',
          title: 'Add New Portfolio',
          image: require('../../assets/plus_icon.png'),
        },
        {
          portfolio_id: 'ai',
          title: 'Create with AI',
          image: 'sparkles',
        }
      );

      setPortfolios(formattedPortfolios);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      Alert.alert('Error', 'Failed to fetch portfolios');
    }
  };

  const handlePressPortfolio = async (portfolio) => {
    if (portfolio.portfolio_id === 'ai') {
      navigation.navigate('Chatbot');
    } else if (portfolio.portfolio_id === 'new') {
      navigation.navigate('Portfolio', { mode: 'create' });
    } else {
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .eq('id', portfolio.portfolio_id)
          .single();

        if (error) throw error;

        await AsyncStorage.setItem('currentPortfolio', JSON.stringify(data));
        navigation.navigate('Portfolio', { mode: 'view', portfolioData: data.components });
      } catch (error) {
        console.error('Error loading portfolio:', error);
        Alert.alert('Error', 'Failed to load portfolio');
      }
    }
  };

  const handleEditTitle = async () => {
    if (!selectedPortfolio) return;

    try {
      const { data: currentPortfolio, error: fetchError } = await supabase
        .from('portfolios')
        .select('components')
        .eq('id', selectedPortfolio.portfolio_id)
        .single();

      if (fetchError) throw fetchError;

      const updatedComponents = {
        ...currentPortfolio.components,
        title: newTitle,
      };

      const { error: updateError } = await supabase
        .from('portfolios')
        .update({ components: updatedComponents })
        .eq('id', selectedPortfolio.portfolio_id);

      if (updateError) throw updateError;

      setModalVisible(false);
      fetchPortfolios();
    } catch (error) {
      console.error('Error updating portfolio title:', error);
      Alert.alert('Error', 'Failed to update title');
    }
  };

  const handleDeletePortfolio = async (portfolio_id) => {
    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolio_id);

      if (error) throw error;

      fetchPortfolios();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      Alert.alert('Error', 'Failed to delete portfolio');
    }
  };

  const renderTooltip = (content) => (
    <View style={[styles.tooltipContainer, { zIndex: 10 }]}>
      <View style={styles.tooltip}>
        <Text style={styles.tooltipText}>{content}</Text>
      </View>
      <View style={styles.tooltipArrow} />
    </View>
  );  

  const renderPortfolioItem = ({ item, index }) => {
    const isNewPortfolioButton = item.portfolio_id === 'new';
    const isAIButton = item.portfolio_id === 'ai';
    const isFirstPortfolio = index === 0 && !isNewPortfolioButton && !isAIButton;

    const showTooltip = 
      (isNewPortfolioButton && tooltipStep === 0) ||
      (isFirstPortfolio && tooltipStep === 1) ||
      (isAIButton && tooltipStep === 2);

    const tooltipContent = 
      isNewPortfolioButton
        ? 'Tap here to add a new portfolio from scratch.'
        : isFirstPortfolio
        ? 'This is your first portfolio. Tap to view or edit.'
        : 'Create a new portfolio with AI assistance.';

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.portfolioItem}
          onPress={() => {
            if (showTooltip) {
              setTooltipStep(prevStep => prevStep + 1);
            } else {
              handlePressPortfolio(item);
            }
          }}
        >
          {isAIButton ? (
            <MaterialIcons name="auto-awesome" size={50} color="#000" style={styles.icon} />
          ) : (
            <Image source={item.image} style={styles.image} />
          )}
          <Text style={styles.portfolioText}>{item.title}</Text>
          {!isNewPortfolioButton && !isAIButton && (
            <Menu>
              <MenuTrigger>
                <MaterialIcons name="more-vert" size={30} color="#333" />
              </MenuTrigger>
              <MenuOptions customStyles={optionsStyles}>
                <MenuOption onSelect={() => { setSelectedPortfolio(item); setNewTitle(item.title); setModalVisible(true); }}>
                  <Text style={styles.optionText}>Edit Title</Text>
                </MenuOption>
                <MenuOption onSelect={() => handleDeletePortfolio(item.portfolio_id)}>
                  <Text style={[styles.optionText, { color: 'red' }]}>Delete Portfolio</Text>
                </MenuOption>
              </MenuOptions>
            </Menu>
          )}
        </TouchableOpacity>
        {showTooltip && renderTooltip(tooltipContent)}
      </View>
    );
  };

  return (
    <MenuProvider>
      <View style={styles.container}>
        <BackButton />
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome!</Text>
        </View>
        <Text style={styles.subheaderText}>Tap a portfolio to get started.</Text>
        <FlatList
          data={portfolios}
          keyExtractor={(item) => item.portfolio_id.toString()}
          renderItem={renderPortfolioItem}
          contentContainerStyle={styles.flatListContent}
        />
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Portfolio Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="New Title"
                value={newTitle}
                onChangeText={setNewTitle}
              />
              <TouchableOpacity style={styles.modalButton} onPress={handleEditTitle}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </MenuProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  subheaderText: {
    fontSize: 18,
    color: 'grey',
    marginBottom: 16,
    alignSelf: 'center',
  },
  flatListContent: {
    paddingVertical: 10,
  },
  itemContainer: {
    marginBottom: 20,
  },
  portfolioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  icon: {
    marginRight: 16,
  },
  portfolioText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: -45,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },  
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  tooltipText: {
    color: 'white',
    textAlign: 'center',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(0, 0, 0, 0.7)',
    alignSelf: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  modalInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  modalButton: {
    backgroundColor: '#1E90FF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalCancelButton: {
    backgroundColor: 'red',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});

const optionsStyles = {
  optionsContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
  },
};

export default Catalogue;
