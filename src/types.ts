/**
 * host配置实现指引
 */
export type hostNameConfig = {
    url: string;
    headers?: object;
    proxy?: string;
    query?:any;
}

/**
 * promise 过滤接口
 * 
 * 防止类似的promise实现无法被识别为Promise
 */
export interface likePromise {
    then(param?:any):any;
    catch(param?:any):any;
}


/**
 * 该接口定义了不同模块初始化之间的基本配置,这个接口定义的内容是用于在不同模块传递配置的通用标准
 * 
 * 值得一提的是,不同请求模块之间的配置是不同的,所以具体的类型是由不同实现类指定的
 * 
 * 但是我们依然提供了一个基础的模板,要求这个泛型集成,他包含了几个请求最常用到的属性
 * 
 */
export interface standardConfig<moduleConfig extends hostNameConfig> {
    moduleName: string;
    hostConfigs?: {
        [hostname:string]:moduleConfig;
    }
    proxy?: string;
}

/**
 * 该接口定义了一个最基本的请求的内部的属性和方法
 * 
 * 这些属性和方法都是一个基本的请求前的配置设置
 * 
 * 该接口需要一个泛型,这个泛型是该模块的请求配置
 * 
 * - 泛型参数
 *   - requestOptions 请求配置,主机配置下的配置
 *   - responseType request 返回Promise中resolve返回的类型
 */
export interface simpleRequest<requestOptions> {

    /**
     * 保存了当前的请求的配置,是由host配置决定的
     */
    requestOptionsByHost:requestOptions;
    
    /**
     * 保存了当前的使用的请求配置的名字
     */
    requestOptionsName:string;

    /**
     * 指定请求的时候使用的请求配置
     * @param hostName 根据主机名称制定的配置
     */
    useHostConfig(hostName: string): boolean;

    /**
     * 获取当前使用中的主机请求配置
     */
    getUseingHostConfigName(): string;

    /**
     * 根据不同请求模块设置内部请求时候的配置
     * @param optionName 内部使用的配置属性名称
     * @param value 设定的值
     */
    setRequestOption(optionName: string, value: any): void;

    setRequestOption(options:object):void;

    /**
     * 查看是否存在该配置选项
     * @param optionName 内部使用的配置属性名称
     */
    hasRequestOption(optionName: string): boolean;

    /**
     * 请求并且使用Promise返回结果
     * 
     * 我们不强求你使用标准的Promise
     * 
     * 实际上它规定的已经够宽松了,只要是符合Promise接口的都是可以通过类型验证的
     * 
     * 另外我们提供了一个重载,他允许返回任何类型的东西,但是我们仍然建议你返回Promise
     */
    request<T>():T;

    request():any;


}

/**
 * 实现该接口的类可以提供代理的设置手段
 * 
 */
export interface proxySetting {
    
    /**
     * 给当前请求使用的配置指定一个代理
     * 
     * 如果没有传入代理地址,则使用配置中的默认地址,如果没有默认地址则返回false
     * @param proxy 代理地址
     */
    setProxy(proxy?:string):boolean;

    hasProxy?():boolean;

    getProxy?():string;

}

/**
 * 实现该接口的类可以提供请求头的设置手段
 */
export interface headerSetting {
    
    /**
     * 设置请求头,会覆盖重复的请求头
     * @param header 请求头的名称
     * @param value 请求头的内容
     */
    setHeader(header:string,value:string):void;
    hasHeader?(header:string):boolean;
    getHeader?():string;

}


/**
 * 实现这个接口的类,需要提供请求结果后的内容解析
 */
export interface requestParse {
    /**
     * 用于保存解析函数
     */
    parseFunction:(...args)=>any;

    /**
     * 像内部指定一个解析函数,不限制类型版本
     * @param parsefun 解析使的回调函数
     */
    setParseFunction(parsefun:(...args)=>any):void;

    /**
     * 
     * 设置内部使用的解析函数该函数使用泛型指定解析函数的参数类型和返回类型
     */
    setParseFunction<T,K>(parsefun:(options:T)=>K):void;


    /**
     * 查看内部是否拥有解析函数
     */
    hasParseFunction?():boolean;

    /**
     * 使用请求返回结果后使用解析函数解析
     * 
     *  - 泛型参数
     *    - responseType 通过解析返回的内容
     *    - requestType 请求模块的类型
     */
    requestByParseFunction<responseType,requestType>():responseType;

    /**
     * 使用请求返回结果后使用解析函数解析
     * 
     * 这个版本不限制参数类型
     */
    requestByParseFunction():any;
}

/**
 * 该接口提供了查询字符串和使用和删除方法
 */
interface query {
    /**
     * 提供一个查询对象
     * 
     * 建议将传入的对象挂载在内部的requestOptionsByHost上,然后实现transformRquestOptions接口
     * 
     * 在request等请求中进行请求类型转换.
     * 
     * 设计上请求模块只能对当次查询有效,但是为了减少内部的耦合,没有在请求完成后提供删除的方式
     * 
     * 你可以自行在request等请求中调用clearQuery方法,或者干脆交由外部显式调用.
     * @param queryObj 查询对象 key = 查询的名称 value = 查询的值
     */
    useQuery(queryObj:{[queryName:string]:string}):void;

