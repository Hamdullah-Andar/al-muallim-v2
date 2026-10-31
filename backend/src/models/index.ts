import { sequelize } from '../config/database';
import { User } from './User';
import { Class } from './Class';
import { Section } from './Section';
import Enrollment from './Enrollment';
import Subject from './Subject';
import Module from './Module';
import Lesson from './Lesson';
import Attendance from './Attendance';
import Submission from './Submission';
import Assignment from './Assignment';
import Quiz from './Quiz';
import Question from './Question';
import QuizAttempt from './QuizAttempt';
import Option from './Option';
import DiscussionThread from './DiscussionThread';
import DiscussionReply from './DiscussionReply';
import Notification from './Notification';

// ==========================================
// 1. User (Teacher) <-> Class Relationships
// ==========================================
User.hasMany(Class, {
  foreignKey: 'classTeacherId',
  as: 'managedClasses',
});
Class.belongsTo(User, {
  foreignKey: 'classTeacherId',
  as: 'teacher',
});

// ==========================================
// 2. Class <-> Section Relationships
// ==========================================
Class.hasMany(Section, {
  foreignKey: 'classId',
  as: 'sections',
  onDelete: 'CASCADE',
});
Section.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class',
});

// ==========================================
// 3. User (Student) <-> Enrollment Relationships
// ==========================================
User.hasMany(Enrollment, {
  foreignKey: 'studentId',
  as: 'enrollments',
  onDelete: 'CASCADE',
});
Enrollment.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student',
});

// ==========================================
// 4. Class <-> Enrollment Relationships
// ==========================================
Class.hasMany(Enrollment, {
  foreignKey: 'classId',
  as: 'enrollments',
  onDelete: 'CASCADE',
});
Enrollment.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class',
});

// ==========================================
// 5. Section <-> Enrollment Relationships
// ==========================================
Section.hasMany(Enrollment, {
  foreignKey: 'sectionId',
  as: 'enrollments',
  onDelete: 'SET NULL',
});
Enrollment.belongsTo(Section, {
  foreignKey: 'sectionId',
  as: 'section',
});

// ==========================================
// 6. Many-to-Many: Student <-> Class (through Enrollment)
// ==========================================
User.belongsToMany(Class, {
  through: Enrollment,
  foreignKey: 'studentId',
  otherKey: 'classId',
  as: 'enrolledClasses',
});
Class.belongsToMany(User, {
  through: Enrollment,
  foreignKey: 'classId',
  otherKey: 'studentId',
  as: 'students',
});

// ==========================================
// 7. Class <-> Subject Relationships
// ==========================================
Class.hasMany(Subject, {
  foreignKey: 'classId',
  as: 'subjects',
  onDelete: 'CASCADE',
});
Subject.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class',
});

// ==========================================
// 8. User (Teacher) <-> Subject Relationships
// ==========================================
User.hasMany(Subject, {
  foreignKey: 'teacherId',
  as: 'taughtSubjects',
  onDelete: 'SET NULL',
});
Subject.belongsTo(User, {
  foreignKey: 'teacherId',
  as: 'teacher',
});

// ==========================================
// 9. Subject <-> Module Relationships
// ==========================================
Subject.hasMany(Module, {
  foreignKey: 'subjectId',
  as: 'modules',
  onDelete: 'CASCADE',
});
Module.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject',
});

// ==========================================
// 10. Module <-> Lesson Relationships
// ==========================================
Module.hasMany(Lesson, {
  foreignKey: 'moduleId',
  as: 'lessons',
  onDelete: 'CASCADE',
});
Lesson.belongsTo(Module, {
  foreignKey: 'moduleId',
  as: 'module',
});

// ==========================================
// 11. Attendance Relationships
// ==========================================
// Student <-> Attendance
User.hasMany(Attendance, {
  foreignKey: 'studentId',
  as: 'attendances',
  onDelete: 'CASCADE',
});
Attendance.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student',
});

// Class <-> Attendance
Class.hasMany(Attendance, {
  foreignKey: 'classId',
  as: 'attendances',
  onDelete: 'CASCADE',
});
Attendance.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class',
});

// Section <-> Attendance
Section.hasMany(Attendance, {
  foreignKey: 'sectionId',
  as: 'attendances',
  onDelete: 'SET NULL',
});
Attendance.belongsTo(Section, {
  foreignKey: 'sectionId',
  as: 'section',
});

// Teacher / Admin who recorded the attendance
User.hasMany(Attendance, {
  foreignKey: 'recordedBy',
  as: 'recordedAttendances',
  onDelete: 'RESTRICT',
});
Attendance.belongsTo(User, {
  foreignKey: 'recordedBy',
  as: 'recorder',
});

// ==========================================
// 12. Assignment Relationships
// ==========================================
// Class <-> Assignment
Class.hasMany(Assignment, {
  foreignKey: 'classId',
  as: 'assignments',
  onDelete: 'CASCADE',
});
Assignment.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class',
});

// Subject <-> Assignment (Optional relation)
Subject.hasMany(Assignment, {
  foreignKey: 'subjectId',
  as: 'assignments',
  onDelete: 'SET NULL',
});
Assignment.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject',
});

// User (Teacher/Creator) <-> Assignment
User.hasMany(Assignment, {
  foreignKey: 'creatorId',
  as: 'createdAssignments',
  onDelete: 'RESTRICT',
});
Assignment.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator',
});

