import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface QuizAttributes {
  id: string;
  title: string;
  description?: string | null;
  classId: string;
  subjectId?: string | null;
  creatorId: string;
  timeLimitMinutes?: number | null; // e.g., 30 mins (null for unlimited)
  passingScore: number; // e.g., 60%
  totalPoints: number; // e.g., 100 points
  dueDate?: Date | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuizCreationAttributes
  extends Optional<
    QuizAttributes,
    'id' | 'description' | 'subjectId' | 'timeLimitMinutes' | 'passingScore' | 'totalPoints' | 'dueDate' | 'isActive' | 'createdAt' | 'updatedAt'
  > {}

export class Quiz
  extends Model<QuizAttributes, QuizCreationAttributes>
  implements QuizAttributes
{
  declare public id: string;
  declare public title: string;
  declare public description: string | null;
  declare public classId: string;
  declare public subjectId: string | null;
  declare public creatorId: string;
  declare public timeLimitMinutes: number | null;
  declare public passingScore: number;
  declare public totalPoints: number;
  declare public dueDate: Date | null;
  declare public isActive: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Quiz.init(
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
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    timeLimitMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30,
    },
    passingScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'quizzes',
    indexes: [
      {
        fields: ['classId'],
      },
      {
        fields: ['subjectId'],
      },
    ],
  }
);

export default Quiz;