    /**
     * 这个方法是给由使用url表示功能的页面准备的
     * 
     * - 例子
     *   - xxxx.com/help/zh-cn/email
     *   - 数组格式
     *   - ['help','zh-cn','email']
     * @param pathArray 多个字符串组成的路径
     */
    useQueryOfUrl(pathArray:string[] | string):void;

    /**
     * 删除内部的查询字符串
     * 当没有内容传入的时候,则清空所有的查询
     * @param queryName 删除的查询的名称
     */
    clearQuery(queryName?:string):void;

    /**
     * 指定扩展url段,清除标准url后面的扩展url
     * 
     * 例如www.baidu.com/s
     * 
     * 传入's'则结果为www.baidu.com
     * 
     * @param querName 扩展url名称
     */
    clearQueryOfUrl(extendName:string):void;
}

/**
 * 当有的实现类的配置格式和标准不一致的时候在请求前调用该该方法进行格式转换
 * 
 * 如果实现了该接口可以提供一个标准的转换内置配置手段
 * 
 * - 泛型参数
 *   - T 进行转换后的类型
 */
export interface transformRquestOptions<T>{
    transformRquestOptions():T;
}

/**
 * 钩子函数
 * 
 * 用于请求前 请求时 请求后的处理
 * 
 * 这些方法是由request本身调用的,所以这些方法都是可选实现
 */
export interface requestCheck {
    /**
     * 用于请求前的检查
     */
    checkBeforeCheck?(): boolean;

    /**
     * 用于转换请求内部的配置,用于请求前转换配置格式
     */
    transformOptions?():any;

    /**
     * 用于请求后的内容检查,用于检查请求的结果是否正确
     */
    checkAfterCheck?<T>():boolean;

    /**
     * 重载方法,这个版本建议处理内部的一些钩子
     * 
     * 例如删除一些属性
     */
    checkAfterCheck?():boolean;
}

/**
 * 该抽象类是请求类的基本包装类
 * 
 * 提供了请求的基本包装属性和方法,可以说所有的包装类都要继承该类
 * 
 * - 泛型参数
 *   - moduleConfig 该泛型规定主机格式
 *   - requestModuleType 该泛型规定了请求模块的类型
 */
export abstract class BaseRequest<hostConfig extends hostNameConfig> {

    protected standardConfig: standardConfig<hostConfig>;
    protected requestModule: any;

    /**
     * 标准请求配置需要实现standardConfig接口,该接口使用泛型规定了实现类请求的配置
     * @param standardConfig 标准请求配置
     * @param requestModule 请求模块
     */
    constructor(standardConfig: standardConfig<hostConfig>, requestModule: any) {
        this.requestModule = requestModule;
        this.standardConfig = standardConfig;
    }

}


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
export abstract class standardRequset<hostConfig extends hostNameConfig> 
                extends 
                BaseRequest<hostConfig>
                implements 
                simpleRequest<hostConfig>,
                proxySetting,
                headerSetting,
                // requestParse,
                query,
                requestCheck
{

    requestOptionsByHost:hostConfig;
    requestOptionsName:string = '';
    // parseFunction:(...args)=>any;

    useHostConfig(hostname:string):boolean{

        if(this.standardConfig.hostConfigs[hostname]){
            this.requestOptionsByHost = this.standardConfig.hostConfigs[hostname];
            this.requestOptionsName = hostname;

            return true;
        }

        return false;
    }

    getUseingHostConfigName(){

        return this.requestOptionsName;
    }

    setRequestOption(optionName: string | object, value?: any):void{

        if(typeof optionName == 'string'){
            
            this.requestOptionsByHost[optionName] = value;
        }else{

            for (const key in optionName) {
                
                this.requestOptionsByHost[key] = optionName[key];

            }

        }

    }

    hasRequestOption(optionName:string):boolean{

        return !!this.requestOptionsByHost[optionName];
    }

    abstract request<T extends likePromise>():T;

    abstract setProxy(proxy?:string):boolean;

    abstract setHeader(headerName:string,value:string):void;

    // abstract setParseFunction(parsefun:(...args)=>any):void;

    // abstract requestByParseFunction<responseType,requestType extends likePromise>():Promise<responseType>;

    abstract useQuery(queryObj:{[queryName:string]:string}):void;

    abstract useQueryOfUrl(queryPaths:string[]|string):void;

    abstract clearQuery(queryName?:string):void;

    abstract clearQueryOfUrl(extendName:string):void;
    
    /**
     * 用于请求前的检查,内容的处理
     */
    checkBeforeCheck?(): boolean;

    /**
     * 用于转换请求内部的配置,用于请求前转换配置格式
     */
    transformOptions?(): any;

    /**
     * 用于请求后的内容检查,用于检查请求的结果是否正确
     * 
     * 以及内容的释放
     */
    checkAfterCheck?<T>():boolean;
}




