import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeaderBackButton } from '@react-navigation/elements';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
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
import { supabase } from '../utils/supabase';

const Catalogue = () => {
  const navigation = useNavigation();
  const [portfolios, setPortfolios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchPortfolios();
    }, [])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Overview',
      headerLeft: () => (
        <HeaderBackButton onPress={() => navigation.goBack()} />
      ),
      headerStyle: {
        backgroundColor: '#f9f9f9',
      },
      headerTintColor: '#333',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    const { data, error } = await supabase
      .from('portfolios')
      .select('id, components->>title, created_at')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching portfolios:', error);
      Alert.alert('Error', 'Failed to fetch portfolios');
      return;
    }
  
    const formattedPortfolios = data.map(portfolio => ({
      portfolio_id: portfolio.id,
      title: portfolio.title,
      image: require('../../assets/portfolio.webp'),
    }));
  
    formattedPortfolios.push({
      portfolio_id: 'new',
      title: 'Add New Portfolio',
      image: require('../../assets/plus_icon.png'),
    });
  
    setPortfolios(formattedPortfolios);
  };  

  const handlePressPortfolio = async (index) => {
    if (portfolios[index].portfolio_id === 'new') {
      navigation.navigate('Portfolio', { mode: 'create' });
    } else {
      try {
        const selectedPortfolio = portfolios[index];
        const { data, error } = await supabase.from('portfolios').select('*').eq('id', selectedPortfolio.portfolio_id).single();
        
        if (error) {
          console.error('Error fetching portfolio:', error);
          Alert.alert('Error', 'Failed to load portfolio');
          return;
        }

        await AsyncStorage.setItem('currentPortfolio', JSON.stringify(data));
        console.log("Navigating to Portfolio screen with data:", JSON.stringify(data));
        navigation.navigate('Portfolio', { mode: 'view', portfolioData: data.components });
      } catch (error) {
        console.error('Error setting portfolio data:', error);
        Alert.alert('Error', 'Failed to navigate to portfolio');
      }
    }
  };

  const handleEditTitle = async () => {
    if (!selectedPortfolio) return;
  
    try {
      // Fetch the current portfolio data
      const { data: currentPortfolio, error: fetchError } = await supabase
        .from('portfolios')
        .select('components')
        .eq('id', selectedPortfolio.portfolio_id)
        .single();
  
      if (fetchError) {
        console.error('Error fetching current portfolio:', fetchError);
        Alert.alert('Error', 'Failed to fetch current portfolio data');
        return;
      }
  
      // Update the title within the components object
      const updatedComponents = {
        ...currentPortfolio.components,
        title: newTitle
      };
  
      // Save the updated portfolio back to the database
      const { error: updateError } = await supabase
        .from('portfolios')
        .update({ components: updatedComponents })
        .eq('id', selectedPortfolio.portfolio_id);
  
      if (updateError) {
        console.error('Error updating portfolio title:', updateError);
        Alert.alert('Error', 'Failed to update title');
        return;
      }
  
      setModalVisible(false);
      fetchPortfolios();
    } catch (error) {
      console.error('Error handling edit title:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };   

  const handleDeletePortfolio = async (portfolio_id) => {
    const { data, error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolio_id);

    if (error) {
      console.error('Error deleting portfolio:', error);
      Alert.alert('Error', 'Failed to delete portfolio');
      return;
    }

    fetchPortfolios();
  };

  const renderPortfolioItem = ({ item, index }) => (
    <View style={styles.portfolioItemContainer}>
      <TouchableOpacity
        style={styles.portfolioItem}
        onPress={() => handlePressPortfolio(index)}>
        <Image source={item.image} style={styles.image} />
        <Text style={styles.portfolioText}>{item.title}</Text>
      </TouchableOpacity>
      {item.portfolio_id !== 'new' && (
      <Menu>
        <MenuTrigger>
          <MaterialIcons name="more-vert" size={30} color="#333" />
        </MenuTrigger>
        <MenuOptions customStyles={styles}>
          <MenuOption onSelect={() => { setSelectedPortfolio(item); setNewTitle(item.title); setModalVisible(true); }}>
            <Text style={styles.optionText}>Edit Title</Text>
          </MenuOption>
          <MenuOption onSelect={() => handleDeletePortfolio(item.portfolio_id)}>
            <Text style={[styles.optionText, { color: 'red' }]}>Delete Portfolio</Text>
          </MenuOption>
        </MenuOptions>
      </Menu>
      )}
    </View>
  );

  return (
    <MenuProvider>
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome!</Text>
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
          onRequestClose={() => setModalVisible(false)}>
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
    width: '100%',
    backgroundColor: '#f2f2f2',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    alignSelf: 'center',
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
  portfolioItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  portfolioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  portfolioText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  optionsContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});

export default Catalogue;