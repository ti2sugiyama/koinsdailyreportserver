
export interface TeamWorkerFlat {
    company_uid: string,
    team_uid: string,
    worker_uid: string,
    seq    :number
}

export interface TeamWorker{
    company_uid: string,
    team_uid: string,
    worker_uids: string[]
}

export function groupByTeam(teamWorkerFlats: TeamWorkerFlat[]): TeamWorker[]{
    var resultMap: { [key: string]: TeamWorker}={};
    teamWorkerFlats.forEach(data=>{
        if (resultMap[data.team_uid]){
            resultMap[data.team_uid].worker_uids.push(data.worker_uid);
        }else{
            resultMap[data.team_uid]={
                company_uid  : data.company_uid,
                team_uid : data.team_uid,
                worker_uids:[data.worker_uid]
            }
        }
    })
    var result: TeamWorker[] = [];
    for (let key in resultMap){
        result.push(resultMap[key]);
    }
    return result;
}