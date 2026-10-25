import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AssignmentType = 'standard' | 'prayer' | 'zikr' | 'quran';

export interface AssignmentAttributes {
  id: string;
  title: string;
  description?: string | null;
  type: AssignmentType;
  classId: string;
  subjectId?: string | null;
  dueDate: Date;
  totalPoints: number;
  trackerConfig?: Record<string, any> | null;
  creatorId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssignmentCreationAttributes
  extends Optional<
    AssignmentAttributes,
    'id' | 'description' | 'subjectId' | 'type' | 'totalPoints' | 'trackerConfig' | 'isActive' | 'createdAt' | 'updatedAt'
  > {}

export class Assignment
  extends Model<AssignmentAttributes, AssignmentCreationAttributes>
  implements AssignmentAttributes
{
  public id!: string;
  public title!: string;
  public description!: string | null;
  public type!: AssignmentType;
  public classId!: string;
  public subjectId!: string | null;
  public dueDate!: Date;
  public totalPoints!: number;
  public trackerConfig!: Record<string, any> | null;
  public creatorId!: string;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Assignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('standard', 'prayer', 'zikr', 'quran'),
      allowNull: false,
      defaultValue: 'standard',
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
    subjectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subjects',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    trackerConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'assignments',
    indexes: [
      {
        fields: ['classId'],
      },
      {
        fields: ['subjectId'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['dueDate'],
      },
    ],
  }
);

export default Assignment;
