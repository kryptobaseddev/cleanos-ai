# CleanOS AI - Technical Specification

## AI Provider Integration (Based on OpenCode Architecture)

### Authentication Architecture

Inspired by OpenCode's elegant provider system, CleanOS AI implements a flexible authentication layer:

```typescript
// Authentication Types
interface AuthConfig {
  type: 'oauth' | 'api' | 'token';
  provider: string;
}

interface APIAuth extends AuthConfig {
  type: 'api';
  key: string;           // Stored securely in OS keyring
}

interface OAuthAuth extends AuthConfig {
  type: 'oauth';
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountId?: string;
}

interface TokenAuth extends AuthConfig {
  type: 'token';
  token: string;         // For services like Claude's session token
}
```

### Provider Registry

```typescript
// Provider Definition
interface AIProviderDefinition {
  id: string;                    // 'openai', 'gemini', 'claude', 'kimi'
  name: string;                  // Display name
  description: string;
  logo?: string;                 // Icon path
  authMethods: AuthMethod[];
  defaultModel: string;
  models: ModelDefinition[];
  capabilities: ProviderCapabilities;
}

interface AuthMethod {
  type: 'oauth' | 'api' | 'token';
  label: string;
  description?: string;
  // OAuth specific
  authorizationUrl?: string;
  scopes?: string[];
  // API Key specific
  keyPlaceholder?: string;       // e.g., "sk-..." for OpenAI
  helpUrl?: string;              // Link to get API key
}

interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  costPer1KInput?: number;
  costPer1KOutput?: number;
  capabilities: string[];        // 'vision', 'json', 'tools', etc.
}

// Provider Capabilities
interface ProviderCapabilities {
  chat: boolean;
  vision: boolean;
  json: boolean;
  streaming: boolean;
  tools: boolean;
}
```

### Provider Implementations

#### 1. OpenAI
```typescript
const openAIProvider: AIProviderDefinition = {
  id: 'openai',
  name: 'OpenAI',
  description: 'GPT-4 and GPT-3.5 models',
  authMethods: [{
    type: 'api',
    label: 'API Key',
    keyPlaceholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys'
  }],
  defaultModel: 'gpt-4o',
  models: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Most capable multimodal model',
      maxTokens: 128000,
      costPer1KInput: 0.005,
      costPer1KOutput: 0.015,
      capabilities: ['chat', 'vision', 'json', 'streaming']
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Fast and affordable',
      maxTokens: 128000,
      costPer1KInput: 0.00015,
      costPer1KOutput: 0.0006,
      capabilities: ['chat', 'vision', 'json', 'streaming']
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Legacy fast model',
      maxTokens: 16385,
      costPer1KInput: 0.0005,
      costPer1KOutput: 0.0015,
      capabilities: ['chat', 'json', 'streaming']
    }
  ],
  capabilities: {
    chat: true,
    vision: true,
    json: true,
    streaming: true,
    tools: true
  }
};
```

#### 2. Google Gemini
```typescript
const geminiProvider: AIProviderDefinition = {
  id: 'gemini',
  name: 'Google Gemini',
  description: 'Google\'s multimodal AI models',
  authMethods: [{
    type: 'api',
    label: 'API Key',
    keyPlaceholder: 'AIza...',
    helpUrl: 'https://aistudio.google.com/app/apikey'
  }],
  defaultModel: 'gemini-2.0-flash',
  models: [
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Fast multimodal model',
      maxTokens: 1048576,
      costPer1KInput: 0.000075,
      costPer1KOutput: 0.0003,
      capabilities: ['chat', 'vision', 'json', 'streaming']
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'High performance model',
      maxTokens: 2097152,
      costPer1KInput: 0.0035,
      costPer1KOutput: 0.0105,
      capabilities: ['chat', 'vision', 'json', 'streaming']
    }
  ],
  capabilities: {
    chat: true,
    vision: true,
    json: true,
    streaming: true,
    tools: true
  }
};
```

#### 3. Anthropic Claude
```typescript
const claudeProvider: AIProviderDefinition = {
  id: 'claude',
  name: 'Anthropic Claude',
  description: 'Claude AI models by Anthropic',
  authMethods: [
    {
      type: 'api',
      label: 'API Key',
      keyPlaceholder: 'sk-ant-...',
      helpUrl: 'https://console.anthropic.com/settings/keys'
    },
    {
      type: 'token',
      label: 'Session Token',
      description: 'Use your Claude session token for Pro access'
    }
  ],
  defaultModel: 'claude-3-5-sonnet-20241022',
  models: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Balanced performance and intelligence',
      maxTokens: 200000,
      costPer1KInput: 0.003,
      costPer1KOutput: 0.015,
      capabilities: ['chat', 'vision', 'json', 'streaming']
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Most capable model',
      maxTokens: 200000,
      costPer1KInput: 0.015,
      costPer1KOutput: 0.075,
      capabilities: ['chat', 'vision', 'json', 'streaming']
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      description: 'Fast and affordable',
      maxTokens: 200000,
      costPer1KInput: 0.00025,
      costPer1KOutput: 0.00125,
      capabilities: ['chat', 'vision', 'json', 'streaming']
    }
  ],
  capabilities: {
    chat: true,
    vision: true,
    json: true,
    streaming: true,
    tools: true
  }
};
```

