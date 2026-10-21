import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Attendance, Class, User, Section, sequelize } from '../models';
import { Op } from 'sequelize';

interface AttendanceRecordInput {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

// @desc    Mark bulk attendance for a class on a specific date
// @route   POST /api/attendance
// @access  Private (Teacher, Admin)
export const markBulkAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const { classId, sectionId, date, records } = req.body;

    if (!classId || !date || !Array.isArray(records) || records.length === 0) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'classId, date (YYYY-MM-DD), and a non-empty records array are required',
      });
      return;
    }

    // Verify class exists
    const classExists = await Class.findByPk(classId, { transaction });
    if (!classExists) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: `Class not found with id: ${classId}`,
      });
      return;
    }

    // Verify section if provided
    if (sectionId) {
      const sectionExists = await Section.findByPk(sectionId, { transaction });
      if (!sectionExists) {
        await transaction.rollback();
        res.status(404).json({
          success: false,
          message: `Section not found with id: ${sectionId}`,
        });
        return;
      }
    }

    const recordedBy = req.user?.id;
    if (!recordedBy) {
      await transaction.rollback();
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Prepare rows for bulk upsert
    const rows = records.map((rec: AttendanceRecordInput) => ({
      studentId: rec.studentId,
      classId,
      sectionId: sectionId || null,
      date,
      status: rec.status || 'present',
      remarks: rec.remarks || null,
      recordedBy,
    }));

    // bulkCreate with updateOnDuplicate ensures if attendance was already taken,
    // it simply updates the status and remarks instead of throwing unique error
    const savedRecords = await Attendance.bulkCreate(rows, {
      updateOnDuplicate: ['status', 'remarks', 'recordedBy', 'updatedAt'],
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Successfully recorded attendance for ${savedRecords.length} student(s)`,
      count: savedRecords.length,
      data: savedRecords,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in markBulkAttendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Get attendance for a class on a specific date
// @route   GET /api/attendance/class/:classId
// @access  Private
export const getClassAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { date, sectionId } = req.query;

    if (typeof classId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid class ID' });
      return;
    }

    const whereClause: any = { classId };

    if (date && typeof date === 'string') {
      whereClause.date = date;
    }

    if (sectionId && typeof sectionId === 'string') {
      whereClause.sectionId = sectionId;
    }

    const attendances = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'recorder',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['date', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    console.error('Error in getClassAttendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Get attendance history and percentage stats for a student
// @route   GET /api/attendance/student/:studentId
// @access  Private
export const getStudentAttendanceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { classId, startDate, endDate } = req.query;

    if (typeof studentId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid student ID' });
      return;
    }

    const whereClause: any = { studentId };

    if (classId && typeof classId === 'string') {
      whereClause.classId = classId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      whereClause.date = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.date = { [Op.lte]: endDate };
    }

    const records = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'academicYear'],
        },
      ],
      order: [['date', 'DESC']],
    });

    // Convert Sequelize instances to plain JavaScript objects
    const plainRecords = records.map((r) => r.get({ plain: true }));

    // Compute stats
    const totalDays = plainRecords.length;
    const presentCount = plainRecords.filter((r) => r.status === 'present').length;
    const absentCount = plainRecords.filter((r) => r.status === 'absent').length;
    const lateCount = plainRecords.filter((r) => r.status === 'late').length;
    const excusedCount = plainRecords.filter((r) => r.status === 'excused').length;

    // Standard attendance percentage calculation: (Present + Late) / Total
    const percentage =
      totalDays > 0 ? Number((((presentCount + lateCount) / totalDays) * 100).toFixed(2)) : 100;

    res.status(200).json({
      success: true,
      stats: {
        totalDays,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        percentage,
      },
      count: plainRecords.length,
      data: plainRecords,
    });

  } catch (error) {
    console.error('Error in getStudentAttendanceHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student attendance history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
