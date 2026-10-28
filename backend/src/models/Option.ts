import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface OptionAttributes {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OptionCreationAttributes
  extends Optional<OptionAttributes, 'id' | 'isCorrect' | 'orderIndex' | 'createdAt' | 'updatedAt'> {}

export class Option
  extends Model<OptionAttributes, OptionCreationAttributes>
  implements OptionAttributes
{
  declare public id: string;
  declare public questionId: string;
  declare public text: string;
  declare public isCorrect: boolean;
  declare public orderIndex: number;
  
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Option.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'options',
    indexes: [
      {
        fields: ['questionId'],
      },
    ],
  }
);

export default Option;