#### 4. Moonshot AI (Kimi)
```typescript
const kimiProvider: AIProviderDefinition = {
  id: 'kimi',
  name: 'Moonshot Kimi',
  description: 'Kimi AI models by Moonshot AI',
  authMethods: [{
    type: 'api',
    label: 'API Key',
    keyPlaceholder: 'sk-...',
    helpUrl: 'https://platform.moonshot.cn/console/api-keys'
  }],
  defaultModel: 'kimi-latest',
  models: [
    {
      id: 'kimi-latest',
      name: 'Kimi Latest',
      description: 'Latest Kimi model',
      maxTokens: 128000,
      costPer1KInput: 0.003,
      costPer1KOutput: 0.009,
      capabilities: ['chat', 'vision', 'json', 'streaming']
    },
    {
      id: 'kimi-k1.5',
      name: 'Kimi K1.5',
      description: 'Advanced reasoning model',
      maxTokens: 128000,
      costPer1KInput: 0.006,
      costPer1KOutput: 0.018,
      capabilities: ['chat', 'vision', 'json', 'streaming']
    }
  ],
  capabilities: {
    chat: true,
    vision: true,
    json: true,
    streaming: true,
    tools: false
  }
};
```

### Secure Credential Storage

Based on OpenCode's security model:

```rust
// Rust backend - Credential Manager
use secret_service::SecretService;
use keyring::Entry;

pub struct CredentialManager {
    service_name: String,
}

impl CredentialManager {
    pub fn new() -> Self {
        Self {
            service_name: "com.cleanos-ai".to_string(),
        }
    }
    
    pub fn store_api_key(&self, provider: &str, key: &str) -> Result<(), Error> {
        // Use Linux keyring (GNOME Keyring/KWallet/libsecret)
        let entry = Entry::new(&self.service_name, &format!("api_key_{}", provider))?;
        entry.set_password(key)?;
        Ok(())
    }
    
    pub fn get_api_key(&self, provider: &str) -> Result<String, Error> {
        let entry = Entry::new(&self.service_name, &format!("api_key_{}", provider))?;
        entry.get_password()
    }
    
    pub fn store_oauth_tokens(&self, provider: &str, tokens: &OAuthTokens) -> Result<(), Error> {
        let entry = Entry::new(&self.service_name, &format!("oauth_{}", provider))?;
        let serialized = serde_json::to_string(tokens)?;
        entry.set_password(&serialized)?;
        Ok(())
    }
    
    pub fn delete_credentials(&self, provider: &str) -> Result<(), Error> {
        let entry = Entry::new(&self.service_name, &format!("api_key_{}", provider))?;
        entry.delete_password()?;
        Ok(())
    }
}
```

### Provider Manager

```typescript
// Frontend Provider Manager
class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: string | null = null;
  
  constructor() {
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new ClaudeProvider());
    this.registerProvider(new KimiProvider());
  }
  
  registerProvider(provider: AIProvider) {
    this.providers.set(provider.id, provider);
  }
  
  async authenticate(providerId: string, method: string, credentials: unknown): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Unknown provider: ${providerId}`);
    
    return await provider.authenticate(method, credentials);
  }
  
  async analyzeFile(file: FileInfo): Promise<AIAnalysis> {
    const provider = this.getActiveProvider();
    return await provider.analyzeFile(file);
  }
  
  async categorizeFiles(files: FileInfo[]): Promise<CategoryResult[]> {
    const provider = this.getActiveProvider();
    return await provider.categorizeBatch(files);
  }
  
  async getCleanupRecommendations(stats: SystemStats): Promise<Recommendation[]> {
    const provider = this.getActiveProvider();
    return await provider.getRecommendations(stats);
  }
  
  getActiveProvider(): AIProvider {
    if (!this.activeProvider) {
      throw new Error('No AI provider configured');
    }
    const provider = this.providers.get(this.activeProvider);
    if (!provider) throw new Error('Active provider not found');
    return provider;
  }
  
  setActiveProvider(providerId: string) {
    this.activeProvider = providerId;
  }
  
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }
  
  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }
}
```

### Abstract Provider Class

```typescript
abstract class AIProvider {
  abstract readonly definition: AIProviderDefinition;
  protected credentials?: AuthConfig;
  
  abstract authenticate(method: string, credentials: unknown): Promise<boolean>;
  abstract testConnection(): Promise<boolean>;
  
  async analyzeFile(file: FileInfo): Promise<AIAnalysis> {
    const prompt = this.buildFileAnalysisPrompt(file);
    const response = await this.sendRequest(prompt);
    return this.parseAnalysisResponse(response);
  }
  
  async categorizeBatch(files: FileInfo[]): Promise<CategoryResult[]> {
    const prompt = this.buildCategorizationPrompt(files);
    const response = await this.sendRequest(prompt);
    return this.parseCategorizationResponse(response);
  }
  
  async getRecommendations(stats: SystemStats): Promise<Recommendation[]> {
    const prompt = this.buildRecommendationPrompt(stats);
    const response = await this.sendRequest(prompt);
    return this.parseRecommendationResponse(response);
  }
  
