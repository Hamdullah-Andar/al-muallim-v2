import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Quiz, Question, Option, QuizAttempt, Class, Subject, User, sequelize } from '../models';

interface QuestionInput {
  text: string;
  type?: 'multiple_choice' | 'true_false';
  points?: number;
  explanation?: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

// @desc    Create a quiz with nested questions and options
// @route   POST /api/quizzes
// @access  Private (Teacher, Admin)
export const createQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const { title, description, classId, subjectId, timeLimitMinutes, passingScore, dueDate, questions } = req.body;

    if (!title || !classId || !Array.isArray(questions) || questions.length === 0) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'title, classId, and a non-empty questions array are required',
      });
      return;
    }

    const classExists = await Class.findByPk(classId, { transaction });
    if (!classExists) {
      await transaction.rollback();
      res.status(404).json({ success: false, message: `Class not found with id: ${classId}` });
      return;
    }

    const creatorId = req.user?.id;
    if (!creatorId) {
      await transaction.rollback();
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Calculate total points from all questions
    const calculatedTotalPoints = questions.reduce(
      (sum: number, q: QuestionInput) => sum + (q.points || 10),
      0
    );

    // 1. Create Quiz
    const quiz = await Quiz.create(
      {
        title,
        description: description || null,
        classId,
        subjectId: subjectId || null,
        creatorId,
        timeLimitMinutes: timeLimitMinutes || 30,
        passingScore: passingScore || 60,
        totalPoints: calculatedTotalPoints,
        dueDate: dueDate ? new Date(dueDate) : null,
        isActive: true,
      },
      { transaction }
    );

    // 2. Create Questions & Options
    for (const q of questions) {
      const createdQuestion = await Question.create(
        {
          quizId: quiz.id || quiz.getDataValue('id'),
          text: q.text,
          type: q.type || 'multiple_choice',
          points: q.points || 10,
          explanation: q.explanation || null,
        },
        { transaction }
      );

      if (Array.isArray(q.options) && q.options.length > 0) {
        const optionRows = q.options.map((opt: { text: string; isCorrect: boolean }, idx: number) => ({
          questionId: createdQuestion.id || createdQuestion.getDataValue('id'),
          text: opt.text,
          isCorrect: !!opt.isCorrect,
          orderIndex: idx,
        }));

        await Option.bulkCreate(optionRows, { transaction });
      }
    }

    await transaction.commit();

    // Fetch the created quiz with relations
    const fullQuiz = await Quiz.findByPk(quiz.id, {
      include: [
        {
          model: Question,
          as: 'questions',
          include: [{ model: Option, as: 'options' }],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: fullQuiz,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createQuiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Get all quizzes for a class
// @route   GET /api/quizzes/class/:classId
// @access  Private
export const getQuizzesByClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    if (typeof classId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid class ID' });
      return;
    }

    const quizzes = await Quiz.findAll({
      where: { classId, isActive: true },
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    console.error('Error in getQuizzesByClass:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Get quiz for taking (Hides `isCorrect` for students to prevent cheating)
// @route   GET /api/quizzes/:id
// @access  Private
export const getQuizForTaking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isStaff = req.user?.role === 'admin' || req.user?.role === 'teacher';

    if (typeof id !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid quiz ID' });
      return;
    }

    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: Question,
          as: 'questions',
          // If student, hide explanation before attempt
          attributes: isStaff ? undefined : ['id', 'quizId', 'text', 'type', 'points'],
          include: [
            {
              model: Option,
              as: 'options',
              // If student, hide isCorrect to prevent cheating in DevTools!
              attributes: isStaff ? undefined : ['id', 'questionId', 'text', 'orderIndex'],
            },
          ],
        },
      ],
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error('Error in getQuizForTaking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Submit a quiz attempt and automatically grade it
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student)
export const submitQuizAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: quizId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedOptionId }

    if (typeof quizId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid quiz ID' });
      return;
    }

    const studentId = req.user?.id;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // 1. Fetch Quiz with Questions and correct options
    const quiz = await Quiz.findByPk(quizId, {
      include: [
        {
          model: Question,
          as: 'questions',
          include: [{ model: Option, as: 'options' }],
        },
      ],
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    const questionsList = (quiz as any).questions || [];
    let earnedScore = 0;
    const evaluatedAnswers: any[] = [];

    // Map student's submitted answers
    const studentAnswerMap: Record<string, string> = {};
    if (Array.isArray(answers)) {
      for (const a of answers) {
        studentAnswerMap[a.questionId] = a.selectedOptionId;
      }
    }

    // 2. Auto-grading loop
    for (const question of questionsList) {
      const selectedOptionId = studentAnswerMap[question.id];
      const correctOption = question.options.find((opt: any) => opt.isCorrect);

      const isCorrect = Boolean(
        selectedOptionId && correctOption && selectedOptionId === correctOption.id
      );
      const pointsEarned = isCorrect ? question.points : 0;
      earnedScore += pointsEarned;

      evaluatedAnswers.push({
        questionId: question.id,
        questionText: question.text,
        selectedOptionId: selectedOptionId || null,
        correctOptionId: correctOption?.id || null,
        isCorrect,
        pointsEarned,
        totalPoints: question.points,
        explanation: question.explanation,
      });
    }

    const totalPoints = quiz.totalPoints || 100;
    const percentage = totalPoints > 0 ? Number(((earnedScore / totalPoints) * 100).toFixed(2)) : 0;
    const isPassed = percentage >= quiz.passingScore;

    // 3. Save Quiz Attempt
    const attempt = await QuizAttempt.create({
      quizId,
      studentId,
      score: earnedScore,
      totalPoints,
      percentage,
      isPassed,
      answers: evaluatedAnswers,
      startedAt: new Date(),
      completedAt: new Date(),
      status: 'completed',
    });

    res.status(201).json({
      success: true,
      message: isPassed ? 'Congratulations! You passed the quiz.' : 'Quiz completed. Keep reviewing!',
      data: {
        attemptId: attempt.id,
        score: earnedScore,
        totalPoints,
        percentage,
        isPassed,
        passingScore: quiz.passingScore,
        detailedReview: evaluatedAnswers,
      },
    });
  } catch (error) {
    console.error('Error in submitQuizAttempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade quiz submission',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// @desc    Get all quiz attempts for a student
// @route   GET /api/quizzes/student/:studentId/attempts
// @access  Private
export const getStudentQuizAttempts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (typeof studentId !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid student ID' });
      return;
    }

    const attempts = await QuizAttempt.findAll({
      where: { studentId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'passingScore', 'totalPoints'],
        },
      ],
      order: [['completedAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    console.error('Error in getStudentQuizAttempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student quiz attempts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
