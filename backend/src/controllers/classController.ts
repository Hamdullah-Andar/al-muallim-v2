import { Request, Response } from 'express';
import { Class, Section, User } from '../models';

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Admin only)
export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, gradeLevel, description, classTeacherId, academicYear, capacity } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Class name is required' });
      return;
    }

    // 1. Prevent duplicate class in the same academic year
    const existingClass = await Class.findOne({
      where: {
        name,
        academicYear: academicYear || null,
      },
    });

    if (existingClass) {
      res.status(409).json({
        error: `A class named '${name}' already exists for academic year '${academicYear || 'current'}'`,
      });
      return;
    }

    // 2. If a classTeacherId is provided, verify they exist and have 'teacher' role
    if (classTeacherId) {
      const teacher = await User.findByPk(classTeacherId);
      if (!teacher) {
        res.status(404).json({ error: 'Assigned teacher not found' });
        return;
      }
      if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
        res.status(400).json({ error: 'Assigned user must be a teacher or admin' });
        return;
      }
    }

    const newClass = await Class.create({
      name,
      gradeLevel: gradeLevel || null,
      description: description || null,
      classTeacherId: classTeacherId || null,
      academicYear: academicYear || '2026-2027',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create class',
      details: error.message,
    });
  }
};

// @desc    Get all classes (with nested sections & teacher)
// @route   GET /api/classes
// @access  Private (Any authenticated user)
export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const classes = await Class.findAll({
      include: [
        {
          model: Section,
          as: 'sections',
          where: { isActive: true },
          required: false,
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch classes',
      details: error.message,
    });
  }
};

// @desc    Get single class by ID (with sections & teacher)
// @route   GET /api/classes/:id
// @access  Private (Any authenticated user)
export const getClassById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Class ID is required' });
      return;
    }

    const foundClass = await Class.findByPk(id, {
      include: [
        {
          model: Section,
          as: 'sections',
          where: { isActive: true },
          required: false,
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
    });

    if (!foundClass) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: foundClass,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch class',
      details: error.message,
    });
  }
};

// @desc    Add a section to a class
// @route   POST /api/classes/:classId/sections
// @access  Private (Admin or Teacher)
export const createSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { name, roomNumber, capacity } = req.body;

    if (typeof classId !== 'string') {
      res.status(400).json({ error: 'Class ID parameter is required' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Section name is required (e.g., "Section A")' });
      return;
    }

    // 1. Verify parent class exists
    const parentClass = await Class.findByPk(classId);
    if (!parentClass) {
      res.status(404).json({ error: 'Parent class not found' });
      return;
    }

    // 2. Prevent duplicate section name in the same class
    const existingSection = await Section.findOne({
      where: {
        name,
        classId,
      },
    });

    if (existingSection) {
      res.status(409).json({
        error: `Section '${name}' already exists in this class`,
      });
      return;
    }

    // 3. Create the section
    const newSection = await Section.create({
      name,
      classId,
      roomNumber: roomNumber || null,
      capacity: capacity ? Number(capacity) : 30,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: newSection,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create section',
      details: error.message,
    });
  }
};
