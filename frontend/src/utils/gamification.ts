import { SupabaseClient } from '@supabase/supabase-js'

export async function calculateStudentStats(
  supabase: SupabaseClient, 
  studentId: string, 
  type: 'all' | 'personal' | 'class' = 'all'
) {
  // First, get the relevant assignment IDs for this student
  let assignmentIds: string[] = []

  if (type === 'personal') {
    // Personal habits: assignments with null class_id belonging to this student
    const { data: personalAssignments } = await supabase
      .from('assignments')
      .select('id')
      .is('class_id', null)
      .eq('student_id', studentId)
    assignmentIds = (personalAssignments || []).map(a => a.id)
  } else if (type === 'class') {
    // Class assignments: student must be enrolled in those classes
    const { data: enrollments } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', studentId)
    const classIds = (enrollments || []).map(e => e.class_id).filter(Boolean)
    
    if (classIds.length > 0) {
      const { data: classAssignments } = await supabase
        .from('assignments')
        .select('id')
        .in('class_id', classIds)
      assignmentIds = (classAssignments || []).map(a => a.id)
    }
  } else {
    // 'all': personal + class
    const { data: personalAssignments } = await supabase
      .from('assignments')
      .select('id')
      .is('class_id', null)
      .eq('student_id', studentId)

    const { data: enrollments } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', studentId)
    const classIds = (enrollments || []).map(e => e.class_id).filter(Boolean)
    
    let classAssignmentIds: string[] = []
    if (classIds.length > 0) {
      const { data: classAssignments } = await supabase
        .from('assignments')
        .select('id')
        .in('class_id', classIds)
      classAssignmentIds = (classAssignments || []).map(a => a.id)
    }
    assignmentIds = [...(personalAssignments || []).map(a => a.id), ...classAssignmentIds]
  }

  if (assignmentIds.length === 0) {
    return { currentStreak: 0, knowledgePoints: 0, completedTasks: 0 }
  }

  // Now fetch completed progress only for those specific assignments
  const { data: progress } = await supabase
    .from('student_progress')
    .select('tracking_date')
    .eq('student_id', studentId)
    .in('assignment_id', assignmentIds)
    .eq('is_completed', true)
    .order('tracking_date', { ascending: false })

  if (!progress || progress.length === 0) {
    return { currentStreak: 0, knowledgePoints: 0, completedTasks: 0 }
  }

  const completedTasks = progress.length
  const knowledgePoints = completedTasks * 10 // 10 points per task

  // Calculate Streak
  const uniqueDates = Array.from(new Set(progress.map(p => p.tracking_date)))
  
  let currentStreak = 0;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If they haven't done anything today OR yesterday, streak is 0
  if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
    return { currentStreak: 0, knowledgePoints, completedTasks }
  }

  let checkDate = new Date(uniqueDates[0]); // Start with the most recent date
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const d = uniqueDates[i];
    const expectedStr = checkDate.toISOString().split('T')[0];
    
    if (d === expectedStr) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Streak broken
    }
  }

  return { currentStreak, knowledgePoints, completedTasks }
}
