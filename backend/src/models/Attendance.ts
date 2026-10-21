import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceAttributes {
  id: string;
  studentId: string;
  classId: string;
  sectionId?: string | null;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string | null;
  recordedBy: string; // Teacher or Admin who marked attendance
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceCreationAttributes
  extends Optional<AttendanceAttributes, 'id' | 'sectionId' | 'remarks' | 'createdAt' | 'updatedAt'> {}

export class Attendance
  extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes
{
  public id!: string;
  public studentId!: string;
  public classId!: string;
  public sectionId!: string | null;
  public date!: string;
  public status!: AttendanceStatus;
  public remarks!: string | null;
  public recordedBy!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attendance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sectionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
      allowNull: false,
      defaultValue: 'present',
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recordedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
  },
  {
    sequelize,
    tableName: 'attendances',
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'classId', 'date'],
        name: 'unique_student_daily_attendance',
      },
      {
        fields: ['classId', 'date'],
      },
      {
        fields: ['studentId'],
      },
    ],
  }
);

export default Attendance;
