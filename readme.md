# 简介

这是一个Node模块.

一个单线程的异步请求模块使用`TypeScript`进行编写.

支持使用多个请求模块作为基础请求模块,内部使用的默认请求模块是基于`request`制作的.

该模块主要用于大批量的爬虫或者请求的获取.对于简单的任务相当有效,他将类似的任务进行合并且内部大量使用防抖和节流.

触发几十个请求但实际内部逻辑的执行也不过才几次.

该模块可以做如下的配置:
- 使用不同模块进行请求(默认提供和使用`request`模块)
- 全局连接数量限制
- 不同模块不同域名下连接数量限制
- 不同域名下间隔请求时间设置
- 最大并发请求数和最大缓存设置

**注意**:该模块初始化的时候返回一个Promise.

**注意**:个人项目不保证稳定性.

# 安装和使用

```
git clone https://github.com/uioz/asyncrequest-simple

cd asyncrequest-simple

npm install
```

# api

由于使用TypeScript这里直接提供定义的类型文件即可.

入口文件使用:
- 构建版本
```
const {AsyncRequestSimple} = require('./dist/asyncrequest-simple.js');

// OR

const a = require('./dist/asyncrequest-simple.js').AsyncRequestSimple;
```
- TypeScript版本
```
import {AsyncRequestSimple} from './src/asyncrequest-simple';
```

## 初始化
```
import AsyncRequestSimple from './src/asyncrequest-simple';

async function ready() {

    const asyncRequestSimple = await AsyncRequestSimple(/*域名配置*/,/*请求配置*/);

}

ready();
```

- 域名配置

该配置定义如下:
```
interface configs {
    // 可以使用的模块(由模块名称组成的数组)
    ["module"]: Array<string>;
    // 不同域名下的基础配置
    ["hostConfigs"]?: {
        // 域名
        ['hostName']:{
            // 基础url
            url: string;
            // 由键值对组成的请求头
            headers?: object;
            // 该域名下的代理
            proxy?: string;
            // 基础查询,这个不建议使用,建议在请求任务中配置它
            query?:any;
        }
    }
    // 全局代理目前仅支持http代理,实际上request只支持http代理
    ["proxy"]?: string;
    // 不同域名下延时请求的间隔,默认为0
    ["requestTimeoutByHost"]?:{
        [hostName:string]:number;
    }
    // 没有用途的属性,用于获取不同平台下的启动目录下的绝对路径
    // 功能完好但是内部没有使用,建议不指定
    ["rootPath"]: {
        linux?: string,
        win?: string
    }
}
```
该配置可以保存到文件中如果想使用外部配置则直接传入文件的绝对路径即可这也是返回Promise的原因.

同时该选项也支持传入对象,该对象的格式需要和外部文件格式一致.

- 请求配置

定义如下:
```
interface options {
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
    requestTimeoutByhost?:{
        [hostName:string]:number;
    }
    /**
     * 任务队列最大缓存数,默认最大200
     */
    maxTaskCache?: number;
}
```
这个选项可以不传入,需要注意的是这里的`requestTimeoutByhost`会覆盖配置文件中的`requestTimeoutByhost`.

## 使用

使用的api设计的非常简单,只提供了两个方法,其中一个还是用于校验的,另外一个方法才是用于请求.

首先我们把一个请求任务定义为如下格式:
```
/**
 * 标准任务接口
 *
 * - 泛型参数
 *   - T 指定解析函数返回的类型,如果没有解析函数,类型设置和K一致
 *   - K 指定解析函数接受的类型(请求返回的类型)
 */
interface Task<T, K> extends parseFuncction<T, K> {
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
```

接下来就相当简单了任务可以分为单个任务`single Task`和任务组`Task Group`,也就是一个任务对象和一个任务对象数组.

`asyncrequest-simple`接受这两种格式,并且返回一个Promise.

方法使用如下:
```
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
pushTask<responseType, successType>(task: Task<successType, responseType> | Task<successType, responseType>[]): Promise<responseArray<successType>> {}
```

**注意**:该方法使用前一定要调用另外一个方法`checkCachedTaskSpace`(这就是第二个api)检测是否有剩余空间,否则内部的最大缓存数失效后就会有逻辑bug.

如果不想要缓存限制可以在初始化配置中将最大缓存数设置为`inifity`.

## 起手和测试

在test文件夹中的test.js中有该项目的使用测试,你可以在那里获取他的简单使用.
