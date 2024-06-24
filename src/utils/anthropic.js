import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from '@env';

export default anthropic = new Anthropic({
    apiKey: CLAUDE_API_KEY,
});