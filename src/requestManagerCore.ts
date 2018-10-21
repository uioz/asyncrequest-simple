import { standardRequset, hostNameConfig } from "./types";
import { ProxyDelayMethod } from './lib/proxyDelayMethod';
import { DelayTriggerQueue } from './lib/delayTriggerQueue';
import { reverseIteration } from "./lib/reverseIteration";
import { requsetMoudleList } from "./requestInstance";
import EventEmitter = require('events');


/**
 * 解析函数定义
 * 
 * - 泛型参数
 *   - T 调用解析函数的返回值
 *   - K 调用result方法返回的类型
 */
interface parseFuncction<T, k> {
    parseFunction?: (data: k) => T | boolean;
}

/**
 * 标准任务接口
 * 
 * - 泛型参数
 *   - T 指定解析函数返回的类型,如果没有解析函数,类型设置和K一致
 *   - K 指定解析函数接受的类型(请求返回的类型)
 */
export interface Task<T, K> extends parseFuncction<T, K> {
    // 任务的唯一标识同任务组内不可有重复的任务名称(注意)否则内部会出错,内部不会进行校验.
    taskName: any;
    // 使用的请求模块
    useModuleName: string;
    // 要请求的域名
    hostName: string;
    // 标准查询字符串
    query?: { [queryName: string]: string; };
    // 在基础url上扩展的url内容例如www.baidu.com/s 基础url为www.baidu.com
    // 扩展在此处传入使用以下方法表示['s'] 或者 's'
    queryUrl?: string[] | string;
    // 该属性下的所有属性都会挂载在请求模块上
    options?: {
        [optionsName: string]: any;
    }
    //指定代理,false以及没有该属性视为没有proxy,true为使用默认,string则有用户指定
    proxy?: boolean | string;
}

/**
 * Task在RequestManager中储存的类型
 * 
 * 由于该类型是储存在RequestManager内部的,所以不在乎原来Task中的泛型参数
 * 
 * - 添加到缓存队列阶段
 * - 初始化阶段
 * - 请求中阶段
 * - 请求完成阶段
 * - 返回结果阶段
 */
interface TaskInRequestManager extends Task<any, any> {
    id: symbol;
    state: 'cached' | 'init' | 'request' | 'wait' | 'done'
}

/**
 * RequestManager返回解析成功类型
 * 
 * - 泛型参数
 *   - T 成功后返回的类型,这也是解析函数返回的类型,如果没有解析函数,则需要设置类型和请求返回类型一致
 *   - K 成功请求后返回的结果
 */
interface responseSuccess<T, K> extends Task<T, K> {
    success: T;
}

/**
 * RequestManager返回解析失败类型
 * 
 * - 泛型参数
 *   - T 成功后返回的类型,这也是解析函数返回的类型,如果没有解析函数,则需要设置类型和请求返回类型一致
 *   - K 成功请求后返回的结果
 */
interface responseError<T, K> extends Task<T, K> {
    error: string;
}

/**
 * 定义返回的类型数组格式
 * 
 * - string[]数组中存放着错误内容
 * 
 * - 泛型参数
 *   - T 使用解析函数返回的类型,没有解析函数就是返回内容的类型
 */
type responseArray<T> = [T[], string[]];

/**
 * 定义每个域名下间隔请求的触发时间
 */
interface delayTriggerTimeByHost {
    [hostName:string]:number;
}

/**
 * RequestManager的配置选项
 */
export interface options {
    /**
     * 最大并发连接数,默认100
     */
    maxConnection?: number;
    /**
     * 每个域名下最大并发连接数
     */
    maxConnectionOfHost?: {
        [hostname: string]: number;
    };
    /**
     * 每个模块下最大并发连接数
     */
    maxConnectionOfModule?: {
        [modulename: string]: number;
    };
    /**
     * 定义每个域名下的请求间隔时间数
     */
    requestTimeoutByhost?:delayTriggerTimeByHost;
    /**
     * 任务队列最大缓存数,默认最大200
     */
    maxTaskCache?: number;
}

