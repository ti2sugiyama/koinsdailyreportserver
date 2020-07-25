import { Entity, PrimaryColumn, Column, BaseEntity, AfterLoad } from 'typeorm';
import { TeamWorkerFlat } from '../models/team-worker';
const DB_INFO = require('config').get("DB");

@Entity({ name: "team_worker" })
export class TeamWorkerEntity extends BaseEntity implements TeamWorkerFlat{
  constructor(data?:{
    company_uid:string,
    team_uid: string,
    worker_uid: string,
    seq: number,
    registuser: string
  }){
    super();
    if(data){
      this.company_uid = data.company_uid;
      this.team_uid = data.team_uid;
      this.worker_uid = data.worker_uid;
      this.seq = data.seq;
      this.registuser =data.registuser;
    }else{
      this.company_uid = '';
      this.team_uid = '';
      this.worker_uid = '';
      this.seq = 0;
      this.registuser = DB_INFO.registuser;
    }
    this.deleteflg = false;
    this.version = 0;
  }

  @Column()
  public company_uid: string;

  @PrimaryColumn()
  public team_uid: string;

  @PrimaryColumn()
  public worker_uid: string;

  @Column()
  public seq: number;

  @Column()
  public deleteflg: boolean;

  @Column()
  public version: number;

  @Column()
  public registuser: string;

  @Column()
  public registdatetime: Date = new Date();


  @AfterLoad()
  converter() {
    //    this.birthday = new Date(this.birthday);

  }
}
