# AI Terminal

一个基于 Electron 和 TypeScript 的智能终端应用，通过集成大模型 API 实现自然语言与 shell 命令的交互。

## 功能特性

- **命令建议** 💡：使用自然语言描述需求，AI 自动生成相应的 shell 命令
- **命令解释** 📖：解释复杂命令的含义和参数
- **错误诊断** 🔧：自动分析命令执行错误并提供解决方案
- **历史记录搜索** 🔍：通过自然语言搜索历史命令
- **风险警告** ⚠️：自动识别危险命令并警告用户
- **多模型支持** 🤖：支持 OpenAI、DeepSeek 等多种 AI 模型

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **React 18** + **TypeScript** - UI 开发
- **Vite** - 快速构建工具
- **xterm.js** - 终端仿真
- **node-pty** - 伪终端管理
- **Zustand** - 状态管理
- **TailwindCSS** - 样式框架
- **OpenAI SDK** - AI 模型集成

## 项目结构

```
ai-terminal/
├── electron/                 # Electron 主进程
│   ├── main.ts              # 主进程入口
│   ├── preload.ts           # 预加载脚本
│   ├── terminal-manager.ts  # 终端会话管理
│   └── config-manager.ts    # 配置管理
├── src/                     # React 渲染进程
│   ├── components/          # UI 组件
│   │   ├── Terminal/        # 终端组件
│   │   ├── Chat/           # AI 对话组件
│   │   ├── Settings/       # 设置组件
│   │   └── History/        # 历史记录组件
│   ├── services/            # 服务层
│   │   └── ai-service.ts   # AI 服务
│   ├── stores/             # Zustand 状态管理
│   ├── hooks/              # React Hooks
│   └── types/              # TypeScript 类型
├── shared/                  # 共享代码
│   ├── types.ts            # 共享类型定义
│   └── constants.ts        # 常量定义
└── public/                  # 静态资源
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

> 本项目使用 pnpm 作为包管理工具。如果你还没有安装 pnpm，可以通过 `npm install -g pnpm` 安装。

### 启动应用

```bash
pnpm dev
```

首次启动时，应用会自动显示**配置向导**，引导你完成以下设置：

1. **选择 AI 提供商**：OpenAI、DeepSeek 或其他兼容服务
2. **输入 API Key**：从对应平台获取的 API 密钥
3. **配置 API 地址和模型**：自动填充默认值，可根据需要修改

完成配置后即可开始使用！稍后也可以在设置中修改这些配置。

> **注意**：当前版本可能需要调试 Electron 启动配置。如遇到问题，请检查 vite.config.ts 中的 vite-plugin-electron 配置。
>
> **可选**：如果你希望通过环境变量配置（跳过向导），可以创建 `.env` 文件并设置 `VITE_API_KEY` 等变量。

### 构建应用

```bash
pnpm build
```

### 打包应用

```bash
pnpm electron:package
```

打包后的应用将输出到 `release/` 目录。

## 使用指南

### 1. 首次配置（自动向导）

首次启动应用时会自动显示配置向导：

**步骤 1：选择 AI 提供商**
- 🤖 OpenAI：GPT-4、GPT-3.5 等模型
- 🧠 DeepSeek：DeepSeek Chat 系列模型
- ⚙️ 其他：任何 OpenAI 兼容的 API 服务

**步骤 2：填写配置信息**
- **API Key**（必填）：从对应平台获取
- **API Base URL**：自动填充，可修改
- **模型名称**：自动填充推荐模型

配置完成后会自动保存到本地，并加密存储 API Key。

如需修改配置，点击右上角 "Settings" 按钮即可。

### 2. 生成命令

在右侧 AI 对话面板中输入自然语言请求，例如：

- "列出当前目录下所有大于 100MB 的文件"
- "删除所有 .log 文件"
- "查找包含 'error' 的文件"

AI 会生成对应的 shell 命令，并标注风险等级。你可以：
- ✏️ **编辑**命令
- ▶️ **执行**命令
- 📋 **复制**命令

### 3. 解释命令

输入 "Explain: `your-command`" 来获取命令的详细解释。

### 4. 错误诊断

当命令执行失败时（如果启用了自动错误诊断），AI 会自动分析错误原因并提供解决方案。

## 配置说明

应用配置存储在 `~/.ai-terminal/config.json`，包括：

- AI 模型配置（API Key 加密存储）
- 终端设置（字体、主题等）
- 功能开关

命令历史记录存储在 `~/.ai-terminal/history.json`。

## 安全特性

- **命令风险评估**：自动识别危险命令（rm -rf、dd 等）
- **执行确认**：危险命令需要用户确认
- **API Key 加密**：使用 Electron safeStorage 加密存储 API 密钥
- **沙箱隔离**：渲染进程运行在沙箱环境中

## 开发说明

### 调试

- 主进程日志：查看终端输出
- 渲染进程：开发模式下自动打开 DevTools

### 已知问题

1. **Electron 启动问题**：当前 vite-plugin-electron 配置可能需要进一步调试
2. **模块导入**：确保 package.json 中 type 字段配置正确

### 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 致谢

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [xterm.js](https://xtermjs.org/)
- [OpenAI](https://openai.com/)