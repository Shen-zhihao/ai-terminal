import OpenAI from 'openai'
import type {
  Message,
  CommandSuggestion,
  Diagnosis,
  CommandHistory,
  AIProvider,
} from '@shared/types'
import { AI_PROMPTS, DANGEROUS_PATTERNS, WARNING_PATTERNS } from '@shared/constants'

export class AIService {
  private client: OpenAI

  constructor(private config: AIProvider) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiBaseUrl,
      dangerouslyAllowBrowser: true, // 允许在浏览器中使用
    })
  }

  // 更新配置
  updateConfig(config: AIProvider) {
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiBaseUrl,
      dangerouslyAllowBrowser: true,
    })
  }

  // 通用聊天
  async chat(messages: Message[]): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.modelName,
        messages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 2000,
      })

      return response.choices[0]?.message?.content || ''
    } catch (error: any) {
      throw new Error(`AI request failed: ${error.message}`)
    }
  }

  // 生成命令
  async generateCommand(naturalLanguage: string): Promise<CommandSuggestion> {
    const messages: Message[] = [
      {
        role: 'system',
        content: AI_PROMPTS.SYSTEM_COMMAND_GENERATION,
      },
      {
        role: 'user',
        content: `Generate a shell command for: ${naturalLanguage}\n\nProvide the output in JSON format:\n{\n  "command": "the shell command",\n  "explanation": "brief explanation",\n  "tags": ["tag1", "tag2"]\n}`,
      },
    ]

    const response = await this.chat(messages)

    try {
      const parsed = JSON.parse(response)
      const command = parsed.command || response.trim()
      const explanation = parsed.explanation || 'No explanation provided'
      const tags = parsed.tags || []

      // 评估风险等级
      const riskLevel = this.evaluateRisk(command)

      return {
        command,
        explanation,
        riskLevel,
        tags,
      }
    } catch (_error) {
      // 如果不是 JSON，将整个响应作为命令
      const command = response.trim()
      return {
        command,
        explanation: 'Command generated from natural language',
        riskLevel: this.evaluateRisk(command),
      }
    }
  }

  // 解释命令
  async explainCommand(command: string): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: AI_PROMPTS.SYSTEM_COMMAND_EXPLANATION,
      },
      {
        role: 'user',
        content: `Explain this command: ${command}`,
      },
    ]

    return await this.chat(messages)
  }

  // 诊断错误
  async diagnoseError(command: string, error: string): Promise<Diagnosis> {
    const messages: Message[] = [
      {
        role: 'system',
        content: AI_PROMPTS.SYSTEM_ERROR_DIAGNOSIS,
      },
      {
        role: 'user',
        content: `Command: ${command}\n\nError:\n${error}\n\nProvide analysis and solutions in JSON format:\n{\n  "analysis": "root cause analysis",\n  "solutions": [\n    {\n      "description": "solution description",\n      "command": "corrected command (optional)",\n      "steps": ["step 1", "step 2"] (optional)\n    }\n  ]\n}`,
      },
    ]

    const response = await this.chat(messages)

    try {
      const parsed = JSON.parse(response)
      return {
        error,
        analysis: parsed.analysis || 'Analysis not available',
        solutions: parsed.solutions || [],
      }
    } catch (_parseError) {
      // 如果不是 JSON，返回纯文本分析
      return {
        error,
        analysis: response,
        solutions: [],
      }
    }
  }

  // 搜索历史记录
  async searchHistory(query: string, history: CommandHistory[]): Promise<CommandHistory[]> {
    if (history.length === 0) return []

    // 简单关键词匹配
    const keywords = query.toLowerCase().split(' ')
    const matched = history.filter((entry) => {
      const text = entry.command.toLowerCase()
      return keywords.some((keyword) => text.includes(keyword))
    })

    // 如果关键词匹配结果少于 5 个，使用 AI 语义搜索
    if (matched.length < 5 && history.length > 10) {
      const messages: Message[] = [
        {
          role: 'system',
          content: 'You are a command history search assistant. Find commands that match the user\'s query based on semantic meaning.',
        },
        {
          role: 'user',
          content: `Query: "${query}"\n\nHistory (last 50 commands):\n${history.slice(-50).map((h, i) => `${i + 1}. ${h.command}`).join('\n')}\n\nReturn the indices of matching commands as JSON array: [1, 3, 5, ...]`,
        },
      ]

      try {
        const response = await this.chat(messages)
        const indices = JSON.parse(response)
        const recentHistory = history.slice(-50)

        return indices
          .map((idx: number) => recentHistory[idx - 1])
          .filter(Boolean)
      } catch (_error) {
        // 回退到关键词匹配
        return matched
      }
    }

    return matched
  }

  // 评估命令风险等级
  private evaluateRisk(command: string): 'safe' | 'warning' | 'dangerous' {
    // 检查危险模式
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return 'dangerous'
      }
    }

    // 检查警告模式
    for (const pattern of WARNING_PATTERNS) {
      if (pattern.test(command)) {
        return 'warning'
      }
    }

    return 'safe'
  }
}

// 全局 AI 服务实例（将在组件中初始化）
let aiServiceInstance: AIService | null = null

export function getAIService(config?: AIProvider): AIService {
  if (!aiServiceInstance && config) {
    aiServiceInstance = new AIService(config)
  } else if (aiServiceInstance && config) {
    aiServiceInstance.updateConfig(config)
  }

  if (!aiServiceInstance) {
    throw new Error('AI service not initialized')
  }

  return aiServiceInstance
}
