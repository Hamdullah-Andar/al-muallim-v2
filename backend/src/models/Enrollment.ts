import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Class } from './Class';
import { Section } from './Section';

export type EnrollmentStatus = 'active' | 'transferred' | 'graduated' | 'dropped';

class Enrollment extends Model<
  InferAttributes<Enrollment>,
  InferCreationAttributes<Enrollment>
> {
  declare id: CreationOptional<string>;
  declare studentId: ForeignKey<User['id']>;
  declare classId: ForeignKey<Class['id']>;
  declare sectionId: CreationOptional<ForeignKey<Section['id']> | null>;
  declare rollNumber: CreationOptional<string | null>;
  declare status: CreationOptional<EnrollmentStatus>;
  declare enrolledAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Enrollment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sectionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    rollNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'transferred', 'graduated', 'dropped'),
      defaultValue: 'active',
      allowNull: false,
    },
    enrolledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'enrollments',
    timestamps: true,
    indexes: [
      {
        fields: ['studentId'],
      },
      {
        fields: ['classId'],
      },
      {
        fields: ['sectionId'],
      },
      {
        unique: true,
        fields: ['studentId', 'classId'],
        name: 'unique_active_student_class',
      },
    ],
  }
);

export default Enrollment;
