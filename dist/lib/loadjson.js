"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class LoadJson {
    /**
     * 简单的JSON读取器
     * @param filePath 路径字符串
     */
    constructor(filePath = '') {
        this.filePath = filePath;
    }
    setPath(filePath) {
        this.filePath = filePath;
        return this;
    }
    getPath() {
        return this.filePath;
    }
    /**
     * 调用以Promise的形式返回JSON的内容
     *
     * 有任何解析或者执行错误则将原来的报错信息利用catch输出
     */
    getFile() {
        return new Promise((resolve, reject) => {
            fs_1.readFile(this.filePath, { encoding: 'utf8' }, (error, data) => {
                if (!error) {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (error) {
                        reject(error);
                    }
                }
                reject(error);
            });
        });
    }
}
exports.LoadJson = LoadJson;
