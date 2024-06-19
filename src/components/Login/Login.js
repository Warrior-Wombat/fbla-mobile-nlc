import { useNavigation } from "@react-navigation/native";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { supabase } from "../../utils/supabase";

WebBrowser.maybeCompleteAuthSession();
const redirectTo = makeRedirectUri();
console.log(redirectTo);

export default function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const createSessionFromUrl = async (url) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);
    const { access_token, refresh_token } = params;
    if (!access_token) return;
    console.log(access_token);
    console.log(refresh_token);

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
    return data.session;
  };

  const signInWithProvider = async (provider) => {
    try {
      console.log('Initiating sign-in...');
      console.log('Redirect URI:', redirectTo);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('Error during signInWithOAuth:', error);
        throw error;
      }

      console.log('Received data from signInWithOAuth:', data);
      console.log('Opening auth session with WebBrowser...');
      const res = await WebBrowser.openAuthSessionAsync(
        data?.url ?? "",
        redirectTo
      );

      console.log('WebBrowser auth session result:', res);
      if (res.type === "success") {
        console.log('WebBrowser auth session successful');
        const { url } = res;
        console.log('Redirect URL:', url);
        navigation.navigate('Overview')
        console.log('Creating session from URL...');
        await createSessionFromUrl(url);
        console.log('Session created successfully');
      } else {
        console.log('WebBrowser auth session failed');
        console.log('Result type:', res.type);
        console.log('Result:', res);
      }


    } catch (error) {
      console.error('An unexpected error occurred during sign-in:', error.message);
      console.error('Error details:', error);
    }
  };

  const handleSignIn = async () => {
    console.log('Attempting to sign in with:', { email, password });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign In Error:', error.message);
      Alert.alert(
        'Invalid Login', 
        'Either your username or password is incorrect. Please try again!'
      );
    } else {
      console.log('Sign In Data:', data);
      Alert.alert(
        'Login Successful', 
        'Signed in successfully!'
      );
      navigation.navigate('Overview')
    }
  };  

  const handleSignUp = async () => {
    navigation.navigate('Signup');
  };

  const url = Linking.useURL();
  if (url) createSessionFromUrl(url);

  const SocialButton = ({ iconName, backgroundColor, onPress }) => (
    <TouchableOpacity
      style={[styles.socialButton, { backgroundColor }]}
      onPress={onPress}
    >
      <Icon name={iconName} size={30} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.loginText}>Login</Text>
      <Text style={styles.loginSubtext}>Please login to your account.</Text>
      
      <TextInput
        style={styles.inputField}
        placeholder="Email"
        keyboardType="email-address"
        placeholderTextColor="#aaaaaa"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.inputField}
        placeholder="Password"
        secureTextEntry
        placeholderTextColor="#aaaaaa"
        value={password}
        onChangeText={setPassword}
      />
      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      
      <TouchableOpacity style={styles.loginButton} onPress={handleSignIn}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.orContainer}>
        <View style={styles.dashedLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.dashedLine} />
      </View>

      <View style={styles.socialContainer}>
        <SocialButton iconName="google" backgroundColor="#DB4437" onPress={() => signInWithProvider('google')} />
        <SocialButton iconName="facebook" backgroundColor="#3B5998" onPress={() => signInWithProvider('facebook')} />
        <SocialButton iconName="twitter" backgroundColor="#1DA1F2" onPress={() => signInWithProvider('twitter')} />
        <SocialButton iconName="github" backgroundColor="#333" onPress={() => signInWithProvider('github')} />
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={handleSignUp}>
          <Text style={styles.signupLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'center',
    marginBottom: 10,
  },
  loginSubtext: {
    fontSize: 16,
    color: '#666',
    alignSelf: 'center',
    marginBottom: 20,
  },
  inputField: {
    borderColor: '#1E3A8A', // Blue shade matching the logo
    borderWidth: 2,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    color: '#000', // Black text color
    backgroundColor: '#fff', // White background for inputs
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1E3A8A', // Blue shade matching the logo
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#1E3A8A', // Blue shade matching the logo
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    fontSize: 18,
    color: '#fff', // White text
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#1E3A8A', // Blue shade matching the logo
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  signupButtonText: {
    fontSize: 18,
    color: '#fff', // White text
    fontWeight: 'bold',
  },
  orText: {
    alignSelf: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: 'lightgrey',
    borderStyle: 'dashed',
    borderRadius: 1,
    marginHorizontal: 10,
  },
  orText: {
    color: 'lightgrey',
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#1E3A8A', // Blue shade matching the logo
    textDecorationLine: 'underline',
  },
});
