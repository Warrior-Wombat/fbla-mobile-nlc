// Not needed anymore due to expo-share. 
import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from '@env';
 
const extractTextFields = (pages) => {
return pages
    .map(page => page.workspace.textboxes.map(textbox => textbox.content).join(' '))
    .join(' ');
};

const getClaudeSummary = async (text) => {
    const anthropic = new Anthropic({
        apiKey: CLAUDE_API_KEY,
    });

    const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 80,
        messages: [
        { role: 'user', content: `Please summarize the following text in 235 characters or less:\n\n${text}` },
        ],
    });

    console.log(response);
    return response.content[0].text.trim();
};

const postTweetToTwitter = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('twitter_access_token');
      if (!accessToken) {
        console.error('Access token is missing');
        return;
      }

      const text = await gatherText();
      console.log('Extracted Text:', text);

      const summary = await getClaudeSummary(text);
      console.log('Summary:', summary);
      const statusData = { text: summary };

      console.log('Posting tweet to Twitter');
      await axios.post('https://api.twitter.com/2/tweets', statusData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Tweet posted successfully');
    } catch (error) {
      if (error.response) {
        console.error('Error posting to Twitter:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers,
        });
      } else {
        console.error('Error posting to Twitter:', error.message);
      }
    }
  };