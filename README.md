# Create Squirrel Opencode Harness

<p align="center">
  <b>English</b> | <a href="#中文文档">中文</a>
</p>

> 🐿️ Scaffold [Squirrel Opencode](https://github.com/squirrel-ai/opencode) harness into your project with configurable AI models.

## Features

- 🚀 Quick setup of multi-agent harness system
- 🎛️ Configurable AI model identifiers
- 🔒 Transactional file copying (all-or-nothing)
- 🌐 Multi-language support (English/Chinese)
- 📁 Automatic `.opencode/` directory structure

## Prerequisites

Before installing, ensure you have:

- **Opencode CLI installed** - Install globally: `npm i -g opencode-ai`
- **AI Provider configured** - Set up your API keys in Opencode (OpenAI, Anthropic, Fireworks, etc.)

## Quick Start

No installation needed! Use `npm create` or `npx`:

```bash
# Using npm create (recommended)
npm create squirrel-opencode-harness "fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo"

# Using npx
npx create-squirrel-opencode-harness "fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo"

# Using pnpm
pnpm create squirrel-opencode-harness "fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo"
```

## Installation (Optional)

For frequent use, install globally:

```bash
# Using npm
npm install -g create-squirrel-opencode-harness

# Using pnpm
pnpm add -g create-squirrel-opencode-harness

# Using yarn
yarn global add create-squirrel-opencode-harness
```

Then use without `npx`:

```bash
create-squirrel-opencode-harness "your-model-id"
```

## Usage

### Basic Usage

```bash
# Using positional argument (default language: English)
create-squirrel-opencode-harness "openai/gpt-4"

# Using --model option
create-squirrel-opencode-harness --model "your-model-id"

# Using stdin
echo "your-model-id" | create-squirrel-opencode-harness --stdin

# Interactive mode
create-squirrel-opencode-harness --interactive
```

### With npm create

```bash
# Basic usage with npm create
npm create squirrel-opencode-harness "your-model-id"

# With language option
npm create squirrel-opencode-harness "your-model-id" --lang zh

# Interactive mode
npm create squirrel-opencode-harness --interactive --lang zh

# Using stdin (pipe model id)
echo "your-model-id" | npm create squirrel-opencode-harness --stdin
```

### Language Selection

```bash
# English (default)
create-squirrel-opencode-harness "model-id" --lang en

# Chinese (中文)
create-squirrel-opencode-harness "model-id" --lang zh
```

### Complete Options

```
Usage: create-squirrel-opencode-harness [options] [model]

Options:
  -V, --version        output the version number
  -m, --model <model>  Model identifier for agents
  -i, --interactive    Use interactive mode to input model
  --stdin              Read model from stdin
  -l, --lang <lang>    Language (en/zh) (default: "en")
  -h, --help           display help for command
```

## What It Does

1. **Directory Check**: Creates `.opencode/` directory structure
   - `.opencode/agents/` - Agent definitions
   - `.opencode/harness/` - Sprint templates

2. **Model Configuration**: Replaces `<%= model %>` placeholder in agent files with your model identifier

3. **Transactional Copy**: Checks all files before copying - if any file exists, aborts with error

## Generated Structure

```
.opencode/
├── agents/
│   ├── evaluator.md      # Evaluator agent with your model
│   ├── generator.md      # Generator agent with your model
│   ├── harness.md        # Orchestrator agent with your model
│   └── planner.md        # Planner agent with your model
└── harness/
    └── templates/
        ├── contract-template.md
        ├── evaluation-template.md
        ├── final-summary-template.md
        ├── handoff-template.md
        ├── self-eval-template.md
        ├── spec-template.md
        └── sprint-status-template.md
```

## Next Steps (After Installation)

Once the harness is scaffolded, follow these steps to start working:

### 1. Start Opencode

```bash
# In the same directory where you ran the scaffold
opencode
```

### 2. Switch to Harness Agent

- Press **Tab** to cycle through available agents
- Select **`harness`** agent - this is your main interface for AI collaboration
- ⚠️ **Important**: Always use the `harness` agent for communication. Do NOT use `planner`, `generator`, or `evaluator` directly - the harness will orchestrate these automatically.

### 3. Begin Your First Sprint

```
You: I want to build a todo list app

Harness: [Will create a sprint contract and guide you through the process]
```

## Examples

### Example 1: Quick Start

```bash
# Using npm create (no install needed)
npm create squirrel-opencode-harness "openai/gpt-4"

# Or with npx
npx create-squirrel-opencode-harness "openai/gpt-4"
```

### Example 2: Interactive Mode in Chinese

```bash
npm create squirrel-opencode-harness --interactive --lang zh

# Or with npx
npx create-squirrel-opencode-harness --interactive --lang zh
```

### Example 3: Using with Environment Variable

```bash
export MODEL_ID="anthropic/claude-3-sonnet"
echo $MODEL_ID | npm create squirrel-opencode-harness --stdin
```

## Error Handling

- **Transaction Protection**: If any target file exists, the entire operation is aborted
- **Missing Model**: Returns error if model identifier is not provided
- **Missing Source**: Returns error if source directories (agents/, harness/) are missing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

<h1 id="中文文档">创建松鼠 Opencode Harness</h1>

<p align="center">
  <a href="#create-squirrel-opencode-harness">English</a> | <b>中文</b>
</p>

> 🐿️ 将 [Squirrel Opencode](https://github.com/squirrel-ai/opencode) Harness 脚手架快速搭建到您的项目中，支持可配置的 AI 模型。

## 功能特性

- 🚀 快速设置多代理 Harness 系统
- 🎛️ 可配置的 AI 模型标识符
- 🔒 事务性文件复制（全有或全无）
- 🌐 多语言支持（英文/中文）
- 📁 自动创建 `.opencode/` 目录结构

## 前置要求

安装前，请确保您已具备：

- **Opencode CLI 已安装** - 全局安装：`npm i -g opencode-ai`
- **AI Provider 已配置** - 在 Opencode 中设置您的 API 密钥（OpenAI、Anthropic、Fireworks 等）

## 快速开始

无需安装！直接使用 `npm create` 或 `npx`：

```bash
# 使用 npm create（推荐）
npm create squirrel-opencode-harness "fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo"

# 使用 npx
npx create-squirrel-opencode-harness "fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo"

# 使用 pnpm
pnpm create squirrel-opencode-harness "fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo"
```

## 安装（可选）

如需频繁使用，可以全局安装：

```bash
# 使用 npm
npm install -g create-squirrel-opencode-harness

# 使用 pnpm
pnpm add -g create-squirrel-opencode-harness

# 使用 yarn
yarn global add create-squirrel-opencode-harness
```

安装后可直接使用，无需 `npx`：

```bash
create-squirrel-opencode-harness "your-model-id"
```

## 使用方法

### 基础用法

```bash
# 使用位置参数（默认语言：英文）
create-squirrel-opencode-harness "openai/gpt-4"

# 使用 --model 选项
create-squirrel-opencode-harness --model "你的模型id"

# 使用标准输入
echo "你的模型id" | create-squirrel-opencode-harness --stdin

# 交互模式
create-squirrel-opencode-harness --interactive
```

### 使用 npm create

```bash
# 基础用法
npm create squirrel-opencode-harness "your-model-id"

# 指定语言
npm create squirrel-opencode-harness "your-model-id" --lang zh

# 交互模式
npm create squirrel-opencode-harness --interactive --lang zh

# 使用标准输入（管道输入模型id）
echo "your-model-id" | npm create squirrel-opencode-harness --stdin
```

### 语言选择

```bash
# 英文（默认）
create-squirrel-opencode-harness "模型id" --lang en

# 中文
create-squirrel-opencode-harness "模型id" --lang zh
```

### 完整选项

```
使用方法: create-squirrel-opencode-harness [选项] [模型]

选项:
  -V, --version        输出版本号
  -m, --model <模型>   代理模型标识符
  -i, --interactive    使用交互式模式输入模型
  --stdin              从标准输入读取模型
  -l, --lang <语言>    语言 (en/zh) (默认: "en")
  -h, --help           显示帮助信息
```

## 功能说明

1. **目录检查**：创建 `.opencode/` 目录结构
   - `.opencode/agents/` - 代理定义文件
   - `.opencode/harness/` - Sprint 模板文件

2. **模型配置**：将代理文件中的 `<%= model %>` 占位符替换为您的模型标识符

3. **事务复制**：复制前检查所有文件 - 如果任何文件已存在，则中止并报错

## 生成结构

```
.opencode/
├── agents/
│   ├── evaluator.md      # 评估器代理（使用您的模型）
│   ├── generator.md      # 生成器代理（使用您的模型）
│   ├── harness.md        # 协调器代理（使用您的模型）
│   └── planner.md        # 规划器代理（使用您的模型）
└── harness/
    └── templates/
        ├── contract-template.md
        ├── evaluation-template.md
        ├── final-summary-template.md
        ├── handoff-template.md
        ├── self-eval-template.md
        ├── spec-template.md
        └── sprint-status-template.md
```

## 后续步骤（安装后）

脚手架搭建完成后，按以下步骤开始工作：

### 1. 启动 Opencode

```bash
# 在运行脚手架的同一目录
opencode
```

### 2. 切换到 Harness Agent

- 按 **Tab** 键循环切换可用 agent
- 选择 **`harness`** agent - 这是您与 AI 协作的主要界面
- ⚠️ **重要**：请始终使用 `harness` agent 进行交流。**不要**直接使用 `planner`、`generator` 或 `evaluator` - harness 会自动协调这些 agent。

### 3. 开始您的第一个 Sprint

```
您：我想构建一个待办事项应用

Harness: [将创建 sprint 合同并引导您完成整个过程]
```

## 使用示例

### 示例 1：快速开始

```bash
# 使用 npm create（无需安装）
npm create squirrel-opencode-harness "openai/gpt-4"

# 或使用 npx
npx create-squirrel-opencode-harness "openai/gpt-4"
```

### 示例 2：中文交互模式

```bash
npm create squirrel-opencode-harness --interactive --lang zh

# 或使用 npx
npx create-squirrel-opencode-harness --interactive --lang zh
```

### 示例 3：使用环境变量

```bash
export MODEL_ID="anthropic/claude-3-sonnet"
echo $MODEL_ID | npm create squirrel-opencode-harness --stdin
```

## 错误处理

- **事务保护**：如果任何目标文件已存在，整个操作将被中止
- **缺失模型**：如果未提供模型标识符，将返回错误
- **缺失源文件**：如果源目录（agents/、harness/）不存在，将返回错误

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加了某个 amazing 功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。