/**
 * 基础类提供了基础属性以及对应的设置方法
 */
abstract class RequestManagerBase extends EventEmitter {

    /**
     * 初始化计数器用于判断
     */
    protected initCounter: {
        /**
         * 全局最大连接数
         */
        maxConnectionOfGlobal: number,
        /**
         * 域名下最大连接数
         */
        maxConnectionOfHost: {
            [hostname: string]: number;
        },
        /**
         * 模块下最大连接数
         */
        maxConnectionOfModule: {
            [modulename: string]: number
        },
        /**
         * 最大缓存任务数
         */
        maxCachesTaskCounter: number
    } = {
            maxConnectionOfGlobal: 100,
            maxConnectionOfHost: {},
            maxConnectionOfModule: {},
            maxCachesTaskCounter: 200
        }

    /**
     * 运行中计数器,在任务状态变化时候修改
     * 
     * - 添加到缓存队列阶段
     * - 初始化阶段
     * - 请求中阶段
     * - 请求完成阶段
     * - 返回结果阶段
     */
    protected runingCounter: {
        /**
         * 缓存基数器,表示当前缓存Map中的任务数量
         */
        cachesTaskCounter: number,
        /**
         * 运行中任务队列
         */
        runingTaskQueue: TaskInRequestManager[],
        /**
         * 运行中域名下连接数
         */
        runingConnectionOfHost: {
            [hostname: string]: number;
        },
        /**
         * 运行中模块下连接数
         */
        runingConnectionOfModule: {
            [moduleName: string]: number;
        }
    } = {
            cachesTaskCounter: 0,
            runingTaskQueue: [],
            runingConnectionOfHost: {},
            runingConnectionOfModule: {}
        }

    /**
     * 保存请求使用的模块
     */
    protected modules:requsetMoudleList;

    /**
     * 保存未请求任务
     */
    protected TaskCacheMap: Map<symbol, TaskInRequestManager[]> = new Map();

    /**
     * 保存已完成任务
     */
    protected TaskDoneMap: Map<symbol, [responseSuccess<any, any>[], responseError<any, any>[]]> = new Map();

    /**
     * 自动设置配置选项
     * @param option 请求管理器配置
     */
    protected setOption(option: options): void {

        const init = this.initCounter;

        if (option.maxConnection) {
            init.maxConnectionOfGlobal = option.maxConnection;
        }

        if (option.maxTaskCache) {
            init.maxCachesTaskCounter = option.maxTaskCache;
        }

        if (option.maxConnectionOfHost) {
            init.maxConnectionOfHost = option.maxConnectionOfHost;
        }

        if (option.maxConnectionOfModule) {
            init.maxConnectionOfModule = option.maxConnectionOfModule;
        }

    }

    constructor(modules: requsetMoudleList, option: options) {

        super();

        this.modules = modules;



        if (option) {
            this.setOption(option);
        }

    }

    /**
     * 检查缓冲是否有剩余空间容纳该任务
     * 
     * @param task 实现请求任务接口的对象
     */
    public checkCachedTaskSpace(task: Task<unknown, unknown> | Task<unknown, unknown>[]): boolean {

        const init = this.initCounter, runing = this.runingCounter;

        let overSpace = init.maxCachesTaskCounter - runing.cachesTaskCounter;

        task = Array.isArray(task) ? task : [task];

        return overSpace >= task.length;
    }

    /**
     * 检查请求队列中是否有剩余空间的容量
     */
    protected checkruningTaskSpace(): number {

        return this.initCounter.maxConnectionOfGlobal - this.runingCounter.runingTaskQueue.length;
    }

}

// TODO 等待测试

