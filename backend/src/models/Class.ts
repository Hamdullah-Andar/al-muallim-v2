import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ClassAttributes {
  id: string;
  name: string;
  gradeLevel?: number | null;
  academicYear?: string;
  description?: string | null;
  classTeacherId?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClassCreationAttributes
  extends Optional<
    ClassAttributes,
    'id' | 'gradeLevel' | 'academicYear' | 'description' | 'classTeacherId' | 'isActive'
  > {}

export class Class
  extends Model<ClassAttributes, ClassCreationAttributes>
  implements ClassAttributes
{
  declare id: string;
  declare name: string;
  declare gradeLevel: number | null;
  declare academicYear: string;
  declare description: string | null;
  declare classTeacherId: string | null;
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Class.init(
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
    gradeLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    academicYear: {
      type: DataTypes.STRING(20),
      defaultValue: '2026-2027',
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    classTeacherId: {
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
    tableName: 'classes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['name', 'academicYear'],
        name: 'unique_class_per_academic_year',
      },
    ],
  }
);

export default Class;
