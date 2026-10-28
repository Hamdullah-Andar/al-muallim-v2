import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AttemptStatus = 'in_progress' | 'completed';

export interface AnswerItem {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface QuizAttemptAttributes {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  isPassed: boolean;
  answers: AnswerItem[];
  startedAt: Date;
  completedAt?: Date | null;
  status: AttemptStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuizAttemptCreationAttributes
  extends Optional<
    QuizAttemptAttributes,
    'id' | 'score' | 'totalPoints' | 'percentage' | 'isPassed' | 'completedAt' | 'status' | 'createdAt' | 'updatedAt'
  > {}

export class QuizAttempt
  extends Model<QuizAttemptAttributes, QuizAttemptCreationAttributes>
  implements QuizAttemptAttributes
{
  declare public id: string;
  declare public quizId: string;
  declare public studentId: string;
  declare public score: number;
  declare public totalPoints: number;
  declare public percentage: number;
  declare public isPassed: boolean;
  declare public answers: AnswerItem[];
  declare public startedAt: Date;
  declare public completedAt: Date | null;
  declare public status: AttemptStatus;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

QuizAttempt.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'quizzes',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'completed',
    },
  },
  {
    sequelize,
    tableName: 'quiz_attempts',
    indexes: [
      {
        fields: ['quizId'],
      },
      {
        fields: ['studentId'],
      },
    ],
  }
);

export default QuizAttempt;
