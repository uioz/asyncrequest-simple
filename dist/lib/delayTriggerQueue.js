"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 顺序触发任务队列
 *
 * 这个对象提供的功能类似与方法节流
 *
 * 但是区别在于内部可以有多个命名队列,且每个队列触发的间隔可以不一致
 */
class DelayTriggerQueue {
    constructor() {
        this.taskInf = {};
    }
    /**
     * 检查是否存在指定队列
     * @param queueName 队列名称
     */
    hasTaskQueue(queueName) {
        return !!this.taskInf[queueName];
    }
    /**
     * 设置一组延迟触发任务
     *
     *  - 注意
     *    - 当没有指定上下文则method运行上下文为undefined
     * @param taskName 任务名称
     * @param delayTime 延时触发时间
     * @param method 被运行的函数或者方法
     * @param bind 方法执行时候绑定的执行上下文
     */
    setTask(taskName, delayTime = 10000, method, bind = undefined) {
        this.taskInf[taskName] = {
            setTimeoutId: -1,
            taskQueue: [],
            delayTime: delayTime,
            obj: bind,
            method: method
        };
        this.execute(taskName);
    }
    /**
     * 删除一组任务,调用后立即停止队列中的所有活动,并且在内部删除引用
     * @param queueName 队列名称
     */
    delete(queueName) {
        let taskBody = this.taskInf[queueName];
        clearTimeout(taskBody.setTimeoutId);
        taskBody = null;
        delete this.taskInf[queueName];
    }
    /**
     * 压入任务到指定名称的任务组,没有执行名称的任务组返回false,成功返回true
     * @param queueName 队列名称
     * @param args 参数
     */
    push(queueName, ...args) {
        try {
            this.taskInf[queueName].taskQueue.push(args);
            this.execute(queueName);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    execute(taskName) {
        "use strict";
        let taskBody = this.taskInf[taskName], that = this;
        if (taskBody.taskQueue.length && taskBody.setTimeoutId == -1) {
            taskBody.setTimeoutId = setTimeout(() => {
                const result = taskBody.taskQueue.shift();
                taskBody.setTimeoutId = -1;
                if (result) {
                    taskBody.method.apply(taskBody.obj, result);
                    return that.execute.call(that, taskName);
                }
                else {
                    clearTimeout(taskBody.setTimeoutId);
                }
            }, taskBody.delayTime);
        }
        return;
    }
}
exports.DelayTriggerQueue = DelayTriggerQueue;
// test
// class Abc {
//     say(i) {
//         console.log(i);
//     }
// }
// let ABC = new Abc();
// let delay = new DelayTriggerQueue();
// delay.setTask('abc', 300,ABC.say,ABC);
// let i = 0,len = 100;
// while(i<len){
//     delay.push('abc',i)
//     i++;
// }