/**
 * 请求包装类,该类复用了实现standardRequset接口的模块
 * 
 * 他把一个请求包装为一个请求任务,而所有的请求任务都是任务组
 * 
 * 这些任务组,通用任务的模块名和主机配置,大大减轻了内存开销和额外的判断
 * 
 * 也就是说传入多个任务,这组任务模块名称和主机配置必须是一样的,如果你的任务内部不一致请拆分成
 * 多个单独的任务,该类内部不会进行任何的额外扫描检查是否一致性,但是如果出现不一致的情况,会导致请求失败
 * 
 * 1. 下个版本展望,根据不同的域名配置指定请求延迟间隔
 * 2. 运行中参数从内部分散的属性,集中到一个对象上 processing
 */
export class RequestManagerPlusPlus extends RequestManagerBase {

    private DelayProxy: ProxyDelayMethod<RequestManagerPlusPlus>;
    private delayTriggerTaskManager: DelayTriggerQueue;
    private requestTimeoutByHost: delayTriggerTimeByHost;

    /**
     * 构建一个多任务多模块请求类
     * @param modules 由多个模块组成的对象,键-模块名称,值模块对象
     * @param option 配置选项
     */
    constructor(modules: requsetMoudleList, option: options = {}) {
        super(modules, option);

        // 挂载延时触发方法类
        this.DelayProxy = new ProxyDelayMethod(this);
        // 将this.process挂载为节流
        this.DelayProxy.setDelayExecuteOnceMethod('process', 50);
        // 挂载方法间隔触发管理器
        this.delayTriggerTaskManager = new DelayTriggerQueue();
        // 注册不同域名下的延时请求
        this.registerDelayRequesst(option.requestTimeoutByhost);
        // 注册内部任务完成后的处理
        this.on('done', (task: TaskInRequestManager) => {

            const runing = this.runingCounter;

            // 更新任务状态
            this.setTaskStatus(task,'done');
            // 剔除该任务从请求队列中
            runing.runingTaskQueue = runing.runingTaskQueue.filter(element => element.id != task.id || element.taskName != task.taskName);
            // 删除任务从缓存Map中
            this.removeTaskInCachedMap(task);
            // 从运行中计数器中减少元素个数
            this.connectionInRuningCounter(task, -1);
            // 扫描是否有任务完成,如果有触发这些完成的任务
            this.ScannedTaskAndTrigger(task.id);
            // 调用process扫描
            this.process();
        });
    }

    private registerDelayRequesst (requestTimeoutByHost:delayTriggerTimeByHost):void{

        if(!requestTimeoutByHost){
            return;
        }

        for (const hostName of Object.keys(requestTimeoutByHost)) {
            this.delayTriggerTaskManager.setTask(hostName, requestTimeoutByHost[hostName], this.request, this);
        }

    }

    private minixTask<T, K>(id: symbol, tasks: Task<T, K>[]): TaskInRequestManager[] {

        for (const task of tasks) {
            task['id'] = id;
        }

        return tasks as TaskInRequestManager[];
    }

    private pushTaskCachedMap(id: symbol, tasks: TaskInRequestManager[]): TaskInRequestManager[] {
        const map = this.TaskCacheMap;

        if (map.has(id)) {

            map.get(id).push(...tasks);
        } else {

            map.set(id, tasks);
        }

        return tasks;
    }

    private removeTaskInCachedMap(task: TaskInRequestManager) {

        let cacheArray = this.TaskCacheMap.get(task.id),
            len = cacheArray.length,
            taskName = task.taskName;

        let result = [];

        while (len-- > 0) {

            if (cacheArray[len].state !== 'done') {
                result.push(cacheArray[len]);
            }

        }

        this.TaskCacheMap.set(task.id, result);
    }

    private pushTaskDoneMap(id: symbol, result, type: 'success' | 'error') {

        const handle = this.TaskDoneMap;
        let initArray = [[], []];

        if (handle.has(id)) {
            initArray = handle.get(id);
        } else {
            handle.set(id, initArray as any);
        }

        if (type == 'success') {
            initArray[0].push(result);
        } else {
            initArray[1].push(result);
        }
    }

    /**
     * 修改缓存Map中所有任务的总数
     * @param num 内部的基数和此数相加
     */
    private CachedTaskTotalPlus(num: number) {
        return this.runingCounter.cachesTaskCounter += num;
    }

