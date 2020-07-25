import { Entity, PrimaryColumn, Column, BaseEntity, AfterLoad } from 'typeorm';
import { WorkerReport } from '../models/worker-report';
const DB_INFO = require('config').get("DB");

@Entity({ name: "worker_report" })
export class WorkerReportEntity extends BaseEntity implements WorkerReport {
  constructor(data?:{
    company_uid: string,
    uid: string,
    worker_uid: string,
    ymd: Date,
    factory_uid: string,
    working_time: number,
    over_working_time: number,
    night_working_time: number,
    cost_food: number,
    holidayworkflg:boolean,
    note: string,
    deleteflg: boolean,
    version: number,
    registuser: string
  }){
    super();
    if(data){
      this.uid = data.uid;
      this.company_uid = data.company_uid;
      this.worker_uid = data.worker_uid;
      this.ymd =data.ymd;
      this.factory_uid=data.factory_uid;
      this.working_time = data.working_time;
      this.over_working_time=data.over_working_time;
      this.night_working_time=data.night_working_time;
      this.cost_food = data.cost_food;
      this.note = data.note;
      this.holidayworkflg = data.holidayworkflg;
      this.deleteflg = data.deleteflg;
      this.version = data.version;
      this.registuser = data.registuser
    }else{
      this.uid = '';
      this.company_uid='';
      this.worker_uid='';
      this.ymd = new Date();
      this.factory_uid = '';
      this.working_time=0;
      this.over_working_time = 0;
      this.night_working_time = 0;
      this.cost_food = 0;
      this.holidayworkflg = false;
      this.note='';
      this.deleteflg=false;
      this.version=0;
      this.registuser = DB_INFO.registuser;
    }
  }

  @PrimaryColumn()
  public uid: string;

  @Column()
  public company_uid: string;

  @Column()
  public worker_uid: string;

  @Column()
  public ymd: Date;

  @Column()
  public factory_uid: string;

  @Column()
  public working_time: number;

  @Column()
  public over_working_time: number;

  @Column()
  public night_working_time: number;

  @Column()
  public cost_food: number;


  @Column()
  public holidayworkflg: boolean;

  @Column()
  public note: string

  @Column()
  public deleteflg: boolean;

  @Column()
  public version: number;

  @Column()
  public  registuser: string;

  @Column()
  public   registdatetime: Date = new Date();


  @AfterLoad()
  public   converter() {
    //    this.birthday = new Date(this.birthday);

  }
}
