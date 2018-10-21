import { AnyARecord } from "dns";

/**
 * 简单的Map代理类
 * 
 * 提供size属性保存通过set添加的所有元素的内容个数
 */
export class ProxyMap<key>{

    public size: number = 0;

    constructor(private element: Map<key, Array<any>>) { }

    set(key: key, value: any) {

        if(this.element.has(key)){
            this.size -= this.element.get(key).length;
            this.element.delete(key);
        }

        if (Array.isArray(value)) {
            this.size += value.length;
        } else {
            this.size++;
            this.element.set(key, [value]);
            return;
        }
        this.element.set(key, value);
    }

    has(key: key): boolean {
        return this.element.has(key);
    }

    get(key: key){

        return this.element.get(key);
    }

    delete(key: key): boolean {

        try {
            const value = this.element.get(key);

            if (Array.isArray(value)) {
                this.size -= value.length;
            } else {
                this.size--;
            }
        } catch (error) {
            return false;
        }

        return this.element.delete(key);
    }

    push<element extends Array<any>>(key:key,content:element){

        try {
            const len = content.length;

            if(len<=0){
                return false;
            }

            this.element.get(key).push(...content);
            this.size+=len;
            return true;
        } catch (error) {
            return false;
        }
    }

}

// test

// let map = new Map<string,number[]>();

// const proxyMap = new ProxyMap(map);


// proxyMap.set('hello',[1,2,3,4,5,6])
// proxyMap.set('world',[1,2,3,4,5,6])

// console.log(proxyMap.size);

