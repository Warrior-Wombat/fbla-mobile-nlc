import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Button, StatusBar, StyleSheet, View } from 'react-native';
import { supabase } from "../../utils/supabase";

WebBrowser.maybeCompleteAuthSession();
const redirectTo = makeRedirectUri();
console.log(redirectTo);

export default function LoginComponent() {
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
      console.log('Initiating Twitter sign-in...');
      console.log('Redirect URI:', redirectTo);
  
      console.log('Calling supabase.auth.signInWithOAuth...');
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
  
        console.log('Creating session from URL...');
        await createSessionFromUrl(url);
        console.log('Session created successfully');
      } else {
        console.log('WebBrowser auth session failed');
        console.log('Result type:', res.type);
        console.log('Result:', res);
      }
    } catch (error) {
      console.error('An unexpected error occurred during Twitter sign-in:', error.message);
      console.error('Error details:', error);
    }
  };

  const handleSignIn = (provider) => {
    return () => signInWithProvider(provider);
  };

  const url = Linking.useURL();
  if (url) createSessionFromUrl(url);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Button title="pen is" onPress={handleSignIn('twitter')}></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
