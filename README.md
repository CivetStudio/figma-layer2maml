# Figma Layer → MAML

将 **Figma 图层转换为 Xiaomi MAML XML** 的 Figma 插件。

通过在 Figma 中选择设计图层，自动生成对应的 MAML XML，并支持图片资源导出、预览、复制以及 ZIP 打包，方便将 Figma 设计稿快速转换为小米主题 / 锁屏所使用的 MAML 资源。

## ✨ Features

- 🎨 **Figma → MAML**
  - 根据 Figma 中选择的图层生成 MAML XML
  - 支持一次选择多个图层
  - 显示当前转换的图层数量

- 📐 **图层结构转换**
  - 将 Figma 图层结构映射为 MAML 层级结构
  - 保留设计中的层级关系与布局信息

- 🖼️ **图片资源导出**
  - 自动识别需要导出的图片资源
  - 支持 PNG / JPG 等图片资源
  - 导出后提供图片预览
  - 可直接保存单张图片

- 📦 **ZIP 打包**
  - 一键将生成的图片资源打包为 ZIP
  - 方便直接用于后续 MAML 项目整理

- 📋 **MAML XML 复制**
  - 一键复制生成的 XML
  - 方便直接粘贴到 MAML 项目中

- 🔍 **代码查看**
  - 支持代码折叠 / 展开
  - 自动显示 XML 行数与图片数量

- 🌗 **深色 / 浅色主题**
  - 支持 Dark / Light 两种界面主题
  - 默认使用浅色主题

## 🚀 Usage

### 1. 在 Figma 中打开插件

安装并运行 `Figma Layer → MAML`。

### 2. 选择图层

在 Figma 画布中选择需要转换的图层。

插件会根据当前选择自动生成 MAML XML。

### 3. 查看 MAML

生成的 XML 会显示在代码区域中，同时显示：

- Layer Count
- XML Lines
- Image Count

### 4. 复制 XML

点击 `⌘ 复制`，即可将生成的 MAML XML 复制到剪贴板。

### 5. 导出图片

如果当前 MAML 中包含图片资源，可以点击 `↓ 图片展示` 查看所有需要导出的图片。

点击图片即可保存对应资源。

### 6. 一键打包

点击 `⬇ 一键存图`，即可将当前导出的图片资源打包为 ZIP 文件。

生成的文件类似：

```text
maml_images_XXXXXXXXXXXXX.zip
```

## 🧩 Workflow

```text
Figma Design
     │
     ▼
Select Layers
     │
     ▼
Figma Layer → MAML
     │
     ├───────────────┐
     ▼               ▼
 MAML XML        Image Assets
     │               │
     ▼               ▼
 Copy XML        Preview / Export
                     │
                     ▼
                  ZIP Package
```

## 🖥️ Interface

插件提供简洁的 MAML 代码输出界面，并提供：

- MAML XML 实时输出
- 图层数量统计
- XML 行数统计
- 图片数量统计
- XML 一键复制
- 代码折叠 / 展开
- 图片资源预览
- 图片资源导出
- ZIP 一键打包
- Dark / Light 主题切换
- 清空当前转换结果

## 📁 Project Structure

一个典型的 Figma 插件项目结构：

```text
figma-layer2maml/
├── manifest.json
├── code.js
├── ui.html
├── README.md
└── ...
```

其中：

- `manifest.json`：Figma Plugin 配置
- `code.js`：Figma 插件核心逻辑
- `ui.html`：插件 UI、MAML 输出以及资源导出界面
- `README.md`：项目说明

## 📦 Image Export

当转换结果包含图片资源时，插件会自动提供图片导出功能。

图片资源会以缩略图形式展示，并支持单独保存。

也可以使用 **一键存图** 将所有图片资源打包：

```text
全部图片
   ↓
一键存图
   ↓
maml_images_xxxxx.zip
```

插件在 UI 端完成 ZIP 文件生成，不需要额外的服务器。

## 🔧 Technical Notes

UI 使用原生 HTML / CSS / JavaScript 实现。

主要技术包括：

- Figma Plugin API
- HTML
- CSS
- JavaScript
- Blob / Object URL
- Clipboard API
- TextEncoder
- DataView
- ZIP 文件结构生成

XML 输出同时保留原始 XML 和用于界面显示的高亮内容。

复制操作使用原始 XML，而不是 HTML 高亮后的内容。

## 📝 Status

当前项目处于持续开发阶段。

MAML 的具体支持范围会随着 Figma 图层类型以及 Xiaomi MAML 能力持续扩展。

## 🤝 Contributing

欢迎提交：

- Bug Report
- Feature Request
- Pull Request
- MAML 转换建议
- Figma 图层兼容性问题

如果发现某种 Figma 图层无法正确转换为 MAML，建议提交一个包含以下信息的 Issue：

1. Figma 图层类型
2. 图层结构
3. 期望生成的 MAML
4. 实际生成的 MAML
5. 必要的截图或示例文件

## 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details.

---

**Figma Layer → MAML**

让 Figma 设计稿更快进入 Xiaomi MAML 工作流。
