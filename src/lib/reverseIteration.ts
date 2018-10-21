export function reverseIteration<T>(arr:Array<T>, count:number, callback?:(data:T)=>void):Array<T> {

    if (count > arr.length) {
        throw Error('count必须小于arr.length')
    }

    let startPosition = arr.length - count,
        result = [];
    count = arr.length;

    while (count-->startPosition) {

        let data = arr[count]

        if(callback){
            callback(data);
        }

        result.push(data);

    }

    return result;
}

// let abc = ['1','2','3'];

// reverseIteration(abc,2,(data)=>{
//     console.log(data);
// })
