import { Request, Response } from 'express';
import { Class, Section, User } from '../models';

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Admin only)
export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, gradeLevel, description, classTeacherId } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Class name is required' });
      return;
    }

    // Optional: If classTeacherId provided, verify that the teacher exists and has 'teacher' role
    if (classTeacherId) {
      const teacher = await User.findByPk(classTeacherId);
      if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'admin')) {
        res.status(400).json({ error: 'Assigned user must be a teacher or admin' });
        return;
      }
    }

    const newClass = await Class.create({
      name,
      gradeLevel: gradeLevel ? Number(gradeLevel) : null,
      description: description || null,
      classTeacherId: classTeacherId || null,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass,
    });
  } catch (error) {
    console.error('Create Class Error:', error);
    res.status(500).json({ error: 'Server error creating class' });
  }
};

// @desc    Get all classes (with nested sections & teacher)
// @route   GET /api/classes
// @access  Private (Any authenticated user)
export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const classes = await Class.findAll({
      where: { isActive: true },
      include: [
        {
          model: Section,
          as: 'sections',
          where: { isActive: true },
          required: false, // Left outer join: include classes even if they have no sections yet!
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      order: [
        ['gradeLevel', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error('Get Classes Error:', error);
    res.status(500).json({ error: 'Server error retrieving classes' });
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
  } catch (error) {
    console.error('Get Class By ID Error:', error);
    res.status(500).json({ error: 'Server error retrieving class' });
  }
};

// @desc    Add a section to a class
// @route   POST /api/classes/:classId/sections
// @access  Private (Admin or Teacher)
export const createSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { name, roomNumber, capacity } = req.body;

    // 1. Guard check: guarantees classId is strictly a string (not undefined or string[])
    if (typeof classId !== 'string') {
      res.status(400).json({ error: 'Class ID parameter is required' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Section name is required (e.g., "Section A")' });
      return;
    }

    // 2. Verify parent class exists
    const parentClass = await Class.findByPk(classId);
    if (!parentClass) {
      res.status(404).json({ error: 'Parent class not found' });
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

