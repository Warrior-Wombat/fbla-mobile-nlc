import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from "../../utils/supabase";

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Signed up successfully!');
    }

    handleLogin();
  };

  const handleLogin = async () => {
    navigation.navigate('Login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.signUpText}>Sign Up</Text>
      <Text style={styles.signUpSubtext}>Create a new account.</Text>
      
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
      
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <Text style={styles.signUpButtonText}>Sign Up</Text>
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.loginLink}>Login</Text>
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
  signUpText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'center',
    marginBottom: 10,
  },
  signUpSubtext: {
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
  signUpButton: {
    backgroundColor: '#1E3A8A', // Blue shade matching the logo
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  signUpButtonText: {
    fontSize: 18,
    color: '#fff', // White text
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#1E3A8A', // Blue shade matching the logo
    textDecorationLine: 'underline',
  },
});
