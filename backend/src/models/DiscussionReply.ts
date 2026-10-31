import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface DiscussionReplyAttributes {
  id?: string;
  threadId: string;
  authorId: string;
  parentReplyId?: string | null;
  content: string;
  isEndorsed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DiscussionReply
  extends Model<DiscussionReplyAttributes>
  implements DiscussionReplyAttributes
{
  declare public id: string;
  declare public threadId: string;
  declare public authorId: string;
  declare public parentReplyId: string | null;
  declare public content: string;
  declare public isEndorsed: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

DiscussionReply.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    threadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'discussion_threads',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    parentReplyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'discussion_replies',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isEndorsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'discussion_replies',
    timestamps: true,
    indexes: [
      { fields: ['threadId'] },
      { fields: ['parentReplyId'] },
      { fields: ['authorId'] },
    ],
  }
);

export default DiscussionReply;