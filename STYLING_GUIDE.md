# 样式迁移指南

本文档说明如何将 TailwindCSS 类名转换为 LESS 样式。

## 已完成的改造

✅ **全局样式**
- [src/index.less](src/index.less) - 全局样式和变量定义

✅ **App 组件**
- [src/App.tsx](src/App.tsx) - 主应用组件
- [src/App.less](src/App.less) - 应用样式

✅ **SetupWizard 组件**
- [src/components/Setup/SetupWizard.less](src/components/Setup/SetupWizard.less) - 配置向导样式

## LESS 变量参考

在 `src/index.less` 中定义的全局变量：

```less
// 颜色
@bg-primary: #111827;    // gray-900
@bg-secondary: #1f2937;  // gray-800
@bg-tertiary: #374151;   // gray-700

@text-primary: #f9fafb;  // gray-50
@text-secondary: #d1d5db; // gray-300
@text-tertiary: #9ca3af;  // gray-400

@border-color: #374151;  // gray-700
@primary: #3b82f6;       // blue-500
@success: #10b981;       // green-500
@warning: #f59e0b;       // yellow-500
@danger: #ef4444;        // red-500
```

## TailwindCSS 到 LESS 转换对照表

### 布局类

| Tailwind | LESS |
|----------|------|
| `flex` | `display: flex;` |
| `flex-col` | `flex-direction: column;` |
| `items-center` | `align-items: center;` |
| `justify-between` | `justify-content: space-between;` |
| `gap-4` | `gap: 1rem;` |
| `h-full` | `height: 100%;` |
| `w-full` | `width: 100%;` |

### 间距类

| Tailwind | LESS |
|----------|------|
| `p-4` | `padding: 1rem;` |
| `px-4` | `padding: 0 1rem;` |
| `py-2` | `padding: 0.5rem 0;` |
| `m-4` | `margin: 1rem;` |
| `mt-2` | `margin-top: 0.5rem;` |
| `space-x-2` | `gap: 0.5rem;` (on flex) |

### 颜色类

| Tailwind | LESS |
|----------|------|
| `bg-gray-900` | `background: @bg-primary;` |
| `bg-gray-800` | `background: @bg-secondary;` |
| `text-white` | `color: @text-primary;` |
| `text-gray-400` | `color: @text-tertiary;` |
| `border-gray-700` | `border-color: @border-color;` |

### 文本类

| Tailwind | LESS |
|----------|------|
| `text-sm` | `font-size: 0.875rem;` |
| `text-lg` | `font-size: 1.125rem;` |
| `font-semibold` | `font-weight: 600;` |
| `text-center` | `text-align: center;` |

### 圆角和边框

| Tailwind | LESS |
|----------|------|
| `rounded-md` | `border-radius: 0.375rem;` |
| `rounded-lg` | `border-radius: 0.5rem;` |
| `border` | `border: 1px solid;` |
| `border-t` | `border-top: 1px solid;` |

## 组件改造步骤

### 1. 创建 LESS 文件

在组件同目录下创建 `.less` 文件：

```bash
src/components/Chat/ChatPanel.less
src/components/Settings/SettingsModal.less
# ...
```

### 2. 定义组件样式

```less
@import '../../index.less';

.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;

  &-header {
    height: 48px;
    background: @bg-tertiary;
    padding: 0 1rem;
  }

  &-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
}
```

### 3. 更新组件 TSX

```tsx
import './ChatPanel.less'

export default function ChatPanel() {
  return (
    <div className="chat-panel">
      <div className="chat-panel-header">...</div>
      <div className="chat-panel-content">...</div>
    </div>
  )
}
```

### 4. 移除 Tailwind 类名

**改造前：**
```tsx
<div className="flex flex-col h-full bg-gray-800">
  <div className="p-4 text-white">Hello</div>
</div>
```

**改造后：**
```tsx
<div className="chat-panel">
  <div className="chat-panel-content">Hello</div>
</div>
```

## 需要改造的组件列表

### 优先级 1（核心 UI）
- [ ] `src/components/Chat/ChatPanel.tsx`
- [ ] `src/components/Chat/ChatMessage.tsx`
- [ ] `src/components/Chat/CommandSuggestion.tsx`
- [ ] `src/components/Settings/SettingsModal.tsx`
- [ ] `src/components/Settings/ApiConfig.tsx`

### 优先级 2（次要 UI）
- [ ] `src/components/Terminal/TerminalView.tsx`
- [ ] `src/components/History/HistoryPanel.tsx`

### 注意事项

1. **保持语义化类名**：使用 BEM 命名规范
   ```less
   .component-name { }
   .component-name__element { }
   .component-name--modifier { }
   ```

2. **使用 LESS 嵌套**：
   ```less
   .parent {
     &-child {  // .parent-child
       color: @text-primary;
     }
   }
   ```

3. **复用变量**：优先使用 `@import '../../index.less'` 中的变量

4. **响应式设计**：需要时使用媒体查询
   ```less
   .component {
     width: 100%;

     @media (min-width: 768px) {
       width: 50%;
     }
   }
   ```

## 测试清单

改造完成后，确保：
- [ ] 样式正确显示
- [ ] 交互状态正常（hover, focus, active）
- [ ] 响应式布局正常
- [ ] 深色主题正确
- [ ] 动画效果保留

## 快速批量替换示例

可以使用以下正则表达式辅助替换（VSCode）：

```
查找: className="([^"]*)"
替换: className="component-name"
```

然后手动调整为语义化的类名。
