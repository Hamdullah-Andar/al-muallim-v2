import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SubjectAttributes {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  classId: string;
  teacherId?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubjectCreationAttributes
  extends Optional<
    SubjectAttributes,
    'id' | 'code' | 'description' | 'teacherId' | 'isActive'
  > {}

export class Subject
  extends Model<SubjectAttributes, SubjectCreationAttributes>
  implements SubjectAttributes
{
  declare id: string;
  declare name: string;
  declare code: string | null;
  declare description: string | null;
  declare classId: string;
  declare teacherId: string | null;
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Subject.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    teacherId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'subjects',
    timestamps: true,
    indexes: [
      {
        fields: ['classId'],
      },
      {
        fields: ['teacherId'],
      },
      // Prevent duplicate subject name within the same class
      {
        unique: true,
        fields: ['classId', 'name'],
        name: 'unique_subject_per_class',
      },
    ],
  }
);

export default Subject;
