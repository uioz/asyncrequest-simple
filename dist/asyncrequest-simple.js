"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requestManagerCore_1 = require("./requestManagerCore");
const loadjson_1 = require("./lib/loadjson");
const requestpackage_1 = require("./requestpackage");
const requestloader_1 = require("./requestloader");
// 用于定义项目根路径
let rootPath;
async function getConfig(configPath) {
    try {
        return await new loadjson_1.LoadJson(configPath).getFile();
    }
    catch (error) {
        throw `读取配置错误:${error}`;
    }
}
function getRootPath(path) {
    if (!path) {
        return '';
    }
    let result = process.cwd();
    if (process.platform == 'win32') {
        result = path.win;
    }
    else {
        result = path.linux;
    }
    return result;
}
function getIntance(config, requestOptions) {
    rootPath = getRootPath(config.rootPath);
    // let rootPath = path.linux || path.win?path.linux || path.win:process.cwd();
    const modules = config['module'], configByHost = config['hostConfigs'], globalProxy = config['proxy'], requestTimeout = config['requestTimeoutByHost'];
    // 统一包装为请求对象
    const standardRequest = requestpackage_1.requestPackage(modules, configByHost, globalProxy);
    // 获取包装好的请求模块
    const standardRequestModuleInstance = requestloader_1.RequestLoader(standardRequest);
    // 覆盖域名下请求
    if (typeof requestOptions == 'object' && typeof requestTimeout == 'object') {
        requestOptions.requestTimeoutByhost = Object.assign(requestTimeout, requestOptions.requestTimeoutByhost);
    }
    return new requestManagerCore_1.RequestManagerPlusPlus(standardRequestModuleInstance, requestOptions);
}
/**
 * 批量请求管理器返回一个Promise,提供一个pushTask方法用于添加请求任务
 *
 * 该任务的格式需要符合本文件提供的Task接口要求
 *
 * @param configOrigin 配置源路径
 * @param requestOptions 请求的配置
 */
async function AsyncRequestSimple(configOrigin, requestOptions) {
    let config = await getConfig(configOrigin);
    return getIntance(config, requestOptions);
}
exports.AsyncRequestSimple = AsyncRequestSimple;
;
/**
 * 批量请求管理器AsyncRequestSimple的同步版本.
 *
 * @param configOrigin 基础配置对象
 * @param requestOptions 请求配置对象
 */
function AsyncRequestSync(configOrigin, requestOptions) {
    return getIntance(configOrigin, requestOptions);
}
exports.AsyncRequestSync = AsyncRequestSync;
;
