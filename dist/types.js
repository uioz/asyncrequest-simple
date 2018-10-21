"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 该抽象类是请求类的基本包装类
 *
 * 提供了请求的基本包装属性和方法,可以说所有的包装类都要继承该类
 *
 * - 泛型参数
 *   - moduleConfig 该泛型规定主机格式
 *   - requestModuleType 该泛型规定了请求模块的类型
 */
class BaseRequest {
    /**
     * 标准请求配置需要实现standardConfig接口,该接口使用泛型规定了实现类请求的配置
     * @param standardConfig 标准请求配置
     * @param requestModule 请求模块
     */
    constructor(standardConfig, requestModule) {
        this.requestModule = requestModule;
        this.standardConfig = standardConfig;
    }
}
exports.BaseRequest = BaseRequest;
/**
 * 这个类是标准请求类
 *
 * 是建立在实践基础上得到的结果
 *
 * 这个类要求实现类提供
 *  - 基础配置设置
 *  - url设置
 *  - host配置设置
 *  - 请求头设置
 *  - 代理设置
 *  - 解析器实现
 */
class standardRequset extends BaseRequest {
    constructor() {
        super(...arguments);
        this.requestOptionsName = '';
    }
    // parseFunction:(...args)=>any;
    useHostConfig(hostname) {
        if (this.standardConfig.hostConfigs[hostname]) {
            this.requestOptionsByHost = this.standardConfig.hostConfigs[hostname];
            this.requestOptionsName = hostname;
            return true;
        }
        return false;
    }
    getUseingHostConfigName() {
        return this.requestOptionsName;
    }
    setRequestOption(optionName, value) {
        if (typeof optionName == 'string') {
            this.requestOptionsByHost[optionName] = value;
        }
        else {
            for (const key in optionName) {
                this.requestOptionsByHost[key] = optionName[key];
            }
        }
    }
    hasRequestOption(optionName) {
        return !!this.requestOptionsByHost[optionName];
    }
}
exports.standardRequset = standardRequset;