// ==========================================
// 13. Submission Relationships
// ==========================================
// Assignment <-> Submission
Assignment.hasMany(Submission, {
  foreignKey: 'assignmentId',
  as: 'submissions',
  onDelete: 'CASCADE',
});
Submission.belongsTo(Assignment, {
  foreignKey: 'assignmentId',
  as: 'assignment',
});

// Student <-> Submission
User.hasMany(Submission, {
  foreignKey: 'studentId',
  as: 'submissions',
  onDelete: 'CASCADE',
});
Submission.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student',
});

// Teacher (Grader) <-> Submission
User.hasMany(Submission, {
  foreignKey: 'gradedBy',
  as: 'gradedSubmissions',
  onDelete: 'SET NULL',
});
Submission.belongsTo(User, {
  foreignKey: 'gradedBy',
  as: 'grader',
});

// ==========================================
// 14. Quiz Relationships
// ==========================================
// Class <-> Quiz
Class.hasMany(Quiz, {
  foreignKey: 'classId',
  as: 'quizzes',
  onDelete: 'CASCADE',
});
Quiz.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class',
});

// Subject <-> Quiz (Optional)
Subject.hasMany(Quiz, {
  foreignKey: 'subjectId',
  as: 'quizzes',
  onDelete: 'SET NULL',
});
Quiz.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject',
});

// User (Teacher/Creator) <-> Quiz
User.hasMany(Quiz, {
  foreignKey: 'creatorId',
  as: 'createdQuizzes',
  onDelete: 'RESTRICT',
});
Quiz.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator',
});

// ==========================================
// 15. Question & Option Relationships
// ==========================================
// Quiz <-> Question
Quiz.hasMany(Question, {
  foreignKey: 'quizId',
  as: 'questions',
  onDelete: 'CASCADE',
});
Question.belongsTo(Quiz, {
  foreignKey: 'quizId',
  as: 'quiz',
});

// Question <-> Option
Question.hasMany(Option, {
  foreignKey: 'questionId',
  as: 'options',
  onDelete: 'CASCADE',
});
Option.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question',
});

// ==========================================
// 16. QuizAttempt Relationships
// ==========================================
// Quiz <-> QuizAttempt
Quiz.hasMany(QuizAttempt, {
  foreignKey: 'quizId',
  as: 'attempts',
  onDelete: 'CASCADE',
});
QuizAttempt.belongsTo(Quiz, {
  foreignKey: 'quizId',
  as: 'quiz',
});

// Student (User) <-> QuizAttempt
User.hasMany(QuizAttempt, {
  foreignKey: 'studentId',
  as: 'quizAttempts',
  onDelete: 'CASCADE',
});
QuizAttempt.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student',
});

// ==========================================
// 17. DiscussionThread Relationships
// ==========================================
// User (Author) <-> DiscussionThread
User.hasMany(DiscussionThread, {
  foreignKey: 'authorId',
  as: 'discussionThreads',
  onDelete: 'CASCADE',
});
DiscussionThread.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

// Class <-> DiscussionThread
Class.hasMany(DiscussionThread, {
  foreignKey: 'classId',
  as: 'threads',
  onDelete: 'CASCADE',
});
DiscussionThread.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class',
});

// Subject <-> DiscussionThread
Subject.hasMany(DiscussionThread, {
  foreignKey: 'subjectId',
  as: 'threads',
  onDelete: 'SET NULL',
});
DiscussionThread.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject',
});

// Lesson <-> DiscussionThread (e.g. Q&A under a specific Surah/Ayah lesson)
Lesson.hasMany(DiscussionThread, {
  foreignKey: 'lessonId',
  as: 'threads',
  onDelete: 'SET NULL',
});
DiscussionThread.belongsTo(Lesson, {
  foreignKey: 'lessonId',
  as: 'lesson',
});

// ==========================================
// 18. DiscussionReply Relationships
// ==========================================
// DiscussionThread <-> DiscussionReply
DiscussionThread.hasMany(DiscussionReply, {
  foreignKey: 'threadId',
  as: 'replies',
  onDelete: 'CASCADE',
});
DiscussionReply.belongsTo(DiscussionThread, {
  foreignKey: 'threadId',
  as: 'thread',
});

// User (Author) <-> DiscussionReply
User.hasMany(DiscussionReply, {
  foreignKey: 'authorId',
  as: 'discussionReplies',
  onDelete: 'CASCADE',
});
DiscussionReply.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

// Self-referencing: DiscussionReply (parent) <-> DiscussionReply (child replies)
DiscussionReply.hasMany(DiscussionReply, {
  foreignKey: 'parentReplyId',
  as: 'childReplies',
  onDelete: 'CASCADE',
});
DiscussionReply.belongsTo(DiscussionReply, {
  foreignKey: 'parentReplyId',
  as: 'parentReply',
});

// ==========================================
// 19. Notification Relationships
// ==========================================
// User <-> Notification
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Export all models together + sequelize
export {
  sequelize,
  User,
  Class,
  Section,
  Enrollment,
  Subject,
  Module,
  Lesson,
  Attendance,
  Assignment,
  Submission,
  Quiz,
  Question,
  Option,
  QuizAttempt,
  DiscussionThread,
  DiscussionReply,
  Notification,
};
