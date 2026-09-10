import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 1. Define the attributes our User will have
export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
  avatar?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Define which attributes are optional when creating a new user (id is auto-generated)
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'role' | 'isActive' | 'avatar' | 'phone'> {}

// 3. Define the User Model class
export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'student' | 'teacher' | 'admin' | 'parent';
  public avatar!: string | null;
  public phone!: string | null;
  public isActive!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4. Initialize the model with PostgreSQL table schema
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'teacher', 'admin', 'parent'),
      allowNull: false,
      defaultValue: 'student',
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
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
    tableName: 'users',
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);
