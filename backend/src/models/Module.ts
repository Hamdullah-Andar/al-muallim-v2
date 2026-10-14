import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ModuleAttributes {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  subjectId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ModuleCreationAttributes
  extends Optional<
    ModuleAttributes,
    'id' | 'description' | 'orderIndex' | 'isActive'
  > {}

export class Module
  extends Model<ModuleAttributes, ModuleCreationAttributes>
  implements ModuleAttributes
{
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare orderIndex: number;
  declare subjectId: string;
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Module.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'modules',
    timestamps: true,
    indexes: [
      {
        fields: ['subjectId'],
      },
      {
        fields: ['subjectId', 'orderIndex'],
      },
    ],
  }
);

export default Module;
