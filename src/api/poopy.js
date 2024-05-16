import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';

WebBrowser.maybeCompleteAuthSession();

// Configure the discovery document
const discovery = {
  authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
  tokenEndpoint: "https://twitter.com/i/oauth2/token",
  revocationEndpoint: "https://twitter.com/i/oauth2/revoke",
};

const signInWithTwitter = async () => {
  // Dynamically generate the redirect URI
  const redirectUri = makeRedirectUri({
    useProxy: Platform.select({ web: false, default: true }),
    native: 'fblamobilenlc://v1/auth/callback'
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'YOUR_TWITTER_CLIENT_ID',
      redirectUri: redirectUri,
      responseType: ResponseType.Code,
      usePKCE: true,
      scopes: ["tweet.read"],
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('Authentication success, code:', code);
    } else if (response?.type === 'error') {
      console.error('Authentication error:', response.error);
    }
  }, [response]);

  try {
    console.log('Initiating Twitter sign-in...');
    if (request) {
      console.log('Opening URL:', request.url);
      const result = await promptAsync({ useProxy: true });
      console.log('WebBrowser result:', result);

      if (result.type === 'success') {
        console.log('Authentication success:', result);
      } else {
        console.log('Authentication canceled or failed:', result.type);
      }
    } else {
      console.log('No request URL returned for authentication');
    }
  } catch (error) {
    console.error('An unexpected error occurred during Twitter sign-in:', error.message);
  }
};

export default signInWithTwitter;