    /**
     * 修改运行时内部不同域名下和模块下的连接数
     * 
     * - 两种模式
     *   - 传入数组,使用数组长度指定连接数
     *   - 传入一个任务,使用指定的连接数进行累加
     * 
     * - 注意
     *   - 如果传入TaskInRequestManager[]需要一组数据都为同域名与模块
     * @param task 操作的任务组
     * @param num 内部基数与这个数相加
     */
    private connectionInRuningCounter(task: TaskInRequestManager | TaskInRequestManager[], num?: number): void {

        const runing = this.runingCounter;

        let hostName: string,
            moduleName: string;

        if (Array.isArray(task)) {
            hostName = task[0].hostName;
            moduleName = task[0].useModuleName;
            num = task.length;
        } else {
            hostName = task.hostName,
                moduleName = task.useModuleName;
        }

        if (runing.runingConnectionOfHost[hostName]) {
            runing.runingConnectionOfHost[hostName] += num;
        } else {
            runing.runingConnectionOfHost[hostName] = num;
        }

        if (runing.runingConnectionOfModule[moduleName]) {
            runing.runingConnectionOfModule[moduleName] += num;
        } else {
            runing.runingConnectionOfModule[moduleName] = num;
        }

    }

    setTaskStatus(task: TaskInRequestManager, state: 'cached' | 'init' | 'request' | 'wait' | 'done') {
        task.state = state;
    }

    setTaskStates(tasks:TaskInRequestManager[],state:'cached' | 'init' | 'request' | 'wait' | 'done'){
        for (const task of tasks) {
            this.setTaskStatus(task,state);
        }
    }

    /**
     * 检测给定的任务设置的域名以及模块是否指定了全局连接最大数,如果没有指定则指定默认值
     * 
     * - 警告
     *   - 要求任务是一组任务
     */
    private initialInformation(tasks: TaskInRequestManager[]): TaskInRequestManager[] {

        const init = this.initCounter, runing = this.runingCounter;

        let hostName = tasks[0].hostName,
            moduleName = tasks[0].useModuleName;

        // 设置全局最大连接数
        if (!init.maxConnectionOfHost[hostName]) {
            init.maxConnectionOfHost[hostName] = Infinity;
        }

        if (!init.maxConnectionOfModule[moduleName]) {
            init.maxConnectionOfModule[moduleName] = Infinity;
        }

        // 设置默认连接数
        if (!runing.runingConnectionOfHost[hostName]) {
            runing.runingConnectionOfHost[hostName] = 0;
        }

        if (!runing.runingConnectionOfModule[moduleName]) {
            runing.runingConnectionOfModule[moduleName] = 0;
        }

        // 设置默认状态
        this.setTaskStates(tasks,'init');

        return tasks;
    }

    /**
     * 扫描缓存任务队列中所有的任务组,查看任务是否完成(标志为数组length为0)
     * 
     * 完成删除所有的Map中的内容(缓存队列中和结果队列中),并且触发事件
     */
    private ScannedTaskAndTrigger(id: symbol) {

        const taskArray = this.TaskCacheMap.get(id);

        if (taskArray.length <= 0) {
            const result = this.TaskDoneMap.get(id);
            this.TaskCacheMap.delete(id);
            this.TaskDoneMap.delete(id);
            this.emit(id,result);
        }

    }

    /**
     * 获取指定运行时,域名下和模块下的连接数
     * @param type 获取剩余空间的类型
     * @param propName 该类型下指定属性的名称
     */
    private getLastSpace(type: 'module' | 'host', propName: string): number {
        const init = this.initCounter,
            runing = this.runingCounter;
        let handerOfInit, handerOfRuning;

        if (type == 'host') {

            handerOfInit = init.maxConnectionOfHost;
            handerOfRuning = runing.runingConnectionOfHost;
        } else {

            handerOfInit = init.maxConnectionOfModule;
            handerOfRuning = runing.runingConnectionOfModule;
        }

        const optionNum = handerOfInit[propName];

        const runingNum = handerOfRuning[propName];

        return optionNum - runingNum;

    }

