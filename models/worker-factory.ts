
export interface WorkerFactoryFlat {
    company_uid: string,
    worker_uid: string,
    ym: string,
    factory_uid : string,
    seq    :number

}

export interface WorkerFactory{
    company_uid: string,
    worker_uid: string,
    ym: string,
    factory_uids: string[],
}

export function groupByWorkerYM(workerFactoryFlats: WorkerFactoryFlat[]): WorkerFactory[]{
    var resultMap: { [key: string]: WorkerFactory}={};
    workerFactoryFlats.forEach(data=>{
        var key = data.worker_uid+""+data.ym;
        if(resultMap[key]){
            resultMap[key].factory_uids.push(data.factory_uid);
        }else{
            resultMap[key]={
                company_uid  : data.company_uid,
                worker_uid : data.worker_uid,
                ym         : data.ym,
                factory_uids:[data.factory_uid]
            }
        }
    })
    var result: WorkerFactory[] = [];
    for (let key in resultMap){
        result.push(resultMap[key]);
    }
    return result;
}