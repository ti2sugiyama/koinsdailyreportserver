
export interface Worker {
    company_uid: string,
    uid: string,
    id:string,
    seikanji: string,
    meikanji: string,
    subcontractor:boolean,
    deleteflg: boolean,
    version: number
}

export function extractWorker(worker: Worker):Worker{
    return {
            company_uid: worker.company_uid,
            uid:worker.uid,
            id:worker.id,
            seikanji : worker.seikanji,
            meikanji:worker.meikanji,
            subcontractor:worker.subcontractor,
            deleteflg:worker.deleteflg,
            version:worker.version
        }
}

export function extractWorkers(workers:Worker[]):Worker[]{
    return workers.map(worker=>extractWorker(worker));
}