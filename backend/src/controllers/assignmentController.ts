import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Assignment, Submission, Class, Subject, User } from '../models';

// @desc    Create a new assignment (Academic or Islamic Habit)
// @route   POST /api/assignments
// @access  Private (Teacher, Admin)
export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, type, classId, subjectId, dueDate, totalPoints, trackerConfig } = req.body;

    if (!title || !classId || !dueDate) {
      res.status(400).json({
        success: false,
        message: 'title, classId, and dueDate are required',
      });
      return;
    }

    // Verify class exists
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      res.status(404).json({ success: false, message: `Class not found with id: ${classId}` });
      return;
    }

    // Verify subject if provided
    if (subjectId) {
      const subjectExists = await Subject.findByPk(subjectId);
      if (!subjectExists) {
        res.status(404).json({ success: false, message: `Subject not found with id: ${subjectId}` });
        return;
      }
    }

    const creatorId = req.user?.id;
    if (!creatorId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const assignment = await Assignment.create({
      title,
      description: description || null,
      type: type || 'standard',
      classId,
      subjectId: subjectId || null,
      dueDate: new Date(dueDate),
      totalPoints: totalPoints || 100,
      trackerConfig: trackerConfig || null,
      creatorId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    });
  } catch (error) {
    console.error('Error in createAssignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Get all assignments for a class
// @route   GET /api/assignments/class/:classId
// @access  Private
export const getAssignmentsByClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { type, subjectId } = req.query;

    if (typeof classId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid class ID' });
      return;
    }

    const whereClause: any = { classId, isActive: true };

    if (type && typeof type === 'string') {
      whereClause.type = type;
    }

    if (subjectId && typeof subjectId === 'string') {
      whereClause.subjectId = subjectId;
    }

    const assignments = await Assignment.findAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['dueDate', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error('Error in getAssignmentsByClass:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Submit an assignment or Islamic habit log
// @route   POST /api/assignments/:assignmentId/submit
// @access  Private (Student)
export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const { content, fileUrl, trackerData } = req.body;

    if (typeof assignmentId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid assignment ID' });
      return;
    }

    const studentId = req.user?.id;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    // Check if submission is late
    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);

    // Check if an existing submission exists for this student
    let submission = await Submission.findOne({
      where: { assignmentId, studentId },
    });

    if (submission) {
      // Update existing submission (resubmission)
      await submission.update({
        content: content !== undefined ? content : submission.content,
        fileUrl: fileUrl !== undefined ? fileUrl : submission.fileUrl,
        trackerData: trackerData !== undefined ? trackerData : submission.trackerData,
        submittedAt: now,
        status: isLate ? 'late' : 'resubmitted',
      });

      res.status(200).json({
        success: true,
        message: 'Assignment resubmitted successfully',
        data: submission,
      });
      return;
    }

    // Create new submission
    submission = await Submission.create({
      assignmentId,
      studentId,
      content: content || null,
      fileUrl: fileUrl || null,
      trackerData: trackerData || null,
      submittedAt: now,
      status: isLate ? 'late' : 'submitted',
    });

    res.status(201).json({
      success: true,
      message: isLate ? 'Assignment submitted (late)' : 'Assignment submitted successfully',
      data: submission,
    });
  } catch (error) {
    console.error('Error in submitAssignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Grade a student submission & give feedback
// @route   PUT /api/assignments/submissions/:submissionId/grade
// @access  Private (Teacher, Admin)
export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    if (typeof submissionId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid submission ID' });
      return;
    }

    if (grade === undefined || grade === null) {
      res.status(400).json({ success: false, message: 'grade is required' });
      return;
    }

    const submission = await Submission.findByPk(submissionId, {
      include: [{ model: Assignment, as: 'assignment' }],
    });

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    const graderId = req.user?.id;

    await submission.update({
      grade: Number(grade),
      feedback: feedback || null,
      gradedBy: graderId || null,
      gradedAt: new Date(),
      status: 'graded',
    });

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: submission,
    });
  } catch (error) {
    console.error('Error in gradeSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade submission',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/assignments/:assignmentId/submissions
// @access  Private (Teacher, Admin)
export const getAssignmentSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    if (typeof assignmentId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid assignment ID' });
      return;
    }

    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'grader',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['submittedAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error('Error in getAssignmentSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment submissions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Get all submissions of a specific student
// @route   GET /api/assignments/student/:studentId/submissions
// @access  Private
export const getStudentSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (typeof studentId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid student ID' });
      return;
    }

    const submissions = await Submission.findAll({
      where: { studentId },
      include: [
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['id', 'title', 'type', 'totalPoints', 'dueDate'],
        },
        {
          model: User,
          as: 'grader',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['submittedAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error('Error in getStudentSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student submissions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
