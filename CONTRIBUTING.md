# Contributing to Music Learning Assistant

感谢你对本项目的兴趣！欢迎提交Pull Request和Issue。

## 开发流程

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 代码规范

### 命名规范
- 组件文件：PascalCase (e.g., `OCRModule.tsx`)
- 工具函数：camelCase (e.g., `convertSimplifyToABC()`)
- 常量：UPPER_SNAKE_CASE (e.g., `HARMONICA_SETTINGS`)
- CSS类：kebab-case (e.g., `.sheet-renderer`)

### 代码风格
- 使用TypeScript进行类型检查
- 遵循ESLint规则
- 每个函数添加JSDoc注释
- 最大行长: 100字符

### 文件组织
```
src/
├── modules/          # 功能模块
├── styles/          # 样式文件
├── types/           # TypeScript类型定义（如需扩展）
└── utils/           # 工具函数（如需扩展）
```

## 提交信息格式

```
<type>: <subject>

<body>

<footer>
```

### Type
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码风格修改
- refactor: 代码重构
- test: 添加测试
- chore: 构建或依赖变化

### 示例
```
feat: Add harmonica sound recording feature

- Record user's playing voice
- Compare with original playback
- Show accuracy metrics

Closes #123
```

## 测试

在提交之前，请确保：
1. 代码可以正常编译（无TypeScript错误）
2. 应用可以正常运行（`pnpm dev`）
3. 生产构建成功（`pnpm build`）
4. 核心功能正常工作

## 报告Bug

创建Issue时，请包括：
- 清晰的标题
- Bug重现步骤
- 预期行为
- 实际行为
- 浏览器和系统信息
- 截图或视频（如适用）

## 功能请求

提交功能请求时，请说明：
- 为什么需要这个功能
- 该功能的使用场景
- 建议的实现方式

## 问题讨论

对于一般问题，请：
1. 先查看现有Issue
2. 查看文档
3. 如问题仍未解决，创建新Issue

---

感谢你的贡献！
