import { Request, Response } from 'express';
import { Enrollment, User, Class, Section } from '../models';

// @desc    Enroll a student into a class & section
// @route   POST /api/enrollments
// @access  Private (Admin or Teacher)
export const enrollStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, classId, sectionId, rollNumber } = req.body;

    // 1. Basic field validation
    if (!studentId || !classId) {
      res.status(400).json({ error: 'studentId and classId are required' });
      return;
    }

    // 2. Verify student exists and has 'student' role
    const student = await User.findByPk(studentId);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    if (student.role !== 'student') {
      res.status(400).json({
        error: `User '${student.name}' is a ${student.role}. Only users with 'student' role can be enrolled.`,
      });
      return;
    }

    // 3. Verify class exists
    const classItem = await Class.findByPk(classId);
    if (!classItem) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }

    // 4. If sectionId provided, verify it belongs to this class
    if (sectionId) {
      const section = await Section.findByPk(sectionId);
      if (!section) {
        res.status(404).json({ error: 'Section not found' });
        return;
      }
      if (section.classId !== classId) {
        res.status(400).json({ error: 'Specified section does not belong to this class' });
        return;
      }
    }

    // 5. Prevent duplicate active enrollment in the same class
    const existingEnrollment = await Enrollment.findOne({
      where: {
        studentId,
        classId,
        status: 'active',
      },
    });

    if (existingEnrollment) {
      res.status(409).json({
        error: 'Student is already actively enrolled in this class',
      });
      return;
    }

    // 6. Create enrollment record
    const enrollment = await Enrollment.create({
      studentId,
      classId,
      sectionId: sectionId || null,
      rollNumber: rollNumber || null,
      status: 'active',
    });

    // 7. Return with populated student and class details
    const populatedEnrollment = await Enrollment.findByPk(enrollment.id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'avatar'],
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'gradeLevel'],
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name', 'roomNumber'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: populatedEnrollment,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to enroll student',
      details: error.message,
    });
  }
};

// @desc    Get all enrollments for a specific class
// @route   GET /api/enrollments/class/:classId
// @access  Private (Admin or Teacher)
export const getClassEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    if (typeof classId !== 'string') {
      res.status(400).json({ error: 'Valid Class ID is required' });
      return;
    }

    const enrollments = await Enrollment.findAll({
      where: { classId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'avatar', 'isActive'],
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name', 'roomNumber'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch class enrollments',
      details: error.message,
    });
  }
};

// @desc    Update student enrollment (status, section, rollNumber)
// @route   PATCH /api/enrollments/:id
// @access  Private (Admin only)
export const updateEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, sectionId, rollNumber } = req.body;

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Valid Enrollment ID is required' });
      return;
    }

    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment record not found' });
      return;
    }

    // If changing section, verify it belongs to the same class
    if (sectionId) {
      const section = await Section.findByPk(sectionId);
      if (!section || section.classId !== enrollment.classId) {
        res.status(400).json({ error: 'Section does not exist or does not belong to this class' });
        return;
      }
      enrollment.sectionId = sectionId;
    }

    if (status) enrollment.status = status;
    if (rollNumber !== undefined) enrollment.rollNumber = rollNumber;

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      data: enrollment,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to update enrollment',
      details: error.message,
    });
  }
};
