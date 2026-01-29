# 🎵 音乐学习助手 - 故障排除指南

## 常见问题解决方案

### ❌ 问题：播放功能无法使用（无声或无反应）

#### 快速检查清单
- [ ] 浏览器是否支持 Web Audio API（Chrome 90+, Firefox 88+, Safari 14+）
- [ ] 系统音量是否打开？
- [ ] 浏览器标签页音量是否静音？
- [ ] 设备喇叭是否工作正常？
- [ ] 是否在浏览器中允许音频权限？

#### 详细排查步骤

**第1步：检查浏览器兼容性**
```
1. 按 F12 打开开发者工具
2. 在控制台输入: 
   new (window.AudioContext || window.webkitAudioContext)()
3. 如果返回 AudioContext 对象，说明支持
4. 如果报错，需要更新浏览器
```

**第2步：检查音频权限**
```
1. 在地址栏左侧找到权限图标
2. 查看"音频"权限是否被阻止
3. 如果阻止了，点击"允许"
4. 刷新页面重试
```

**第3步：查看控制台日志**
```
1. 按 F12 打开开发者工具
2. 切换到"控制台"标签
3. 点击播放按钮
4. 查看是否有错误信息
5. 记录错误信息用于调试
```

**第4步：测试 Tone.js 初始化**
```javascript
// 在控制台运行以下代码
Tone.start().then(() => {
  console.log('Audio Context started')
  const synth = new Tone.Synth().toDestination()
  synth.triggerAttackRelease('C4', '8n')
})
```

#### 常见错误信息和解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `NotAllowedError` | 未授权访问音频 | 允许浏览器音频权限 |
| `NotSupportedError` | 浏览器不支持 | 使用现代浏览器 |
| `InvalidStateError` | Audio Context 未启动 | 刷新页面，点击页面任意位置 |
| `TypeError: synth is undefined` | Tone.js 未初始化 | 等待初始化完成（页面加载后1秒） |

---

### ❌ 问题：五线谱不显示换行

#### 快速检查清单
- [ ] ABC 格式是否正确？
- [ ] 乐谱内容是否过短？
- [ ] 浏览器窗口宽度是否足够？

#### 解决方案

**检查 ABC 格式**
```
正确格式:
X:1
T:曲名
M:4/4
L:1/8
K:C
CDE|FGA|BGc|

错误格式缺少必要字段会导致无法换行
```

**调整窗口宽度**
- 尝试放大浏览器窗口
- 在全屏模式下查看
- 尝试在不同分辨率下查看

**测试换行功能**
```
使用这个示例测试（有20个音符，应该自动换行）：
X:1
T:Test Wrap
M:4/4
L:1/8
K:C
CCCCCCCC|DDDDDDDD|EEEEEEEEz|
```

---

### ❌ 问题：五线谱渲染不出来

#### 快速检查清单
- [ ] ABC 格式是否有语法错误？
- [ ] 是否缺少必要字段（X:, M:, L:, K:）？
- [ ] 音符是否有效（1-7, A-G, a-g, z）？

#### 常见 ABC 语法错误

| 错误 | 示例 | 修正 |
|------|------|------|
| 缺少曲号 | `T:曲名...` | 加上 `X:1` |
| 缺少拍号 | `L:1/8...` | 加上 `M:4/4` |
| 无效音符 | `8, 9, 0` | 使用 1-7 或 A-G |
| 升降号格式错 | `C ##` | 改为 `C#` |

#### 最小可用 ABC
```
X:1
T:Test
M:4/4
L:1/8
K:C
CDEFGABc
```

---

### ❌ 问题：歌词不显示

#### 快速检查清单
- [ ] 是否添加了 `w:` 字段？
- [ ] 歌词是否在乐谱下方？
- [ ] 音符数量和歌词词数是否匹配？

#### 歌词格式

**正确格式**
```abc
X:1
T:小星星
M:2/4
L:1/8
K:C
CCGGAAG|FFEEDC|
w: Twinkle twinkle lit-tle star
```

**常见错误**
```
❌ 错误：歌词在乐谱上方
w: 歌词
CDEFGABc|

✅ 正确：歌词在乐谱下方
CDEFGABc|
w: 歌词
```

---

### ❌ 问题：OCR 识别准确度低

#### 快速检查清单
- [ ] 图片是否清晰？
- [ ] 图片对比度是否足够高？
- [ ] 简谱是否倾斜？
- [ ] 图片分辨率是否足够？

#### 改进 OCR 识别的技巧

1. **图片质量**
   - 使用高清照片（最少 1280x720）
   - 确保光线充足，无阴影
   - 使用黑白或高对比度拍照

2. **简谱内容**
   - 使用标准简谱格式
   - 避免手写或模糊的符号
   - 确保数字和符号清晰可辨

3. **拍摄技巧**
   - 正面拍摄，避免角度倾斜
   - 铺平纸张，避免褶皱
   - 去除阴影和反光
   - 靠近简谱，填充整个画面

---

## 🔧 高级调试

### 查看完整日志
```javascript
// 在浏览器控制台运行
// 查看所有日志
console.log(logger.getLogs())

// 下载日志文件
logger.downloadLogs()
```

### 测试各个模块

**测试 Tone.js**
```javascript
const synth = new Tone.Synth().toDestination()
synth.triggerAttackRelease('C4', '8n') // 播放一个 C 音符
```

**测试 ABCjs 渲染**
```javascript
abcjs.renderAbc('container-id', 'X:1\nT:Test\nM:4/4\nL:1/8\nK:C\nCDE')
```

**测试麦克风访问**
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('麦克风可访问'))
  .catch(err => console.error('麦克风无法访问:', err))
```

### 性能分析

**检查渲染性能**
```javascript
// 在控制台运行
performance.mark('start')
// 执行操作
performance.mark('end')
performance.measure('duration', 'start', 'end')
console.log(performance.getEntriesByName('duration')[0])
```

---

## 📱 移动设备特定问题

### iOS Safari
- ⚠️ 需要用户交互后才能播放音频
- ⚠️ 可能需要允许自动播放
- ⚠️ 部分音频 API 支持有限

**解决方案**：
1. 点击页面任意位置激活
2. 检查设置 > Safari > 高级 > 不共享网站数据

### Android Chrome
- ⚠️ 部分设备音频初始化较慢
- ⚠️ 权限请求可能需要确认

**解决方案**：
1. 允许所有权限请求
2. 等待初始化完成（通常1-2秒）

---

## 🆘 当以上都不管用时

### 收集信息进行反馈
1. **浏览器和系统信息**
   ```
   浏览器: Chrome/Firefox/Safari
   版本: X.X.X
   操作系统: Windows/Mac/Linux
   ```

2. **错误信息**
   ```
   1. 打开 F12 开发者工具
   2. 复制完整的控制台错误信息
   ```

3. **复现步骤**
   ```
   1. 
   2. 
   3. 
   ```

4. **视频录制**
   - 录制问题发生的过程
   - 包含浏览器控制台

### 提交 Issue
- 在 GitHub 创建详细的 Issue
- 包含上述所有信息
- 可以附加日志文件

---

## 📞 快速联系

- **GitHub Issues**: [项目仓库]/issues
- **Email**: [联系方式]
- **社区论坛**: [社区链接]

---

**最后更新**: 2026年1月27日
**版本**: 1.0
