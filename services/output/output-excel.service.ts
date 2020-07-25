import XLSX, { WorkBook, WorkSheet } from "xlsx";
import { Factory } from "../../models/factory";
import { WorkerReport } from "../../models/worker-report";
import { Worker } from "../../models/worker";
import { formatDate } from "../utils/utils.service";
const COL_ARRAY = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
const DATE_COL=1;
const DATA_WORKING_TIME_COL = 2;
const DATA_OVER_WORKING_TIME_COL = 3;
const DATA_NIGHT_WORKING_TIME_COL = 4;
const DATA_COST_FOOD_COL = 5;
const DATA_HOLIDAY_WORKINGFLG_COL=6;
const DATA_NODE_COL = 7;
const DATE_START_ROW=4;
const DATA_TITLE_ROW=3
const MAX_DATA_COL_COUNT = 7;

export function createWorkerFactoriesReportOuput(workerReports: WorkerReport[], worker: Worker, factories: Factory[], dates: Date[],saveFolder:string) {
    var workBook = XLSX.utils.book_new();
    factories.forEach(factory => {
        var factoryWorkerReports = workerReports.filter(workerReport=>workerReport.factory_uid === factory.uid);
        addWorkerFactoryReport(workBook, factoryWorkerReports, worker, factory, dates);
    });
    XLSX.writeFile(workBook, saveFolder+ worker.seikanji+worker.meikanji+".xlsx");
}

export function addWorkerFactoryReport(workBook:WorkBook,workerReports: WorkerReport[], worker: Worker, factory: Factory, dates: Date[]){
    var sheet = {
        "A1" : {
            v: worker.seikanji+" "+worker.meikanji
        },
        "A2": {
            v:formatDate(dates[0],"yyyy年MM月度")
        },
        "B1": {
            v: formatDate(dates[0], "現場 : "+factory.name)
        }
    };
    addColumnHeaderToJson(sheet);
    setWorkerFactoryReportToSheet(sheet,workerReports,dates);
    setWorkerFactorySheetRef(sheet, dates); 
    addAmountWorkerReportToJson(sheet,dates.length);
    XLSX.utils.book_append_sheet(workBook, sheet, factory.name);
}

export function setWorkerFactorySheetRef( sheet: WorkSheet,  dates: Date[]){
    sheet["!ref"] = "A1:" + getCellID(dates.length - 1 + DATE_START_ROW + 1, MAX_DATA_COL_COUNT); //START_ROW+日数+合計行
}

export function setWorkerFactoryReportToSheet(sheet: WorkSheet, workerReports: WorkerReport[],dates: Date[]):WorkSheet{
    var workerReportIndex: number = -1;
    var workerReport: WorkerReport | undefined;
    var rowIndex = DATE_START_ROW;
    dates.forEach(date=>{
        workerReport = undefined;
        addDateToJson(sheet,date,rowIndex)
        for(let index = workerReportIndex+1;index < workerReports.length; index++){
            if(workerReports[index].ymd.getTime()<date.getTime()){
            } else if (workerReports[index].ymd.getTime() > date.getTime()){
                addNoWorkerReportToJson(sheet,  rowIndex);
                break;
            } else{
                addWorkerReportToJson(sheet, workerReports[index], rowIndex);
                break;
            }
        }
        rowIndex++;
    })
    return sheet;
}

function addColumnHeaderToJson(sheet:WorkSheet){
    sheet[getCellID(DATA_TITLE_ROW, DATA_WORKING_TIME_COL)]={
        t:'s',
        v:'勤務時間',
    };
    sheet[getCellID(DATA_TITLE_ROW, DATA_OVER_WORKING_TIME_COL)] = {
        t: 's',
        v: '残業',
    };
    sheet[getCellID(DATA_TITLE_ROW, DATA_NIGHT_WORKING_TIME_COL)] = {
        t: 's',
        v: '夜間勤務',
    };
    sheet[getCellID(DATA_TITLE_ROW, DATA_COST_FOOD_COL)] = {
        t: 's',
        v: '弁当代',
    };
    sheet[getCellID(DATA_TITLE_ROW, DATA_HOLIDAY_WORKINGFLG_COL)] = {
        t: 's',
        v: '休日出勤',
    };
    sheet[getCellID(DATA_TITLE_ROW, DATA_NODE_COL)] = {
        t: 's',
        v: '備考',
    };
}

