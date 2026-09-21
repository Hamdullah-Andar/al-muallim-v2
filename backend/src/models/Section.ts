import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SectionAttributes {
  id: string;
  name: string;
  classId: string;
  roomNumber?: string | null;
  capacity?: number | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SectionCreationAttributes
  extends Optional<SectionAttributes, 'id' | 'roomNumber' | 'capacity' | 'isActive'> {}

export class Section
  extends Model<SectionAttributes, SectionCreationAttributes>
  implements SectionAttributes
{
  declare id: string;
  declare name: string;
  declare classId: string;
  declare roomNumber: string | null;
  declare capacity: number | null;
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Section.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, // e.g. "Section A", "Morning Cohort"
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
      onDelete: 'CASCADE', // If a class is deleted, delete its sections too!
    },
    roomNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'sections',
    timestamps: true,
  }
);
