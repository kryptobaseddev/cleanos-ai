import type { AIProviderDefinition } from "@/types";

export const providers: AIProviderDefinition[] = [
  {
    id: "openai",
    name: "OpenAI",
    description:
      "GPT-4o and GPT-4o-mini models for file analysis and intelligent categorization.",
    auth_methods: [
      {
        type: "api",
        label: "API Key",
        description: "Your OpenAI API key",
        key_placeholder: "sk-...",
        help_url: "https://platform.openai.com/api-keys",
      },
    ],
    default_model: "gpt-4o-mini",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description:
          "Most capable model with vision support and advanced reasoning.",
        max_tokens: 128000,
        cost_per_1k_input: 0.005,
        cost_per_1k_output: 0.015,
        capabilities: ["chat", "vision", "json", "tools"],
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description:
          "Fast and cost-effective for routine file analysis tasks.",
        max_tokens: 128000,
        cost_per_1k_input: 0.00015,
        cost_per_1k_output: 0.0006,
        capabilities: ["chat", "vision", "json", "tools"],
      },
    ],
    capabilities: {
      chat: true,
      vision: true,
      json: true,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description:
      "Gemini models with large context windows for bulk file analysis.",
    auth_methods: [
      {
        type: "api",
        label: "API Key",
        description: "Your Google AI Studio API key",
        key_placeholder: "AIza...",
        help_url: "https://aistudio.google.com/apikey",
      },
    ],
    default_model: "gemini-2.0-flash",
    models: [
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        description: "Fast and capable with a 1M token context window.",
        max_tokens: 1048576,
        cost_per_1k_input: 0.0001,
        cost_per_1k_output: 0.0004,
        capabilities: ["chat", "vision", "json", "tools"],
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description:
          "Advanced reasoning with extended context for large file sets.",
        max_tokens: 2097152,
        cost_per_1k_input: 0.00125,
        cost_per_1k_output: 0.005,
        capabilities: ["chat", "vision", "json", "tools"],
      },
    ],
    capabilities: {
      chat: true,
      vision: true,
      json: true,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    description:
      "Claude models with strong analytical capabilities for file organization.",
    auth_methods: [
      {
        type: "api",
        label: "API Key",
        description: "Your Anthropic API key",
        key_placeholder: "sk-ant-...",
        help_url: "https://console.anthropic.com/settings/keys",
      },
    ],
    default_model: "claude-sonnet-4-20250514",
    models: [
      {
        id: "claude-opus-4-20250514",
        name: "Claude Opus 4",
        description:
          "Most capable model for complex file analysis and reasoning.",
        max_tokens: 200000,
        cost_per_1k_input: 0.015,
        cost_per_1k_output: 0.075,
        capabilities: ["chat", "vision", "json", "tools"],
      },
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        description: "Balanced performance for everyday file analysis.",
        max_tokens: 200000,
        cost_per_1k_input: 0.003,
        cost_per_1k_output: 0.015,
        capabilities: ["chat", "vision", "json", "tools"],
      },
    ],
    capabilities: {
      chat: true,
      vision: true,
      json: true,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "kimi",
    name: "Moonshot Kimi",
    description:
      "Kimi models for multilingual file analysis with long context support.",
    auth_methods: [
      {
        type: "api",
        label: "API Key",
        description: "Your Moonshot API key",
        key_placeholder: "sk-...",
        help_url: "https://platform.moonshot.cn/console/api-keys",
      },
    ],
    default_model: "moonshot-v1-8k",
    models: [
      {
        id: "moonshot-v1-128k",
        name: "Kimi 128K",
        description: "Long context model for analyzing large file sets.",
        max_tokens: 128000,
        capabilities: ["chat", "json"],
      },
      {
        id: "moonshot-v1-8k",
        name: "Kimi 8K",
        description: "Fast model for quick file categorization.",
        max_tokens: 8000,
        capabilities: ["chat", "json"],
      },
    ],
    capabilities: {
      chat: true,
      vision: false,
      json: true,
      streaming: true,
      tools: false,
    },
  },
];
