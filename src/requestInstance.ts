import { standardRequset,hostNameConfig } from "./types";
import { requestPromiseHostConfig } from "./request-promise";

/**
 * 保存了不同实现standardRequset接口的模块名单
 */
export type ModuleNames = "request-promise";

/**
 * 这个接口提供实现请求接口的请求名单
 * 
 * 实际上我们没有严格要求必须实现什么接口
 * 
 * 但是建议后续的实现继承standardRequset抽象类,以便符合requestMangerCore的处理
 */
export interface requsetMoudleList {
    [moduleName: string]: standardRequset<hostNameConfig>
    'request-promise':standardRequset<requestPromiseHostConfig>
}