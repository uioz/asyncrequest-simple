import { readFile } from "fs";

/**
 * 单文件加载接口
 */
export interface loadFile<T> {
    setPath(filePath:string):this;
    getPath(filePath:string):string;
    getFile():Promise<T>
}


export class LoadJson<T> implements loadFile<T> {
    
    /**
     * 简单的JSON读取器
     * @param filePath 路径字符串
     */
    constructor(protected filePath:string = ''){

    }

    setPath(filePath:string):this{

        this.filePath = filePath;

        return this;
    }

    getPath():string{

        return this.filePath;
    }

    /**
     * 调用以Promise的形式返回JSON的内容
     * 
     * 有任何解析或者执行错误则将原来的报错信息利用catch输出
     */
    getFile(){

        return new Promise<T>((resolve,reject)=>{

            readFile(this.filePath,{encoding:'utf8'},(error,data)=>{

                if(!error){

                    try {

                        resolve(JSON.parse(data) as T);
                        
                    } catch (error) {

                        reject(error);
                    }
                }

                reject(error);
            });

        });

    }
}
