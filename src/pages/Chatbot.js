import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY, UNSPLASH_ACCESS_KEY } from '@env';
import axios from 'axios';
import { randomUUID } from 'expo-crypto';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BackButton from '../navigation/BackButton';
import { supabase } from '../utils/supabase';

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

const createPortfolioTool = {
  name: 'createPortfolio',
  description: 'Create a portfolio with a specified title, pages, and workspace content. This is meant to go on a mobile device, the x-dimensions can range from -100 to 100 roughly, but be careful when incorporating width into this as the textbox may go off of the page. The textbox width and height should be minimum 150 and 300 respectively. For instance, an x of 200 for a textbox with a width of 300 made the right half of the textbox go off of the page. Thus, you may need to do mathematical calculations to ensure that the textbox stays within x-bounds. Since the page is scrollable, we can have infinite y-coordinates. The most important thing is that for the image uri field, please put this as fetchImage(query), as this is the function inside of my app to fetch from Unsplash API. The query is just anything that you want to fetch from Unsplash that matches the page theme or what the page is talking about mostly.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the portfolio'
      },
      pages: {
        type: 'array',
        description: 'Array of pages in the portfolio',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the page'
            },
            title: {
              type: 'string',
              description: 'Title of the page'
            },
            workspace: {
              type: 'object',
              properties: {
                images: {
                  type: 'array',
                  description: 'Array of images in the workspace',
                  items: {
                    type: 'object',
                    properties: {
                      x: {
                        type: 'number',
                        description: 'X coordinate of the image'
                      },
                      y: {
                        type: 'number',
                        description: 'Y coordinate of the image'
                      },
                      id: {
                        type: 'string',
                        description: 'Unique identifier for the image'
                      },
                      uri: {
                        type: 'string',
                        description: 'URI of the image'
                      },
                      width: {
                        type: 'number',
                        description: 'Width of the image'
                      },
                      height: {
                        type: 'number',
                        description: 'Height of the image'
                      },
                    }
                  }
                },
                textboxes: {
                  type: 'array',
                  description: 'Array of textboxes in the workspace',
                  items: {
                    type: 'object',
                    properties: {
                      x: {
                        type: 'number',
                        description: 'X coordinate of the textbox'
                      },
                      y: {
                        type: 'number',
                        description: 'Y coordinate of the textbox'
                      },
                      id: {
                        type: 'string',
                        description: 'Unique identifier for the textbox'
                      },
                      width: {
                        type: 'number',
                        description: 'Width of the textbox'
                      },
                      height: {
                        type: 'number',
                        description: 'Height of the textbox'
                      },
                      content: {
                        type: 'object',
                        properties: {
                          content: {
                            type: 'string',
                            description: 'Content of the textbox'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    required: ['title', 'pages']
  }
};

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const MessageItem = useCallback(({ item }) => {
    const isAI = item.sender === 'ai';
    const animatedValue = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isAI ? styles.aiMessage : styles.userMessage,
          {
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
            opacity: animatedValue,
          },
        ]}
      >
        {isAI && (
          <View style={[styles.avatarContainer, styles.aiAvatarContainer]}>
            <Image source={require('../../assets/portfolio_logo_circle.png')} style={styles.avatarImage} />
          </View>
        )}
        <View style={[styles.textBubble, isAI ? styles.aiTextBubble : styles.userTextBubble]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
        {!isAI && (
          <View style={[styles.avatarContainer, styles.userAvatarContainer]}>
            <MaterialIcons name="person" size={24} color="#2196F3" style={styles.avatar} />
          </View>
        )}
      </Animated.View>
    );
  }, []);

  const fetchImage = async (query) => {
    const url = `https://api.unsplash.com/search/photos?page=1&query=${query}&client_id=${UNSPLASH_ACCESS_KEY}`;
    try {
      const response = await axios.get(url);
      const imageURI = response.data.results[0]?.urls.small;
      return imageURI;
    } catch (error) {
      console.error('Error fetching images from Unsplash:', error);
      return null;
    }
  };

  const replaceImageURIs = async (workspace) => {
    if (workspace && workspace.images) {
      for (let i = 0; i < workspace.images.length; i++) {
        const image = workspace.images[i];
        if (image.uri && image.uri.includes('fetchImage(')) {
          const query = image.uri.match(/fetchImage\((.*)\)/)[1].replace(/['"]+/g, '');
          const uri = await fetchImage(query);
          image.uri = uri;
        }
      }
    }
  };

  const extractPortfolioLogic = async (toolInput) => {
    try {
      const { title, pages } = toolInput;
  
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        await replaceImageURIs(page.workspace);
      }
  
      return {
        title,
        pages,
      };
    } catch (error) {
      console.error('Error extracting portfolio logic:', error);
      return null;
    }
  };  
  
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
  
    const userMessage = { sender: 'user', text: inputText };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');
  
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: "You are a seasoned portfolio assistant that helps high-profile individuals build their portfolios. You can assist them if they ask various questions about their portfolio, or call the createPortfolio function whenever someone asks you to create a portfolio.",
        messages: [
          { role: 'user', content: inputText }
        ],
        tools: [createPortfolioTool]
      });
  
      const aiMessage = { sender: 'ai', text: response.content[0].text };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
  
      const toolCalls = response.content.filter(item => item.type === 'tool_use');
      if (toolCalls.length > 0) {
        const toolInput = toolCalls[0].input;
        console.log('Tool input:', JSON.stringify(toolInput, null, 2));
        const correctedPortfolio = await extractPortfolioLogic(toolInput);
        console.log('Corrected Portfolio:', JSON.stringify(correctedPortfolio, null, 2));
        savePortfolio(correctedPortfolio);
      }
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
    }
  };  

  const savePortfolio = async (response) => {
    try {
      const title = response.title;
      const pages = response.pages;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        await replaceImageURIs(page.workspace);
      }
  
      const correctedPortfolio = {
        title,
        pages,
      };
  
      const portfolioId = randomUUID();
      const { data: supabaseData, error } = await supabase.from('portfolios').insert([{
        id: portfolioId,
        components: correctedPortfolio,
      }]);
  
      if (error) {
        console.error('Error saving portfolio to Supabase:', error);
      } else {
        console.log('Portfolio saved successfully:', supabaseData);
      }
    } catch (error) {
      console.error('Error extracting portfolio logic:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <BackButton />
        <Text style={styles.headerTitle}>AI Chat Assistant</Text>
        <Text style={styles.headerDescription}>Ask me anything about your portfolio</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageItem item={item} />}
        keyExtractor={(item, index) => index.toString()}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.chatContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <MaterialIcons name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 30,
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerDescription: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  chatContainer: {
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    marginHorizontal: 10,
    maxWidth: '80%',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  avatarContainer: {
    marginBottom: 5,
  },
  aiAvatarContainer: {
    marginTop: -2,
    marginRight: 10,
  },
  userAvatarContainer: {
    marginLeft: 2,
    marginTop: 10,
  },
  avatar: {
    backgroundColor: '#EEEEEE',
    padding: 5,
    borderRadius: 12,
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  textBubble: {
    borderRadius: 20,
    padding: 10,
    paddingTop: 12.5,
    backgroundColor: '#FFFFFF',
  },
  aiTextBubble: {
    marginRight: 10,
    marginTop: -10,
  },
  userTextBubble: {
    marginRight: 10,
    backgroundColor: '#87CEEB',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatbotScreen;
