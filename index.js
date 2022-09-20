const fs = require("fs");
const path = require("path");
const { RawSource } = require("webpack-sources");
const UglifyJS = require("uglify-js");

class JsonFormatPlugin {
  constructor(options = {}) {
    this.fromDir = options.fromDir;
    this.outDir = options.outDir;
    this.filesList = []; //翻译文件完整目录数组
    this.b28nFullPath = "";
    this.formatKeys = {}; //新旧键名映射
    this.assets = {}; // 要插入webpack编译输出的语言包资源
    this.keyIndex = 0;
  }

  apply(compiler) {
    let fromDir = this.fromDir;
    this.fromDir = path.resolve(compiler.context, fromDir);
    //在 webpack 将asset输出到 output 目录之前进行操作
    compiler.hooks.emit.tap("JsonFormatPlugin", compilation => {
      //开始处理语言包
      this.start();
      // 把处理过的语言包资源添加进即将输出的asset
      compilation.assets = Object.assign(compilation.assets, this.assets);
      // 把 json 文件添加到依赖列表，让 Webpack 去监听使得文件内容发生变化时重新编译
      this.filesList.forEach((path) => {
        compilation.fileDependencies.add(path);
      })
    });

  }

  readFileList(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((item) => {
      var fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this.readFileList(path.join(dir, item)); //递归读取文件
      } else {
        path.extname(fullPath) === ".json" && this.filesList.push(fullPath);
        item == "b28n.js" && (this.b28nFullPath = fullPath);
      }
    });
  }

  createKeys(length) {
    let keys = [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z"
    ];
    keys = keys.concat(keys.map(v => v.toUpperCase()));
    length -= keys.length;
    let outKeys = keys.slice();
    digui(length);
    return outKeys;
    function digui(len) {
      if (len > 0) {
        for (let i = 0; i < keys.length; i++) {
          for (let j = 0; j < keys.length; j++) {
            outKeys.push(keys[ i ] + keys[ j ]);
            len--;
            if (len <= 0) {
              return;
            }
          }
        }
        keys = outKeys.slice();
        digui(len);
      }
    }
  }

  getKeyPair(file) {
    let data = fs.readFileSync(file);
    data = JSON.parse(data);
    let keys = (this.keys = this.createKeys(Object.keys(data).length));
    let formatKeys = (this.formatKeys = {});
    Object.keys(data).map((key, i) => {
      formatKeys[ key ] = keys[ i ];
    });
  }

  checkKey(key) {
    let keys = this.keys;
    let formatKeys = this.formatKeys;
    if (formatKeys[ key ] === undefined) {
      let newKey = keys[ this.keyIndex ] + keys[ keys.length - 1 - this.keyIndex ];
      formatKeys[ key ] = newKey;
      this.keys.push(newKey);
      this.keyIndex++;
    }
  }

  start() {
    // 读取文件列表
    this.readFileList(this.fromDir);
    if (process.env.NODE_ENV == "production") {
      // 重置key1
      this.getKeyPair(this.filesList[ 0 ]);
      let formatKeys = this.formatKeys;
      // 语言包文件重新编码key
      this.filesList.forEach((fullPath) => {
        let originData = JSON.parse(fs.readFileSync(fullPath)), outData = {};
        Object.entries(originData).map(([ key, value ]) => {
          this.checkKey(key);
          outData[ formatKeys[ key ] ] = value;
        });
        this.assets[ path.join(this.outDir, path.relative(this.fromDir, fullPath)) ] = new RawSource(JSON.stringify(outData));
      });
    } else {
      //开发环境下不做键名替换
      this.filesList.forEach((fullPath) => {
        this.assets[ path.join(this.outDir, path.relative(this.fromDir, fullPath)) ] = new RawSource(fs.readFileSync(fullPath));
      })
    }
    this.assets[ path.join(this.outDir, "format.json") ] = new RawSource(JSON.stringify(this.formatKeys));
    let b28nFullPath = this.b28nFullPath;
    let b28nData = Buffer.from(UglifyJS.minify(fs.readFileSync(b28nFullPath).toString()).code, "utf8")
    this.assets[ path.join(this.outDir, path.relative(this.fromDir, b28nFullPath)) ] = new RawSource(b28nData);
  }
}

module.exports = JsonFormatPlugin;
