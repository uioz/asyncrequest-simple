import { standardConfig } from "./types";

/**
 * 将输入的配置包装为统一的请求对象
 * @param requestMehods 使用请求器的名字
 * @param requestParams 请求时附加的参数
 * @param proxy 请求时代理参数
 */
export function requestPackage(requestMehods: string[], hostConfigs?:{},proxy?: string):standardConfig<any>[]{

    let result:standardConfig<any>[] = [];

    for (const iterator of requestMehods) {

        result.push({
            moduleName: iterator,
            hostConfigs: (hostConfigs ? hostConfigs : undefined),
            proxy: (proxy ? proxy : undefined)
        });

    }
    
    return result;
    
}