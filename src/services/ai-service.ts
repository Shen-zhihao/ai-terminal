import OpenAI from "openai";
import type {
  Message,
  CommandSuggestion,
  Diagnosis,
  CommandHistory,
  AIProvider,
} from "@shared/types";
import {
  AI_PROMPTS,
  DANGEROUS_PATTERNS,
  WARNING_PATTERNS,
} from "@shared/constants";

export class AIService {
  private client: OpenAI | null = null;

  constructor(private config: AIProvider) {
    this.initClient();
  }

  // 更新配置
  updateConfig(config: AIProvider) {
    this.config = config;
    this.initClient();
  }

  private initClient() {
    if (this.isOpenAICompatible()) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.apiBaseUrl,
        dangerouslyAllowBrowser: true, // 允许在浏览器中使用
      });
    } else {
      this.client = null;
    }
  }

  private isOpenAICompatible(): boolean {
    const type = this.config.type;
    return [
      "openai",
      "deepseek",
      "moonshot",
      "qwen",
      "zhipu",
      "groq",
      "ollama",
      "custom",
    ].includes(type);
  }

  // 通用聊天
  async chat(messages: Message[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error("AI 功能未配置 API Key，请在设置中配置");
    }

    try {
      if (this.isOpenAICompatible() && this.client) {
        return await this.chatOpenAI(messages);
      } else if (this.config.type === "anthropic") {
        return await this.chatAnthropic(messages);
      } else if (this.config.type === "gemini") {
        return await this.chatGemini(messages);
      }
      throw new Error(`Unsupported provider type: ${this.config.type}`);
    } catch (error: any) {
      console.error("AI request failed:", error);
      throw new Error(`AI request failed: ${error.message || error}`);
    }
  }

  private async chatOpenAI(messages: Message[]): Promise<string> {
    const response = await this.client!.chat.completions.create({
      model: this.config.modelName,
      messages,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000,
    });

    return response.choices[0]?.message?.content || "";
  }

  private async chatAnthropic(messages: Message[]): Promise<string> {
    // 提取 system prompt
    const systemMessage = messages.find((m) => m.role === "system")?.content;
    const userMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const response = await fetch(`${this.config.apiBaseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.modelName,
        max_tokens: this.config.maxTokens || 2000,
        messages: userMessages,
        system: systemMessage,
        temperature: this.config.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic API Error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }

  private async chatGemini(messages: Message[]): Promise<string> {
    // 构造 Gemini 内容
    const contents: any[] = [];
    let systemPrompt = "";

    for (const msg of messages) {
      if (msg.role === "system") {
        systemPrompt += msg.content + "\n\n";
      } else {
        const role = msg.role === "assistant" ? "model" : "user";
        // 如果有 system prompt 且是第一条 user 消息，合并
        let content = msg.content;
        if (systemPrompt && role === "user" && contents.length === 0) {
          content = systemPrompt + content;
          systemPrompt = "";
        }
        contents.push({
          role,
          parts: [{ text: content }],
        });
      }
    }

    // 如果只有 system prompt
    if (contents.length === 0 && systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: systemPrompt }],
      });
    }

    // Gemini URL 通常是 https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    // 我们假设 apiBaseUrl 只需要是 https://generativelanguage.googleapis.com/v1beta/models
    // 或者用户提供完整的 base url 如 https://generativelanguage.googleapis.com/v1beta

    // 为了兼容性，我们假设用户提供的 apiBaseUrl 是 https://generativelanguage.googleapis.com/v1beta
    const baseUrl = this.config.apiBaseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/models/${this.config.modelName}:generateContent?key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 2000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  // 生成命令
  async generateCommand(naturalLanguage: string): Promise<CommandSuggestion> {
    const messages: Message[] = [
      {
        role: "system",
        content: AI_PROMPTS.SYSTEM_COMMAND_GENERATION,
      },
      {
        role: "user",
        content: `为以下请求生成 shell 命令: ${naturalLanguage}\n\n以 JSON 格式提供输出:\n{\n  "command": "shell 命令",\n  "explanation": "简要解释",\n  "tags": ["标签1", "标签2"]\n}`,
      },
    ];

    const response = await this.chat(messages);

    try {
      // 去掉 markdown 代码块包裹（如 ```json ... ```）
      const cleaned = response
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      const command = parsed.command || response.trim();
      const explanation = parsed.explanation || "未提供解释";
      const tags = parsed.tags || [];

      // 评估风险等级
      const riskLevel = this.evaluateRisk(command);

      return {
        command,
        explanation,
        riskLevel,
        tags,
      };
    } catch (_error) {
      // 如果不是 JSON，将整个响应作为命令
      const command = response.trim();
      return {
        command,
        explanation: "根据自然语言生成的命令",
        riskLevel: this.evaluateRisk(command),
      };
    }
  }

  // 解释命令
  async explainCommand(command: string): Promise<string> {
    const messages: Message[] = [
      {
        role: "system",
        content: AI_PROMPTS.SYSTEM_COMMAND_EXPLANATION,
      },
      {
        role: "user",
        content: `解释这个命令: ${command}`,
      },
    ];

    return await this.chat(messages);
  }

  // 诊断错误
  async diagnoseError(command: string, error: string): Promise<Diagnosis> {
    const messages: Message[] = [
      {
        role: "system",
        content: AI_PROMPTS.SYSTEM_ERROR_DIAGNOSIS,
      },
      {
        role: "user",
        content: `命令: ${command}\n\n错误:\n${error}\n\n以 JSON 格式提供分析和解决方案:\n{\n  "analysis": "根本原因分析",\n  "solutions": [\n    {\n      "description": "解决方案描述",\n      "command": "修正后的命令 (可选)",\n      "steps": ["步骤 1", "步骤 2"] (可选)\n    }\n  ]\n}`,
      },
    ];

    const response = await this.chat(messages);

    try {
      const parsed = JSON.parse(response);
      return {
        error,
        analysis: parsed.analysis || "无法提供分析",
        solutions: parsed.solutions || [],
      };
    } catch (_parseError) {
      // 如果不是 JSON，返回纯文本分析
      return {
        error,
        analysis: response,
        solutions: [],
      };
    }
  }

  // 搜索历史记录
  async searchHistory(
    query: string,
    history: CommandHistory[],
  ): Promise<CommandHistory[]> {
    if (history.length === 0) return [];

    // 简单关键词匹配
    const keywords = query.toLowerCase().split(" ");
    const matched = history.filter((entry) => {
      const text = entry.command.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword));
    });

    // 如果关键词匹配结果少于 5 个，使用 AI 语义搜索
    if (matched.length < 5 && history.length > 10) {
      const messages: Message[] = [
        {
          role: "system",
          content:
            "你是一个命令历史搜索助手。基于语义含义查找与用户查询匹配的命令。",
        },
        {
          role: "user",
          content: `查询: "${query}"\n\n历史记录 (最近 50 条命令):\n${history
            .slice(-50)
            .map((h, i) => `${i + 1}. ${h.command}`)
            .join("\n")}\n\n以 JSON 数组形式返回匹配命令的索引: [1, 3, 5, ...]`,
        },
      ];

      try {
        const response = await this.chat(messages);
        const indices = JSON.parse(response);
        const recentHistory = history.slice(-50);

        return indices
          .map((idx: number) => recentHistory[idx - 1])
          .filter(Boolean);
      } catch (_error) {
        // 回退到关键词匹配
        return matched;
      }
    }

    return matched;
  }

  // 评估命令风险等级
  private evaluateRisk(command: string): "safe" | "warning" | "dangerous" {
    // 检查危险模式
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return "dangerous";
      }
    }

    // 检查警告模式
    for (const pattern of WARNING_PATTERNS) {
      if (pattern.test(command)) {
        return "warning";
      }
    }

    return "safe";
  }
}

// 全局 AI 服务实例（将在组件中初始化）
let aiServiceInstance: AIService | null = null;

export function getAIService(config?: AIProvider): AIService {
  if (!aiServiceInstance && config) {
    aiServiceInstance = new AIService(config);
  } else if (aiServiceInstance && config) {
    aiServiceInstance.updateConfig(config);
  }

  if (!aiServiceInstance) {
    throw new Error("AI service not initialized");
  }

  return aiServiceInstance;
}
