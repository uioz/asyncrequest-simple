
class MethodStack<T> {

    private obj:T;
    private stack:{
        [propName:string]:{
            method:any;
            argsArray:Array<any>;
            timeOutId:any;
        }
    } = {};

    setMethod(propName:string){

        this.stack[propName] = {
            method:this.obj[propName],
            argsArray:[],
            timeOutId:-1
        }

        const hander = this.stack[propName];

        this.obj[propName] = (...args)=>{

            hander.argsArray.push(...args);

            if()
            
        }

    }

}