import { GOOGLE_WEB_CLIENT_ID } from '@env';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import supabase from '../utils/supabase';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    if (userInfo.idToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.idToken,
      });
      if (error) {
        console.error('Error signing in:', error.message);
      } else {
        console.log('User data:', data);
      }
    } else {
      throw new Error('no ID token present!');
    }
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled the login flow');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Operation (e.g. sign in) is in progress already');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('Play services not available or outdated');
    } else {
      console.error('Other error:', error);
    }
  }
}

export const signInWithTwitter = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter'
    })
    console.log(data);
    if (error) throw error;
  } catch (error) {
    console.log(error);
  }
}