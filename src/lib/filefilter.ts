import * as fs from "fs";
import { proisify } from "./proisify";

const readDirPro = proisify(fs.readdir,fs);


/**
 * 文件夹扫描函数,返回Promise,可指定两个参数
 * 
 * - then(result:string[])=>void
 * - catch(error:Error)=>void
 * 
 * @param filePath 读取的文件夹路径
 * @param extendName 文件扩展名
 */
export function fileFilter(filePath:String,extendName:string | boolean = false):Promise<string[]> {
    return new Promise<string[]>((resolve,reject)=>{

        readDirPro(filePath).then((fileNames:string[])=>{

            let result = fileNames.filter((fileName)=>{
                return extendName ? (fileName.split('.').pop() == extendName):!extendName;
            })

            resolve(result);

        }).catch((error)=>{

            reject(error);

        });

    });
}


