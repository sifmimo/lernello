'use server';

export type AIProvider = 'openai' | 'anthropic' | 'platform';
export type AIModel = 
  | 'gpt-4o' 
  | 'gpt-4o-mini' 
  | 'gpt-4-turbo'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-haiku-20240307';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AICompletionOptions {
  messages: AIMessage[];
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
}

interface AICompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const defaultOpenAIModel: AIModel = 'gpt-4o-mini';
const defaultAnthropicModel: AIModel = 'claude-3-haiku-20240307';

export async function createOpenAICompletion(
  apiKey: string,
  options: AICompletionOptions
): Promise<AICompletionResult> {
  const model = options.model || defaultOpenAIModel;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    content: data.choices?.[0]?.message?.content || '',
    model,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

export async function createAnthropicCompletion(
  apiKey: string,
  options: AICompletionOptions
): Promise<AICompletionResult> {
  const model = options.model || defaultAnthropicModel;
  
  const systemMessage = options.messages.find(m => m.role === 'system');
  const otherMessages = options.messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 1024,
      system: systemMessage?.content,
      messages: otherMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.content?.find((c: { type: string }) => c.type === 'text');
  
  return {
    content: textContent?.text || '',
    model,
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined,
  };
}

export async function createAICompletion(
  provider: AIProvider,
  apiKey: string,
  options: AICompletionOptions
): Promise<AICompletionResult> {
  switch (provider) {
    case 'openai':
      return createOpenAICompletion(apiKey, options);
    case 'anthropic':
      return createAnthropicCompletion(apiKey, options);
    case 'platform':
      if (process.env.OPENAI_API_KEY) {
        return createOpenAICompletion(process.env.OPENAI_API_KEY, options);
      }
      if (process.env.ANTHROPIC_API_KEY) {
        return createAnthropicCompletion(process.env.ANTHROPIC_API_KEY, options);
      }
      throw new Error('No platform AI key configured');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function getProviderFromModel(model: AIModel): AIProvider {
  if (model.startsWith('gpt-')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  return 'platform';
}
