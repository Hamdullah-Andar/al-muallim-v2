import { User } from './User';
import { Class } from './Class';
import { Section } from './Section';

// ==========================================
// Define Relationships (Associations)
// ==========================================

// 1. Class <-> Section (One Class has Many Sections)
Class.hasMany(Section, {
  foreignKey: 'classId',
  as: 'sections',
  onDelete: 'CASCADE',
});
Section.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class',
});

// 2. Class <-> User (Class has an assigned Teacher)
Class.belongsTo(User, {
  foreignKey: 'classTeacherId',
  as: 'teacher',
});
User.hasMany(Class, {
  foreignKey: 'classTeacherId',
  as: 'taughtClasses',
});

// Export all models together
export { User, Class, Section };
