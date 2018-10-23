const { AsyncRequestSync } = require('../dist/asyncrequest-simple.js');

const InitConfig = {
    module: ['request-promise'],
    hostConfigs: {
        'www.baidu.com': {
            headers: {
                Host: "baidu.com",
                'User-Agent': "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:62.0) Gecko/20100101 Firefox/62.0",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                'Accept-Language': "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
                'Accept-Encoding': 'gzip, deflate, br',
                Connection: 'keep-alive',
                'Upgrade-Insecure-Requests': 1,
                Pragma: 'no-cache',
                'Cache-Control': 'no-cache'
            },
            url: 'https://www.baidu.com'
        }
    },
    requestTimeoutByHost: {
        'www.baidu.com': 1000
    }
};

// TODO 编写一个不使用query 一个使用query的内容

const taskGroup = [
    {
        taskName: 'demo1',
        useModuleName: 'request-promise',
        hostName: 'www.baidu.com',
        options: {
            gzip: true
        },
        // 为了方便打印去除了html中的\n和\r
        parseFunction: (data) => {
            let pattern = new RegExp(/[\r|\n]/g);
            return data.replace(pattern, '');
        }
    },
    {
        taskName: 'demo2',
        useModuleName: 'request-promise',
        hostName: 'www.baidu.com',
        queryUrl: 's',
        query: {
            wd: '函数式编程'
        },
        options: {
            gzip: true
        },
        parseFunction: (data) => {
            let pattern = new RegExp(/[\r|\n]/g);
            return data.replace(pattern, '');
        }
    }
]

 function test() {

    const asyncRequestSimple = AsyncRequestSync(InitConfig);

    if (!asyncRequestSimple.checkCachedTaskSpace(taskGroup)) {
        console.log('缓存队列中没有足够的缓存空间');
        return;
    }

    asyncRequestSimple.pushTask(taskGroup).then((result) => {

        const successGroup = result[0];
        const errorGroup = result[1];

        console.log(successGroup);
        console.log(errorGroup);


    }).catch((error) => {

        /**
         * 这里的错误指的是请求模块的本身错误,例如没有联网导致请求模块崩溃等错误.
         * 
         * 又或者是来自于模块内部的错误,例如任务组中含有重复的taskName,亦或者是调用前没有使用checkCachedTaskSpace导致内部缓存队列溢出的错误.
         */

        console.log(error);
    });

}

test();







