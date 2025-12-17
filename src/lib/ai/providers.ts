'use server';

export type AIProvider = 'openai' | 'anthropic' | 'platform';
export type AIModel = 
  | 'gpt-4o' 
  | 'gpt-4o-mini' 
  | 'gpt-4o-2024-11-20'
  | 'gpt-4-turbo'
  | 'o1'
  | 'o1-mini'
  | 'o1-preview'
  | 'o3-mini'
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
  
  // Les modèles o1/o3 ne supportent pas system messages ni temperature
  const isReasoningModel = model.startsWith('o1') || model.startsWith('o3');
  
  let messages = options.messages;
  if (isReasoningModel) {
    // Convertir system message en user message pour les modèles o1/o3
    messages = options.messages.map(m => 
      m.role === 'system' ? { ...m, role: 'user' as const } : m
    );
  }

  const requestBody: Record<string, unknown> = {
    model,
    messages,
  };

  // Les modèles o1/o3 n'acceptent pas temperature
  if (!isReasoningModel) {
    requestBody.temperature = options.temperature ?? 0.7;
    requestBody.max_tokens = options.maxTokens ?? 1024;
  } else {
    requestBody.max_completion_tokens = options.maxTokens ?? 4096;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
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

export async function getProviderFromModel(model: AIModel): Promise<AIProvider> {
  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  return 'platform';
}

export async function isReasoningModel(model: AIModel): Promise<boolean> {
  return model.startsWith('o1') || model.startsWith('o3');
}

export async function getModelInfo(model: AIModel): Promise<{ name: string; description: string; provider: AIProvider; isReasoning?: boolean }> {
  const modelInfo: Record<AIModel, { name: string; description: string; provider: AIProvider; isReasoning?: boolean }> = {
    'gpt-4o': { name: 'GPT-4o', description: 'Modèle multimodal rapide et performant', provider: 'openai' },
    'gpt-4o-mini': { name: 'GPT-4o Mini', description: 'Version économique de GPT-4o', provider: 'openai' },
    'gpt-4o-2024-11-20': { name: 'GPT-4o (Nov 2024)', description: 'Dernière version de GPT-4o', provider: 'openai' },
    'gpt-4-turbo': { name: 'GPT-4 Turbo', description: 'Version turbo de GPT-4', provider: 'openai' },
    'o1': { name: 'o1', description: 'Modèle de raisonnement avancé', provider: 'openai', isReasoning: true },
    'o1-mini': { name: 'o1-mini', description: 'Version compacte du modèle o1', provider: 'openai', isReasoning: true },
    'o1-preview': { name: 'o1-preview', description: 'Preview du modèle o1', provider: 'openai', isReasoning: true },
    'o3-mini': { name: 'o3-mini', description: 'Nouveau modèle de raisonnement compact', provider: 'openai', isReasoning: true },
    'claude-3-5-sonnet-20241022': { name: 'Claude 3.5 Sonnet', description: 'Modèle équilibré Anthropic', provider: 'anthropic' },
    'claude-3-haiku-20240307': { name: 'Claude 3 Haiku', description: 'Modèle rapide Anthropic', provider: 'anthropic' },
  };
  return modelInfo[model];
}

export async function getAllModels(): Promise<AIModel[]> {
  return ['gpt-4o', 'gpt-4o-mini', 'gpt-4o-2024-11-20', 'gpt-4-turbo', 'o1', 'o1-mini', 'o1-preview', 'o3-mini', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];
}
