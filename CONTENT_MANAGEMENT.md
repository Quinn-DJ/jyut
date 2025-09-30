# 内容管理指南

## 概述

本指南详细说明如何管理粤语教学网站的课程内容，包括添加新课程、更新现有内容、管理音频文件等。

## 文件结构说明

```
├── Sound/                  # 音频文件目录
│   ├── Class01/           # 第一课音频
│   │   ├── a.opus         # Part A音频
│   │   ├── b_1.opus       # Part B第1段音频
│   │   └── b_2.opus       # Part B第2段音频
│   └── Class02/           # 第二课音频
│       ├── a.opus
│       ├── b_1.opus
│       └── b_2.opus
├── data/
│   └── courses.json       # 课程内容数据
└── index.html             # 主页面
```

## 添加新课程

### 步骤1：准备音频文件

1. **创建课程文件夹**
   ```
   Sound/Class03/  # 新课程文件夹
   ```

2. **添加音频文件**
   - `a.opus` - Part A音频（必需）
   - `b_1.opus` - Part B第1段音频
   - `b_2.opus` - Part B第2段音频
   - `b_3.opus` - Part B第3段音频（如有更多段落）

3. **音频文件要求**
   - 格式：推荐Opus (.opus)，也支持MP3、WAV、OGG
   - 质量：64-128kbps，44.1kHz采样率
   - 时长：建议每段不超过30秒
   - 命名：严格按照规则命名，系统会自动识别

### 步骤2：更新课程数据

编辑 `data/courses.json` 文件，添加新课程：

```json
{
  "courses": [
    // 现有课程...
    {
      "id": "Class03",
      "name": "第三课",
      "partA": {
        "originalText": "新课程的Part A原文",
        "jyutping": "san1 fo3 cing4 ge3 Part A jyun4 man4",
        "audioFile": "Sound/Class03/a.opus"
      },
      "partB": [
        {
          "paragraph": 1,
          "originalText": "Part B第一段原文",
          "jyutping": "Part B dai6 jat1 dyun6 jyun4 man4",
          "audioFile": "Sound/Class03/b_1.opus"
        },
        {
          "paragraph": 2,
          "originalText": "Part B第二段原文",
          "jyutping": "Part B dai6 ji6 dyun6 jyun4 man4",
          "audioFile": "Sound/Class03/b_2.opus"
        }
      ]
    }
  ]
}
```

### 步骤3：验证新课程

1. 刷新网站页面
2. 检查新课程是否出现在课程列表中
3. 测试Part A和Part B的音频播放
4. 确认原文和粤拼显示正确

## 修改现有课程

### 更新文本内容

直接编辑 `data/courses.json` 中对应课程的内容：

```json
{
  "id": "Class01",
  "name": "第一课",
  "partA": {
    "originalText": "修改后的原文",
    "jyutping": "sau1 goi2 hau6 ge3 jyun4 man4",
    "audioFile": "Sound/Class01/a.opus"
  }
}
```

### 替换音频文件

1. 准备新的音频文件
2. 保持相同的文件名
3. 直接替换Sound目录中的对应文件
4. 刷新页面测试

### 添加或删除Part B段落

**添加段落**：
1. 在Sound目录中添加新的音频文件（如b_3.opus）
2. 在courses.json中添加对应的段落数据

**删除段落**：
1. 从courses.json中删除对应段落
2. 删除对应的音频文件
3. 重新编号剩余段落（如有必要）

## 音频文件管理

### 音频格式选择

| 格式 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| Opus | 文件小，质量高，现代浏览器支持好 | 老版本浏览器可能不支持 | ⭐⭐⭐⭐⭐ |
| MP3 | 兼容性最好 | 文件较大，有版权问题 | ⭐⭐⭐⭐ |
| WAV | 质量最高 | 文件很大 | ⭐⭐ |
| OGG | 开源格式 | Safari不支持 | ⭐⭐⭐ |

### 音频制作建议

1. **录音环境**
   - 安静的环境，避免背景噪音
   - 使用质量较好的麦克风
   - 保持一致的录音距离

2. **录音技巧**
   - 语速适中，发音清晰
   - 每段之间留适当停顿
   - 音量保持一致

3. **后期处理**
   - 去除背景噪音
   - 标准化音量
   - 裁剪掉多余的静音

### 音频转换工具

**推荐工具**：
- **FFmpeg**（命令行）：功能强大，支持所有格式
- **Audacity**（图形界面）：免费，易用
- **在线转换器**：方便快捷，适合少量文件