    /**
     * 
     * 传入一组任务,检查这组任务符合全局最大连接剩余空间,且符合模块以及域名下最大请求空间
     * 
     * - 返回值
     *   - false 没有全局请求空间了,或者主机下连接和模块下连接超过最大数
     *   - TaskInRequestManager[] 表示通过校验的任务,返回的都是最后面的任务,同时这些任务从数组中删除
     * 如果够了最大的容量则提前返回内容
     * 
     * 简而言之,返回false忽视,持续调用则返回可通过的内容
     * 
     * - 副作用
     *   - 会将传入的任务组中的具体任务从数组中移除
     * 
     * @param tasks 一组相同的任务,这些任务使用相同的域名和模块
     */
    private getCanBeUseTask(tasks: TaskInRequestManager[]): boolean | TaskInRequestManager[] {

        let result: TaskInRequestManager[] = [];

        function min(...rest: number[]): number {
            let min: number = rest[0];
            rest.forEach((value) => {
                min = value < min ? value : min;
            });
            return min;
        }

        function max(...rest: number[]) {
            let max: number = rest[0];
            rest.forEach((value) => {
                max = value > max ? value : max;
            });
            return max;
        }

        function positiveMin(...rest: number[]): number {
            let positives = rest.filter((value) => {
                return value > 0;
            });

            return min(...positives);
        }

        const hostName = tasks[0].hostName,
            moduleName = tasks[0].useModuleName;

        let spaceOfglobal = this.checkruningTaskSpace(),
            spaceOfHost = this.getLastSpace('host', hostName),
            spaceofModule = this.getLastSpace('module', moduleName);

        // 如果没有空间
        if (spaceOfHost <= 0 || spaceofModule <= 0 || spaceOfglobal <= 0) {
            return false;
        }

        // 这个时候实际上需要的是最小正整数在spaceOfHost和spaceofModule,因为进入的任务组的host和module是一样的

        let len = positiveMin(spaceOfHost, spaceofModule, spaceOfglobal, tasks.length);

        reverseIteration(tasks,len,(task)=>{
            if(task.state == 'init'){
                result.push(task);
                this.setTaskStatus(task,'wait');
            }
        });

        return result;
    }

    /**
     * 调用后自动过滤TaskCacheMap中符合请求条件的任务,返回的任务同时会被从TaskCacheMap剔除
     * 
     * - 注意
     *   - 返回的任务数组可能是空的,当前有可能没有任务符合请求条件
     */
    private taskFilter(): [TaskInRequestManager[]] {

        let result: [TaskInRequestManager[]] = [] as any;

        for (const id of this.TaskCacheMap.keys()) {

            let arr = this.TaskCacheMap.get(id);

            // 此处检查数组的长度防止出现所有任务都被派遣到请求队列中导致的空数组情况.
            if (arr.length) {

                let data = this.getCanBeUseTask(arr);

                // 不用担心是否超过了最大请求数,getCanBeUseTask检测到到达最大上限就会一直返回false
                if (Array.isArray(data) && data.length) {
                    result.push(data as TaskInRequestManager[]);
                }

            }

        }

        return result;
    }


