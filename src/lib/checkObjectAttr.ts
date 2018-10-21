
/**
 * 检查属性类
 * 
 * 使用该类可以将大量if属性是否存在判断变的扁平化
 */
export class CheckObjectAttr{

    /**
     * 存放对象
     */
    private obj:object;
    /**
     * 存放对象所有的属性
     */
    private objProps:string[];

    /**
     * 构建一个对象属性检查器,构造函数需要明确检查的属性名称
     * 
     * 调用use方法设置被检查的对象
     * 
     * 调用has方法检查是否存在属性
     * 
     * @param attrs 一组明确要被检查的属性
     */
    constructor(private attrs:string[]){}

    /**
     * 检测对象是否有指定的属性,如果有则触发回调函数
     * @param prop 对象属性名
     * @param callback 回调函数,如果存在该属性回调函数会被触发,第一个参数就是被检测的属性
     */
    has(prop:string,callback:(prop)=>void):void{

        // 如果是要检查的属性且被检查的对象有该函数
        if(this.attrs.indexOf(prop)!= -1 && this.objProps.indexOf(prop)!= -1){
            callback(this.obj[prop]);
        }
        callback = null;
    }

    /**
     * 提供一个对象用于has方法检查
     * @param obj 一个对象
     */
    use(obj:object){
        this.obj = obj;
        this.objProps = Object.keys(obj);
    }

}


// test

// let a = {
//     ver:123,
//     proxy:'http://www.baidu.com:2111',
//     foobar:'2000'
// }

// let abc = new CheckObjectAttr(['ver','proxy']);

// abc.use(a);

// abc.has('ver',(ver)=>{
//     console.log(ver);
    
// })

// abc.has('foobar',(foobar)=>{
//     console.log(foobar);
// })