**FFmpeg转换示例**：
```bash
# 转换为Opus格式
ffmpeg -i input.wav -c:a libopus -b:a 64k output.opus

# 批量转换
for file in *.wav; do
    ffmpeg -i "$file" -c:a libopus -b:a 64k "${file%.wav}.opus"
done
```

## 数据格式规范

### courses.json结构

```json
{
  "courses": [
    {
      "id": "课程ID（必需，如Class01）",
      "name": "课程名称（必需，如第一课）",
      "partA": {
        "originalText": "原文（必需）",
        "jyutping": "粤拼（必需）",
        "audioFile": "音频文件路径（必需）"
      },
      "partB": [
        {
          "paragraph": 段落编号（必需，从1开始）,
          "originalText": "原文（必需）",
          "jyutping": "粤拼（必需）",
          "audioFile": "音频文件路径（必需）"
        }
      ]
    }
  ]
}
```

### 字段说明

- **id**: 课程唯一标识符，建议使用ClassXX格式
- **name**: 课程显示名称，建议使用"第X课"格式
- **originalText**: 中文原文，应该准确无误
- **jyutping**: 粤语拼音，使用标准粤拼方案
- **audioFile**: 音频文件相对路径，从项目根目录开始

### 数据验证

系统会自动验证数据格式，常见错误：

1. **JSON格式错误**：检查括号、引号、逗号是否正确
2. **必需字段缺失**：确保所有必需字段都存在
3. **音频文件路径错误**：检查路径是否正确，文件是否存在
4. **段落编号不连续**：Part B段落编号应从1开始连续

## 内容质量控制

### 文本内容检查

1. **原文准确性**
   - 使用标准中文字符
   - 避免繁简混用
   - 检查标点符号

2. **粤拼准确性**
   - 使用标准粤拼方案
   - 声调标记正确（1-6）
   - 与原文对应准确

### 音频质量检查

1. **技术质量**
   - 音量适中，无爆音
   - 无明显背景噪音
   - 音质清晰

2. **内容质量**
   - 发音标准准确
   - 语速适中
   - 与文本内容一致

## 批量操作

### 批量添加课程

1. 准备所有音频文件，按规范命名和组织
2. 创建courses.json的备份
3. 批量更新courses.json（可使用脚本）
4. 逐一验证每个课程

### 批量更新音频

1. 准备新的音频文件
2. 使用脚本批量重命名和移动文件
3. 测试所有音频播放功能

### 示例脚本

**批量重命名音频文件**（Bash）：
```bash
#!/bin/bash
# 将所有.mp3文件转换为.opus并重命名

for dir in Sound/Class*/; do
    class_name=$(basename "$dir")
    echo "Processing $class_name..."
    
    # 转换Part A
    if [ -f "$dir/part_a.mp3" ]; then
        ffmpeg -i "$dir/part_a.mp3" -c:a libopus -b:a 64k "$dir/a.opus"
        rm "$dir/part_a.mp3"
    fi
    
    # 转换Part B
    for file in "$dir"/part_b_*.mp3; do
        if [ -f "$file" ]; then
            num=$(echo "$file" | grep -o '[0-9]\+')
            ffmpeg -i "$file" -c:a libopus -b:a 64k "$dir/b_$num.opus"
            rm "$file"
        fi
    done
done
```

## 故障排除

### 常见问题

1. **新课程不显示**
   - 检查courses.json格式是否正确
   - 确认至少有Part A音频文件
   - 查看浏览器控制台错误信息

2. **音频无法播放**
   - 检查文件路径是否正确
   - 确认音频文件格式被浏览器支持
   - 检查文件是否损坏

3. **内容显示错误**
   - 检查JSON格式是否正确
   - 确认字符编码为UTF-8
   - 检查特殊字符是否正确转义

### 调试工具

1. **浏览器开发者工具**
   - Console：查看JavaScript错误
   - Network：检查文件加载状态
   - Application：查看缓存状态

2. **JSON验证器**
   - 使用在线JSON验证工具检查格式
   - 使用代码编辑器的JSON语法检查

3. **测试页面**
   - 使用项目提供的测试页面验证功能
   - test-audio-integration.html：音频集成测试
   - test-file-scanning.html：文件扫描测试

## 最佳实践

1. **版本控制**
   - 使用Git管理内容变更
   - 重要更新前创建备份
   - 记录详细的提交信息

2. **测试流程**
   - 本地测试所有功能
   - 在不同浏览器中验证
   - 移动设备兼容性测试

3. **内容组织**
   - 保持一致的命名规范
   - 定期整理和优化内容
   - 建立内容审核流程

4. **性能考虑**
   - 控制音频文件大小
   - 避免过多的Part B段落
   - 定期清理无用文件