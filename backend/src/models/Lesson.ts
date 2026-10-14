import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface LessonAttributes {
  id: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  durationMinutes?: number | null;
  orderIndex: number;
  moduleId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LessonCreationAttributes
  extends Optional<
    LessonAttributes,
    'id' | 'content' | 'videoUrl' | 'durationMinutes' | 'orderIndex' | 'isActive'
  > {}

export class Lesson
  extends Model<LessonAttributes, LessonCreationAttributes>
  implements LessonAttributes
{
  declare id: string;
  declare title: string;
  declare content: string | null;
  declare videoUrl: string | null;
  declare durationMinutes: number | null;
  declare orderIndex: number;
  declare moduleId: string;
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Lesson.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    moduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'modules',
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
    tableName: 'lessons',
    timestamps: true,
    indexes: [
      {
        fields: ['moduleId'],
      },
      {
        fields: ['moduleId', 'orderIndex'],
      },
    ],
  }
);

export default Lesson;
