"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const requestPromise = require("request-promise");
class RequestPromise extends types_1.standardRequset {
    /**
     * 本请求包装模块包装的是request-promise,内部使用的模块名称也是如此'request-promise'
     *
     * - 接口解释
     *   - standardConfig 是内部保存的完整配置,包括模块名称
     *   - requestHostConfig(requestPromiseHostConfig)指的是每个域名下的配置格式
     *
     * @param hostConfigs 域名下配置
     * @param module 使用的模块
     * @param proxy 全局使用的代理
     */
    constructor(configs) {
        super(configs, requestPromise);
    }
    /**
     * 用于请求前检测是否存在错误,不过返回false,如果遇到错误则直接报错且终止执行.
     *
     * 可以将运行前的处理代码放置于此
     */
    checkBeforeCheck() {
        if (typeof this.requestOptionsByHost.url == 'string' && this.requestOptionsByHost.url) {
            if (this.requestOptionsByHost && this.requestOptionsName !== '') {
                return true;
            }
            else {
                throw Error(`错误${this.standardConfig.moduleName}没有选择主机配置或者没有主机配置!`);
            }
        }
        else {
            throw Error(`错误${this.standardConfig.moduleName}缺少url属性!`);
        }
    }
    // requestByParseFunction<responseType,requestType extends likePromise>():Promise<responseType>{
    //     return new Promise<responseType>((resolve,reject)=>{
    //         this.request<requestType>().then((htmlString)=>{
    //             resolve(this.parseFunction(htmlString));
    //         })
    //         .catch((error)=>{
    //             reject(error);
    //         });
    //     });
    // }
    request() {
        this.checkBeforeCheck();
        return new this.requestModule(this.requestOptionsByHost);
    }
    setHeader(headerName, value) {
        this.requestOptionsByHost.headers[headerName] = value;
    }
    // setParseFunction(parsefun:(...args)=>any){
    //     this.parseFunction = parsefun;
    // }
    setProxy(proxy) {
        if (!!proxy && typeof proxy == 'string') {
            this.requestOptionsByHost.proxy = proxy;
            return true;
        }
        else if (!!this.standardConfig.proxy && typeof this.standardConfig.proxy == 'string') {
            this.requestOptionsByHost.proxy = this.standardConfig.proxy;
            return true;
        }
        return false;
    }
    useQuery(queryObj) {
        this.requestOptionsByHost.qs = queryObj;
    }
    useQueryOfUrl(queryPaths) {
        let originUrl = this.requestOptionsByHost.url;
        let extendUrl = Array.isArray(queryPaths) ? queryPaths.join('/') : queryPaths;
        if (extendUrl[0] === '/') {
            extendUrl = extendUrl.slice(1, extendUrl.length);
        }
        if (originUrl[originUrl.length - 1] !== '/') {
            originUrl += '/';
        }
        this.requestOptionsByHost.url = originUrl + extendUrl;
    }
    clearQuery(queryName) {
        if (queryName) {
            delete this.requestOptionsByHost.qs[queryName];
        }
        else {
            delete this.requestOptionsByHost.qs;
        }
    }
    clearQueryOfUrl(extendUrlName) {
        const baseurl = this.standardConfig[this.requestOptionsName].url;
        let extendUrl = this.requestOptionsByHost.url.slice(baseurl.length, this.requestOptionsByHost.url.length);
        let result = [];
        if (extendUrl.length) {
            result = extendUrl.split('/').filter((value) => {
                return value !== extendUrlName && value !== '';
            });
        }
        this.useQueryOfUrl(result);
    }
}
exports.default = RequestPromise;
