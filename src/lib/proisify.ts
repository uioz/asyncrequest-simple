export interface nodeCallBack {
    (err: Error, ...result: any[]): void;
}

/**
 * 将一个node回调的函数包装为Promise的函数,需要传入两个参数
 * 
 * - 参数格式
 *   - 需要包装的函数体
 *   - 需要挂载的上下文
 * - 使用
 *   - 调用后返回闭包闭包内可以传入实际调用fn的时候传入的参数
 *   - 调用闭包后返回Promise
 *   - then(...args:any[])
 *   - catch(error:Error)
 * 
 * @param fn 符合node规范的回调函数普遍格式如下(...options:any,(error:null|error,...args)=>void)
 * @param receiver fn执行时候需要绑定的上下文
 */
export function proisify(fn:Function, receiver?: object): (...args) => Promise<any> {

    return function (...args) {
        return new Promise(function (resolve, reject) {

            let callback: nodeCallBack = (err, ...rest) => {
                return err ? reject(err) : resolve(...rest)
            }

            fn.apply(receiver, [...args, callback]);
        })
    }
};
