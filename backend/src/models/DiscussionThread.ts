import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface DiscussionThreadAttributes {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  classId?: string | null;
  subjectId?: string | null;
  lessonId?: string | null;
  isPinned?: boolean;
  isLocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DiscussionThread
  extends Model<DiscussionThreadAttributes>
  implements DiscussionThreadAttributes
{
  declare public id: string;
  declare public title: string;
  declare public content: string;
  declare public authorId: string;
  declare public classId: string | null;
  declare public subjectId: string | null;
  declare public lessonId: string | null;
  declare public isPinned: boolean;
  declare public isLocked: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

DiscussionThread.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    authorId: {
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
      allowNull: true,
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
    lessonId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'lessons',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'discussion_threads',
    timestamps: true,
    indexes: [
      { fields: ['classId'] },
      { fields: ['lessonId'] },
      { fields: ['authorId'] },
    ],
  }
);

export default DiscussionThread;