import { RequestManagerPlusPlus,options} from "./requestManagerCore";
import { LoadJson } from "./lib/loadjson";
import { requestPackage } from "./requestpackage";
import { RequestLoader } from "./requestloader";
import { requsetMoudleList } from "./requestInstance";
import { hostNameConfig } from './types';

export { Task } from './requestManagerCore'

/**
 * 读取进来的JSON的格式
 */
export interface configs {
    ["module"]: Array<string>;
    ["hostConfigs"]?: {
        ['hostName']:hostNameConfig
    }
    ["proxy"]?: string;
    ["requestTimeoutByHost"]?:{
        [hostName:string]:number;
    }
    ["rootPath"]: {
        linux?: string,
        win?: string
    }
}

// 用于定义项目根路径
let rootPath:string;

async function getConfig(configPath:string) {
    try {
        return  await new LoadJson<configs>(configPath).getFile()
    } catch (error) {
        throw `读取配置错误:${error}`;
    }
}

function getRootPath(path:{linux?:string,win?:string}):string {
    if(!path){
        return '';
    }
    let result = process.cwd();
    if(process.platform == 'win32'){
        result = path.win;
    }else{
        result = path.linux;
    }
    return result;
}


/**
 * 批量请求管理器返回一个Promise,提供一个pushTask方法用于添加请求任务
 *
 * 该任务的格式需要符合本文件提供的Task接口要求
 *
 * @param configOrigin 配置源如果是路径则从该路径中读取,如果是对象则直接使用
 * @param requestOptions 请求的配置
 */
export async function AsyncRequestSimple(configOrigin:string|configs,requestOptions?:options) {

    let config:configs;

    if(typeof configOrigin == 'string'){
        config = await getConfig(configOrigin);
    }else if(typeof configOrigin == 'object'){
        config = configOrigin;
    }else{

        throw "错误:请求配置源类型错误,configOrigin必须是string|configs";
    }

    rootPath = getRootPath(config.rootPath);

    // let rootPath = path.linux || path.win?path.linux || path.win:process.cwd();

    const modules = config['module'],
          configByHost = config['hostConfigs'],
          globalProxy = config['proxy'],
          requestTimeout = config['requestTimeoutByHost'];

    // 统一包装为请求对象
    const standardRequest = requestPackage(modules,configByHost,globalProxy);

    // 获取包装好的请求模块
    const standardRequestModuleInstance:requsetMoudleList = RequestLoader(standardRequest);

    // 覆盖域名下请求
    if(typeof requestOptions == 'object' && typeof requestTimeout == 'object'){
        requestOptions.requestTimeoutByhost = Object.assign(requestTimeout,requestOptions.requestTimeoutByhost);
    }

    return new RequestManagerPlusPlus(standardRequestModuleInstance,requestOptions);
};
