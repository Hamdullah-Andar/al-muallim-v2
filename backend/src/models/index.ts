import { sequelize } from '../config/database';
import { User } from './User';
import { Class } from './Class';
import { Section } from './Section';
import Enrollment from './Enrollment';
import Subject from './Subject';
import Module from './Module';
import Lesson from './Lesson';
import Attendance from './Attendance';

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
};
