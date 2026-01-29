# Changelog

所有显著变化都会记录在此文件中。

项目遵循 [Semantic Versioning](https://semver.org/) 版本规范。

## [1.0.0] - 2026-01-27

### Added (添加)
- ✅ 简谱OCR识别模块
  - 使用Tesseract.js进行图片OCR识别
  - 自动转换简谱为ABC格式
  - 实时进度显示
  
- ✅ 五线谱渲染模块
  - 使用ABCjs专业渲染
  - 响应式布局
  - 音符高亮支持
  
- ✅ 五线谱编辑模块
  - 直接编辑ABC格式
  - 实时预览
  - ABC格式提示
  
- ✅ MIDI播放模块
  - Tone.js音频合成
  - 口琴音色模拟
  - 播放/停止控制
  - 音符高亮演奏
  
- ✅ 音准检测模块
  - 麦克风音频捕获
  - 实时基频检测
  - 准确度评分
  - 可视化反馈
  
- ✅ UI/UX设计
  - 现代化紫粉色渐变设计
  - 毛玻璃效果卡片
  - 流畅的过渡和动画
  - 响应式布局（桌面/平板/移动）
  
- 📚 完整文档
  - README.md - 项目介绍
  - GUIDE.md - 用户使用指南
  - DEVELOPMENT.md - 开发者文档
  - PROJECT_INFO.md - 项目详细信息
  
- 📦 示例文件
  - 小星星 (Twinkle Twinkle)
  - 伦敦桥 (London Bridge)
  - 欢乐颂 (Ode to Joy)
  - 玛丽有只小羊羔 (Mary Had a Little Lamb)

### 技术栈
- React 18.3.1
- TypeScript 5.9.3
- Vite 5.4.21
- Tone.js 14.9.17
- ABCjs 6.6.0
- Tesseract.js 5.1.1
- TailwindCSS 3.4.19

### 项目结构
- 模块化组件设计
- 清晰的文件组织
- TypeScript全覆盖
- CSS-in-Module样式

---

## 未来计划

### Version 1.1.0 (计划)
- [ ] 用户账户系统
- [ ] 乐谱保存和云端同步
- [ ] 多人在线协作
- [ ] 更多乐器音色

### Version 1.2.0 (计划)
- [ ] 录音功能和对比分析
- [ ] 乐谱库和社区分享
- [ ] 学习进度追踪
- [ ] AI辅导反馈

### Version 2.0.0 (计划)
- [ ] 移动端应用
- [ ] 离线使用支持
- [ ] 高级编辑器功能
- [ ] 实时乐队演奏

---

## 版本兼容性

### Node.js
- 最低版本: 18.x
- 建议版本: 20.x+

### 浏览器
| 浏览器 | 最低版本 |
|--------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## Known Issues (已知问题)

- 在极端噪声环境下，音准检测准确度可能下降
- 某些特殊字符可能无法正确识别（OCR）
- 移动浏览器中某些手势交互可能不支持

---

## 贡献者

感谢所有为本项目做出贡献的人！

---

## 许可证

本项目采用 MIT License - 详见 [LICENSE](LICENSE) 文件
