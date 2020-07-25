
export interface WorkerReport {
    company_uid     : string,
    uid             : string,
    worker_uid      : string,
    ymd             : Date,
    factory_uid     : string,
    working_time    : number,
    over_working_time: number,
    night_working_time: number,
    cost_food       : number,
    holidayworkflg  : boolean,
    note            : string,
    deleteflg       : boolean,
    version         : number
}

export function extractWorkerReport(workerReport: WorkerReport): WorkerReport{
        return {
            company_uid                 : workerReport.company_uid,
            uid                         : workerReport.uid,
            worker_uid                  : workerReport.worker_uid,
            ymd                         : workerReport.ymd,
            factory_uid                 : workerReport.factory_uid,
            working_time                : workerReport.working_time,
            over_working_time           : workerReport.over_working_time,
            night_working_time          : workerReport.night_working_time,
            cost_food                   : workerReport.cost_food,
            holidayworkflg              : workerReport.holidayworkflg,
            note                        : workerReport.note,
            deleteflg                   : workerReport.deleteflg,
            version                     : workerReport.version,
        }
}

export function extractWorkerReports(workerReports: WorkerReport[]): WorkerReport[]{
    return workerReports.map(workerReport => extractWorkerReport(workerReport));
}