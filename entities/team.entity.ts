import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';
import { Team } from '../models/team';
const DB_INFO = require('config').get("DB");

@Entity({ name: "team" })
export class TeamEntity extends BaseEntity implements Team {
  constructor(data?: {
    uid: string,
    company_uid: string,
    name : string,
    deleteflg: boolean,
    version: number,
    registuser: string
  }) {
    super();
    if (data) {
      this.uid = data.uid;
      this.company_uid = data.company_uid;
      this.name = data.name,
      this.deleteflg = data.deleteflg;
      this.version = data.version;
      this.registuser=data.registuser;
    } else {
      this.uid = '';
      this.company_uid = '';
      this.name  = '';
      this.deleteflg = false;
      this.version = 0;
      this.registuser = DB_INFO.registuser;
    }
  }

  @PrimaryColumn()
  public uid: string;

  @Column()
  public company_uid: string = '';

  @Column()
  public name: string = '';

  @Column()
  public deleteflg: boolean = false;

  @Column()
  public version: number = 0;

  @Column()
  public registuser: string ;
  @Column()
  public registdatetime: Date = new Date();
}
