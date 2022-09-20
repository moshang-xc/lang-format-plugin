# LangFormatPlugin

### 功能：

将项目中的lang语言包文件夹经过此插件处理后输出到目标文件夹，处理包括：

- 用更简洁的字符串替换原英文词条的key，并输出新旧key映射文件format.json
- 压缩json文件
- 压缩b28n.js文件
- 开发环境下监听json文件变化

### 使用：

配置参数：

**fromDir**:  lang语言包原路径

**outDir**:  相对于输出目录的路径

```js
const JsonFormatPlugin = require("lang-format-plugin");
new JsonFormatPlugin({
    fromDir: "./src/assets/lang/",
    outDir: "./lang/"
})
```

  

  

  