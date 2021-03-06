"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function RequestLoader(request) {
    let result = {};
    for (const requestMethod of request) {
        try {
            // 注意在commonjs下,请求模块使用default导出,会给模块添加一个default属性
            const module = require('./' + requestMethod.moduleName).default;
            result[requestMethod.moduleName] = new module(requestMethod);
        }
        catch (error) {
            throw Error(`${requestMethod.moduleName}模块加载失败 如果有多个模块请屏蔽本模块: ${error}`);
        }
    }
    return result;
}
exports.RequestLoader = RequestLoader;
