import { User } from './User';
import { Class } from './Class';
import { Section } from './Section';
import Enrollment from './Enrollment';

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

export { User, Class, Section, Enrollment };
