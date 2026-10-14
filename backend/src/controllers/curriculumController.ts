import { Request, Response } from 'express';
import { Subject, Module, Lesson, Class, User } from '../models';

// ========================================================
// 1. SUBJECT CONTROLLERS
// ========================================================

// @desc    Create a new subject in a class
// @route   POST /api/subjects
// @access  Private (Admin or Teacher)
export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, description, classId, teacherId } = req.body;

    if (!name || !classId) {
      res.status(400).json({ error: 'Subject name and classId are required' });
      return;
    }

    // Verify class exists
    const classItem = await Class.findByPk(classId);
    if (!classItem) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }

    // Verify teacher if provided
    if (teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'admin')) {
        res.status(400).json({ error: 'Assigned user must be a teacher or admin' });
        return;
      }
    }

    // Prevent duplicate subject in the same class
    const existingSubject = await Subject.findOne({
      where: { classId, name },
    });
    if (existingSubject) {
      res.status(409).json({ error: `Subject '${name}' already exists in this class` });
      return;
    }

    const subject = await Subject.create({
      name,
      code: code || null,
      description: description || null,
      classId,
      teacherId: teacherId || null,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create subject',
      details: error.message,
    });
  }
};

// @desc    Get all subjects for a class
// @route   GET /api/subjects/class/:classId
// @access  Private (Authenticated users)
export const getSubjectsByClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    if (typeof classId !== 'string') {
      res.status(400).json({ error: 'Valid Class ID is required' });
      return;
    }

    const subjects = await Subject.findAll({
      where: { classId, isActive: true },
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch subjects',
      details: error.message,
    });
  }
};

// @desc    Get complete Subject Syllabus (with Modules and Lessons)
// @route   GET /api/subjects/:id
// @access  Private (Authenticated users)
export const getSubjectWithSyllabus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Valid Subject ID is required' });
      return;
    }

    const subject = await Subject.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: Module,
          as: 'modules',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: Lesson,
              as: 'lessons',
              where: { isActive: true },
              required: false,
            },
          ],
        },
      ],
      order: [
        [{ model: Module, as: 'modules' }, 'orderIndex', 'ASC'],
        [{ model: Module, as: 'modules' }, { model: Lesson, as: 'lessons' }, 'orderIndex', 'ASC'],
      ],
    });

    if (!subject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch subject syllabus',
      details: error.message,
    });
  }
};

// ========================================================
// 2. MODULE CONTROLLERS
// ========================================================

// @desc    Create a module/unit within a subject
// @route   POST /api/subjects/:subjectId/modules
// @access  Private (Admin or Teacher)
export const createModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const { title, description, orderIndex } = req.body;

    if (typeof subjectId !== 'string') {
      res.status(400).json({ error: 'Valid Subject ID is required' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Module title is required' });
      return;
    }

    // Verify parent subject exists
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    const newModule = await Module.create({
      title,
      description: description || null,
      orderIndex: orderIndex ? Number(orderIndex) : 1,
      subjectId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: newModule,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create module',
      details: error.message,
    });
  }
};

// ========================================================
// 3. LESSON CONTROLLERS
// ========================================================

// @desc    Create a lesson within a module
// @route   POST /api/modules/:moduleId/lessons
// @access  Private (Admin or Teacher)
export const createLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const { title, content, videoUrl, durationMinutes, orderIndex } = req.body;

    if (typeof moduleId !== 'string') {
      res.status(400).json({ error: 'Valid Module ID is required' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Lesson title is required' });
      return;
    }

    // Verify parent module exists
    const moduleItem = await Module.findByPk(moduleId);
    if (!moduleItem) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    const newLesson = await Lesson.create({
      title,
      content: content || null,
      videoUrl: videoUrl || null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      orderIndex: orderIndex ? Number(orderIndex) : 1,
      moduleId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: newLesson,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create lesson',
      details: error.message,
    });
  }
};

// @desc    Get single lesson details
// @route   GET /api/lessons/:id
// @access  Private (Authenticated users)
export const getLessonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Valid Lesson ID is required' });
      return;
    }

    const lesson = await Lesson.findByPk(id, {
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'title', 'subjectId'],
        },
      ],
    });

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: lesson,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch lesson',
      details: error.message,
    });
  }
};