    /**
     * 使用Module获取task中的内容,如果有解析使用解析,将获取的结果按照success和error压入doneMap中,
     * 并触发内部的事件
     * 
     * - 警告
     *   - 只允许被execute方法调用
     * @param module 使用task配置好的请求模块
     * @param task 被module使用的task模块
     */
    private request<responseType, successType>(task: TaskInRequestManager) {

        const moduelName = task.useModuleName,
            hostName = task.hostName,
            module = this.modules[moduelName];

        module.useHostConfig(hostName);


        function settingModule(task: TaskInRequestManager, module: standardRequset<hostNameConfig>): standardRequset<hostNameConfig> {
            if (task.queryUrl) {
                module.useQueryOfUrl(task.queryUrl);
            }

            if (task.query) {
                module.useQuery(task.query)
            }

            if (task.proxy) {
                if (typeof task.proxy == 'string') {
                    module.setProxy(task.proxy);
                } else {
                    module.setProxy();
                }
            }

            if (task.options) {
                module.setRequestOption(task.options);
            }

            return module;
        }

        settingModule(task, module);

        const parseFunction: (data: responseType) => successType | boolean = task.parseFunction,
            that = this,
            id = task.id;

        function then(htmlString: responseType) {

            if (parseFunction) {

                try {
                    
                    const result = parseFunction(htmlString);
                    
                    that.pushTaskDoneMap(id, result, 'success');
                } catch (error) {
                    
                    that.pushTaskDoneMap(id, `Error:解析错误! 任务内容:${task},解析函数:${parseFunction},错误信息:error.`, 'error');
                }

            } else {

                that.pushTaskDoneMap(id, htmlString, 'success');
            }
            module.useHostConfig(hostName);

            // 触发内容完成
            that.emit('done', task);
        }

        function error(error) {
            that.pushTaskDoneMap(id, `Error:请求错误! ${error}`, 'error');

            module.useHostConfig(hostName);
            // 触发内容完成
            that.emit('done', task);
        }

        module.request<Promise<responseType>>().then(then).catch(error);
    }

    /**
     * 将传入的任务组执行
     */
    private execute<responseType, successType>(tasks: TaskInRequestManager[]): void {

        const hostName = tasks[0].hostName;

        for (const task of tasks) {

            if (this.delayTriggerTaskManager.hasTaskQueue(hostName)) {
                this.delayTriggerTaskManager.push(hostName, task);
            } else {
                this.request(task)
            }

        }

    }

    private process<responseType, successType>() {

        let runingOverSpace = this.checkruningTaskSpace();

        if (runingOverSpace >= 1) {

            const readyRequestTask = this.taskFilter();

            if (!readyRequestTask.length) {
                return;
            }

            for (const tasks of readyRequestTask) {
                // 加入请求队列
                this.runingCounter.runingTaskQueue.push(...tasks);
                // 缓存计数器中移除上方任务的数量
                this.CachedTaskTotalPlus(-tasks.length);
                // 运行中计数器
                this.connectionInRuningCounter(tasks);
                // 发送请求
                this.execute<responseType, successType>(tasks);
            }

        }

    }

    /**
     * 将任务元素压入内部的请求队列中,内部的将这些任务进行乱序请求
     * 
     * 当同一组完成后则触发Promise回调,返回的任务不保证顺序
     * 
     * - 警告
     *   - 使用前需要调用checkCachedTaskSpace检查是否有剩余空间,否则会报没有剩余空间错误
     * 
     * - 泛型参数
     *   - responseType 请求返回的类型
     *   - successType 解析成功的类型-如果没有解析函数类型需要设置和responseType一致
     * 
     * - 返回类型
     *   返回一个Promise,Promise.then返回一个数组格式为[successType[],string[]]第一个数组包含所有的正确解析的内容,第二包含所有错误的内容
     * @param task 一组或者一个任务
     */
    pushTask<responseType, successType>(task: Task<successType, responseType> | Task<successType, responseType>[]): Promise<responseArray<successType>> {

        task = Array.isArray(task) ? task : [task];

        return new Promise<responseArray<successType>>((resolve, reject) => {

            if (!this.checkCachedTaskSpace(task)) {
                reject(`Error:no space`);
            }

            const id = Symbol();

            /**
             * 1. 混入
             * 2. 压入缓存栈
             * 3. 初始化全局连接数信息
             * 4. 缓存计数器添加值
             */
            this.CachedTaskTotalPlus(this.initialInformation(this.pushTaskCachedMap(id, this.minixTask(id, task as Task<successType, responseType>[]))).length);

            this.process<responseType, successType>();

            this.once(id, (result: responseArray<successType>) => {

                resolve(result);

            });

        });
    }
}