  protected abstract sendRequest(prompt: string): Promise<string>;
  protected abstract buildFileAnalysisPrompt(file: FileInfo): string;
  protected abstract buildCategorizationPrompt(files: FileInfo[]): string;
  protected abstract buildRecommendationPrompt(stats: SystemStats): string;
  protected abstract parseAnalysisResponse(response: string): AIAnalysis;
  protected abstract parseCategorizationResponse(response: string): CategoryResult[];
  protected abstract parseRecommendationResponse(response: string): Recommendation[];
}
```

## Rate Limiting & Caching

```typescript
interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

class RequestManager {
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  
  async makeRequest(provider: string, prompt: string): Promise<string> {
    // Check cache
    const cacheKey = this.generateCacheKey(provider, prompt);
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached.response;
    }
    
    // Check rate limits
    const rateLimit = this.rateLimits.get(provider);
    if (rateLimit && rateLimit.remaining <= 0) {
      const waitTime = rateLimit.resetTime - Date.now();
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }
    
    // Make request
    const response = await this.executeRequest(provider, prompt);
    
    // Update rate limits from headers
    this.updateRateLimits(provider, response.headers);
    
    // Cache response
    this.cache.set(cacheKey, {
      response: response.data,
      timestamp: Date.now(),
      ttl: 3600000 // 1 hour
    });
    
    return response.data;
  }
  
  private generateCacheKey(provider: string, prompt: string): string {
    return `${provider}:${this.hashString(prompt)}`;
  }
  
  private hashString(str: string): string {
    // Simple hash for caching
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}
```

## UI Components

### Provider Configuration Panel

```tsx
function ProviderConfigPanel() {
  const providers = useProviderStore(state => state.providers);
  const activeProvider = useProviderStore(state => state.activeProvider);
  const setActiveProvider = useProviderStore(state => state.setActiveProvider);
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">AI Providers</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            isActive={provider.id === activeProvider}
            onSelect={() => setActiveProvider(provider.id)}
          />
        ))}
      </div>
      
      {activeProvider && (
        <ProviderSettings providerId={activeProvider} />
      )}
    </div>
  );
}

function ProviderCard({ provider, isActive, onSelect }: ProviderCardProps) {
  const isConnected = useProviderStore(state => 
    state.connectedProviders.has(provider.id)
  );
  
  return (
    <div
      className={cn(
        "p-6 rounded-lg border-2 cursor-pointer transition-all",
        isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center space-x-4">
        {provider.logo && (
          <img src={provider.logo} alt={provider.name} className="w-12 h-12" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{provider.name}</h3>
          <p className="text-sm text-gray-600">{provider.description}</p>
        </div>
        {isConnected ? (
          <Badge variant="success">Connected</Badge>
        ) : (
          <Badge variant="secondary">Not Connected</Badge>
        )}
      </div>
      
      {isActive && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">
            Available Models: {provider.models.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {provider.models.slice(0, 3).map(model => (
              <Badge key={model.id} variant="outline">{model.name}</Badge>
            ))}
            {provider.models.length > 3 && (
              <Badge variant="outline">+{provider.models.length - 3} more</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderSettings({ providerId }: { providerId: string }) {
  const provider = useProviderStore(state => state.getProvider(providerId));
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  
  if (!provider) return null;
  
  return (
    <div className="mt-6 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{provider.name} Settings</h3>
      
      <div className="space-y-4">
        <div>
          <Label>Authentication Method</Label>
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select authentication method" />
            </SelectTrigger>
            <SelectContent>
              {provider.authMethods.map(method => (
                <SelectItem key={method.type} value={method.type}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedMethod === 'api' && (
          <APIKeyForm providerId={providerId} />
        )}
        
        {selectedMethod === 'oauth' && (
          <OAuthButton providerId={providerId} />
        )}
        
        {selectedMethod === 'token' && (
          <TokenForm providerId={providerId} />
        )}
        
        <div>
          <Label>Default Model</Label>
          <Select defaultValue={provider.defaultModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {provider.models.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
```

## Error Handling

```typescript
// Error Types
class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

class RateLimitError extends AIProviderError {
  constructor(provider: string, public resetTime: number) {
    super(
      `Rate limit exceeded for ${provider}`,
      provider,
      'RATE_LIMIT',
      true
    );
    this.name = 'RateLimitError';
  }
}

class AuthenticationError extends AIProviderError {
  constructor(provider: string) {
    super(
      `Authentication failed for ${provider}`,
      provider,
      'AUTH_FAILED',
      false
    );
    this.name = 'AuthenticationError';
  }
}

// Error Handler
async function handleAIRequest<T>(
  request: () => Promise<T>,
  provider: string
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof AIProviderError) {
      if (error.retryable) {
        // Implement exponential backoff
        await sleep(1000);
        return await request();
      }
      throw error;
    }
    
    // Wrap unknown errors
    throw new AIProviderError(
      'Unknown error occurred',
      provider,
      'UNKNOWN',
      false
    );
  }
}
```

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Status**: Technical Specification
