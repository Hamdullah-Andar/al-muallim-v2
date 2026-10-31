import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export type NotificationType =
  | 'announcement'
  | 'assignment'
  | 'quiz'
  | 'discussion'
  | 'grade'
  | 'system';

export interface NotificationAttributes {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  isRead?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification
  extends Model<NotificationAttributes>
  implements NotificationAttributes
{
  declare public id: string;
  declare public userId: string;
  declare public title: string;
  declare public message: string;
  declare public type: NotificationType;
  declare public link: string | null;
  declare public isRead: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'announcement',
        'assignment',
        'quiz',
        'discussion',
        'grade',
        'system'
      ),
      allowNull: false,
      defaultValue: 'system',
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isRead'] },
    ],
  }
);

export default Notification;