function addDateToJson(sheet: WorkSheet, date:Date,rowIndex: number): void {
    sheet[getCellID(rowIndex, DATE_COL)] = {
        t:'d',
        v:date,
        z:"dd(aaa)"
    }
}

function addNoWorkerReportToJson(sheet: WorkSheet,  rowIndex: number,): void {
    sheet[getCellID(rowIndex, DATA_WORKING_TIME_COL)] = {
        t: 'n',
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, DATA_OVER_WORKING_TIME_COL)] = {
        t: 'n',
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, DATA_NIGHT_WORKING_TIME_COL)] = {
        t: 'n',
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, DATA_HOLIDAY_WORKINGFLG_COL)] = {
        t: 'n',
    };
    sheet[getCellID(rowIndex, DATA_COST_FOOD_COL)] = {
        t: 'n',
    };
    sheet[getCellID(rowIndex, DATA_NODE_COL)] = {
        t: 's',
    };
}

export function addWorkerReportToJson(sheet:WorkSheet,workerReport:WorkerReport,rowIndex:number):void{
    sheet[getCellID(rowIndex,  DATA_WORKING_TIME_COL)] = {
        t : 'n',
        v: workerReport.working_time / 1440,
        z:"h:mm"
    };
    sheet[getCellID(rowIndex, DATA_OVER_WORKING_TIME_COL)] = {
        t: 'n',
        v: workerReport.over_working_time / 1440,
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, DATA_NIGHT_WORKING_TIME_COL)] = {
        t: 'n',
        v: workerReport.night_working_time / 1440,
        z: "h:mm"
    };
    if (workerReport.holidayworkflg){
        sheet[getCellID(rowIndex, DATA_HOLIDAY_WORKINGFLG_COL)] = {
            t: 'n',
            v: 1,
        };
    }
    sheet[getCellID(rowIndex,  DATA_COST_FOOD_COL)] = {
        t: 'n',
        v: workerReport.cost_food,
    };
    sheet[getCellID(rowIndex, DATA_NODE_COL)] = {
        t: 's',
        v: workerReport.note,
    };
}

export function addAmountWorkerReportToJson(sheet: WorkSheet,  days:number): void {
    sheet[getCellID(DATE_START_ROW + days, DATE_COL)] = {
        t: 's',
        v:"合計",
    }
    sheet[getCellID(DATE_START_ROW+days, DATA_WORKING_TIME_COL)] = {
        t: 'n',
        z: "[h]:mm",
        f: "SUM(" + getDateRange(days,DATA_WORKING_TIME_COL)+")"
    };
    sheet[getCellID(DATE_START_ROW + days, DATA_OVER_WORKING_TIME_COL)] = {
        t: 'n',
        z: "[h]:mm",
        f: "SUM(" + getDateRange(days, DATA_OVER_WORKING_TIME_COL) + ")"
    };
    sheet[getCellID(DATE_START_ROW + days,  DATA_NIGHT_WORKING_TIME_COL)] = {
        t: 'n',
        z: "[h]:mm",
        f: "SUM(" + getDateRange(days, DATA_NIGHT_WORKING_TIME_COL) + ")"
    };
    sheet[getCellID(DATE_START_ROW + days, DATA_HOLIDAY_WORKINGFLG_COL)] = {
        t: 'n',
        f: "COUNTIF(" + getDateRange(days, DATA_HOLIDAY_WORKINGFLG_COL) + ",1)"
    };
    sheet[getCellID(DATE_START_ROW + days,  DATA_COST_FOOD_COL)] = {
        t: 'n',
        f: "SUM(" + getDateRange(days, DATA_COST_FOOD_COL) + ")"
    };
}

function getDateRange(days:number,colIndex:number):string{
    return getCellID(DATE_START_ROW, colIndex)+":"+getCellID(DATE_START_ROW+days-1,colIndex);
}

function getCellID(rowIndex:number,colIndex:number):string{
    return COL_ARRAY[colIndex]+rowIndex;
}

