import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type SubmissionStatus = 'submitted' | 'graded' | 'late' | 'resubmitted';

export interface SubmissionAttributes {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string | null;
  fileUrl?: string | null;
  trackerData?: Record<string, any> | null;
  submittedAt: Date;
  status: SubmissionStatus;
  grade?: number | null;
  feedback?: string | null;
  gradedBy?: string | null;
  gradedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubmissionCreationAttributes
  extends Optional<
    SubmissionAttributes,
    | 'id'
    | 'content'
    | 'fileUrl'
    | 'trackerData'
    | 'submittedAt'
    | 'status'
    | 'grade'
    | 'feedback'
    | 'gradedBy'
    | 'gradedAt'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class Submission
  extends Model<SubmissionAttributes, SubmissionCreationAttributes>
  implements SubmissionAttributes
{
  public id!: string;
  public assignmentId!: string;
  public studentId!: string;
  public content!: string | null;
  public fileUrl!: string | null;
  public trackerData!: Record<string, any> | null;
  public submittedAt!: Date;
  public status!: SubmissionStatus;
  public grade!: number | null;
  public feedback!: string | null;
  public gradedBy!: string | null;
  public gradedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Submission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assignmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'assignments',
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
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trackerData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('submitted', 'graded', 'late', 'resubmitted'),
      allowNull: false,
      defaultValue: 'submitted',
    },
    grade: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gradedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'submissions',
    indexes: [
      {
        unique: true,
        fields: ['assignmentId', 'studentId'],
        name: 'unique_student_assignment_submission',
      },
      {
        fields: ['assignmentId'],
      },
      {
        fields: ['studentId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Submission;
