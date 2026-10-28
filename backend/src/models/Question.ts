import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type QuestionType = 'multiple_choice' | 'true_false';

export interface QuestionAttributes {
  id: string;
  quizId: string;
  text: string;
  type: QuestionType;
  points: number;
  explanation?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestionCreationAttributes
  extends Optional<QuestionAttributes, 'id' | 'type' | 'points' | 'explanation' | 'createdAt' | 'updatedAt'> {}

export class Question
  extends Model<QuestionAttributes, QuestionCreationAttributes>
  implements QuestionAttributes
{
  declare public id: string;
  declare public quizId: string;
  declare public text: string;
  declare public type: QuestionType;
  declare public points: number;
  declare public explanation: string | null;
  
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Question.init(
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
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('multiple_choice', 'true_false'),
      allowNull: false,
      defaultValue: 'multiple_choice',
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'questions',
    indexes: [
      {
        fields: ['quizId'],
      },
    ],
  }
);

export default Question;
