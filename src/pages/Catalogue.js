import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeaderBackButton } from '@react-navigation/elements';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../utils/supabase';

const UserOverviewScreen = () => {
  const navigation = useNavigation();
  const [portfolios, setPortfolios] = useState([]);

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
    const { data, error } = await supabase.from('portfolios').select('id, components->>title');

    if (error) {
      console.error('Error fetching portfolios:', error);
      Alert.alert('Error', 'Failed to fetch portfolios');
      return;
    }

    const formattedPortfolios = data.map(portfolio => ({
      portfolio_id: portfolio.id,
      title: portfolio.title,
      image: require('../../assets/portfolio.webp'),  // Use default image
    }));

    // Add the "Add New Portfolio" item
    formattedPortfolios.push({
      portfolio_id: 'new',
      title: 'Add New Portfolio',
      image: require('../../assets/portfolio.png'),
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

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome!</Text>
      <Text style={styles.subheaderText}>Tap a portfolio to get started.</Text>
      <FlatList
        data={portfolios}
        keyExtractor={(item) => item.portfolio_id.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.portfolioItem}
            onPress={() => handlePressPortfolio(index)}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.portfolioText}>{item.title}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  portfolioItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default UserOverviewScreen;
