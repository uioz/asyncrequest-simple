"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 本类提供了方法节流和方法防抖的支持
 */
class ProxyDelayMethod {
    /**
     * 该类首先是个代理类,他拥有将构造函数中对象方法替换掉的能力
     *
     * 使用代理方法的时候,不会修改原方法的名称以及调用时候的参数
     *
     * 基本规则是调用提供的方法,指定原对象方法名称然后启用代理
     *
     * - 不支持带有返回值的方法,会丢失返回值
     * @param object 任意一个对象
     * @param baseTime 延时触发时间
     */
    constructor(object, baseTime) {
        this.baseTime = 200;
        this.throttle = {};
        this.debounce = {};
        this.executeOnceMethod = {};
        this.obj = object;
        if (baseTime) {
            this.baseTime = baseTime;
        }
    }
    /**
     * 设置方法节流
     *
     * 指定后,后续调用时间与上一次时间只差小于指定的时间则不会执行
     *
     * @param propName 方法名称
     * @param delayTime 超时时间,多少时间后执行
     */
    setDebounceMethods(propName, delayTime) {
        this.debounce[propName] = {
            method: this.obj[propName],
            delayTime: delayTime ? delayTime : this.baseTime,
            timeoutId: -1,
            argsArray: [],
            lastTime: new Date()
        };
        const that = this.obj;
        this.obj[propName] = (...args) => {
            let hander = this.debounce[propName];
            // 1. 将参数压栈
            hander.argsArray.push(args);
            // 2. 如果当前时间在禁止触发时间内返回并且设置新的时间
            const dateNow = new Date();
            if (dateNow - hander.lastTime < hander.delayTime) {
                clearTimeout(hander.timeoutId);
            }
            hander.timeoutId = setTimeout(() => {
                let i = 0, len = hander.argsArray.length;
                while (i < len) {
                    hander.method.apply(that, hander.argsArray.shift());
                    i++;
                }
                hander.lastTime = dateNow;
            }, hander.delayTime);
        };
    }
    /**
     * 标准的函数节流,用于方法
     *
     * 传入的方法不能有外部依赖即参数和返回值
     *
     * 例如这个方法扫描或者做一些检查的时候,可以交由这个方法代理执行
     * @param propName 方法名称
     * @param delayTime 超时时间,多少时间后执行
     */
    setDelayExecuteOnceMethod(propName, delayTime) {
        this.executeOnceMethod[propName] = {
            method: this.obj[propName],
            delayTime: delayTime ? delayTime : this.baseTime,
            timeoutId: -1,
            lastTime: new Date()
        };
        const that = this.obj;
        this.obj[propName] = () => {
            const hander = this.executeOnceMethod[propName];
            const dateNow = new Date();
            if (dateNow - hander.lastTime < hander.delayTime) {
                clearTimeout(hander.timeoutId);
            }
            hander.lastTime = dateNow;
            hander.timeoutId = setTimeout(() => {
                hander.timeoutId = -1;
                hander.method.apply(that);
            }, hander.delayTime);
        };
    }
    /**
     * 设置方法防抖
     *
     * 指定后,多次调用该方法,该方法总是会沿着指定的间隔时间触发
     *
     * @param propName 方法名称
     * @param delayTime 间隔触发时间
     */
    setThrottleMethods(propName, delayTime) {
        this.throttle[propName] = {
            method: this.obj[propName],
            delayTime: delayTime ? delayTime : this.baseTime,
            argsArray: [],
            timeoutId: -1
        };
        // 给对象方法重新赋值
        this.obj[propName] = (...args) => {
            let hander = this.throttle[propName];
            // 1. 将参数压栈
            hander.argsArray.push(args);
            // 2. 如果已经触发延时退出程序
            if (hander.timeoutId != -1) {
                return;
            }
            const that = this.obj;
            // 3. 循环调用函数
            function call(that, hander, obj) {
                "use strict";
                return hander.timeoutId = setTimeout(() => {
                    // 如果有内容就继续处理
                    if (hander.argsArray.length) {
                        hander.method.apply(obj, hander.argsArray.shift());
                        return call.call(that, hander, obj);
                    }
                    else {
                        clearTimeout(hander.timeoutId);
                        hander.timeoutId = -1;
                    }
                }, hander.delayTime);
            }
            return call.call(this, that, hander, this.obj);
        };
    }
}
exports.ProxyDelayMethod = ProxyDelayMethod;
