import * as fs from "fs";
import { proisify } from "./proisify";

const writeFilePro = proisify(fs.writeFile, fs);
const readFilePro = proisify(fs.readFile, fs);

export interface simpleCache<R> {
    has(key: string): boolean;
    get(key: string): R | void;
    set(obj: { [keyName: string]: R }): number;
    remove(key: string): boolean;
}

export class SimpleCacheByJson<R> implements simpleCache<R> {

    protected cache: object = {};
    protected keys: Set<string> = new Set();
    protected isWrited: number = -1;

    /**
     * 简单的JSON文件缓存模块 实现了simpleCache接口
     * 
     * **注意**
     * 本类提供的方法都是同步的,但是初始化时候的文件读取是异步的
     * 
     * 所以不可以一开始上来就获取内容,这样做是无效的
     * @param filePath json文件的路径
     * @param delayTime 延迟写入的时间
     */
    constructor(protected filePath: string,protected delayTime:number = 5000) {

        this.getCaches().catch((error: Error) => {
            throw error;
        });

    }

    protected async getCaches() {

        let jsonRaw: string = await readFilePro(this.filePath);

        this.cache = JSON.parse(jsonRaw);
        this.keys = new Set(Object.keys(this.cache));

    }

    protected flashBuffer() {

        // 函数节流

        if (this.isWrited != -1) {
            clearTimeout(this.isWrited);
        }

        this.isWrited = setTimeout(() => {

            writeFilePro(this.filePath, JSON.stringify(this.cache))
                .then(() => {
                    this.isWrited = -1;
                })
                .catch(() => {

                });

        }, this.delayTime) as any;

    }

    has(key) {
        return this.keys.has(key);
    }

    get(key) {
        return this.keys.has(key) ? this.cache[key] : undefined;
    }

    set(obj: { [keyName: string]: R }) {

        let sum = 0;

        for (const key in obj) {

            if (!this.keys.has(key)) {

                this.keys.add(key);
                this.cache[key] = obj[key];
                sum++;
            }

        }

        if (!sum) {
            return 0;
        }

        this.flashBuffer();

        return sum;
    }

    remove(key) {

        if (!this.keys.has(key)) {
            return false;
        }

        delete this.cache[key];
        this.keys.delete(key);

        this.flashBuffer();
        return true;

    }

}

