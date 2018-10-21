"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function reverseIteration(arr, count, callback) {
    if (count > arr.length) {
        throw Error('count必须小于arr.length');
    }
    let startPosition = arr.length - count, result = [];
    count = arr.length;
    while (count-- > startPosition) {
        let data = arr[count];
        if (callback) {
            callback(data);
        }
        result.push(data);
    }
    return result;
}
exports.reverseIteration = reverseIteration;
// let abc = ['1','2','3'];
// reverseIteration(abc,2,(data)=>{
//     console.log(data);
// })
