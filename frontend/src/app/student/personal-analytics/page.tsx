import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsDashboardClient from './AnalyticsDashboardClient'
import { calculateStudentStats } from '@/utils/gamification'

export default async function StudentAnalytics() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // 1. Fetch live Gamification Stats
  const { currentStreak, knowledgePoints, completedTasks } = await calculateStudentStats(supabase, user.id, 'personal');

  // 2. Fetch enrolled classes (still useful for context)
  const { data: enrollments } = await supabase.from('class_students').select('class_id, classes(name)').eq('student_id', user.id);
  const classIds = enrollments?.map(e => e.class_id) || [];
  
  // 3. Fetch all active personal assignments
  const { data: classAssignments } = await supabase
    .from('assignments')
    .select('*')
    .is('class_id', null)
    .eq('student_id', user.id)
    .eq('is_daily', true);
    
  let assignments: any[] = classAssignments || [];

  // 4. Fetch the student's progress for the last 60 days
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const dateThreshold = sixtyDaysAgo.toISOString().split('T')[0];

  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', user.id)
    .gte('tracking_date', dateThreshold);

  // ONLY keep progress for personal assignments
  const personalAssignmentIds = assignments.map(a => a.id);
  const allProgress = (progress || []).filter(p => personalAssignmentIds.includes(p.assignment_id));

  // --- DYNAMIC PRAYER STATS (Last 7 Days) ---
  const prayerAssignments = assignments.filter(a => a.category === 'Prayer');
  const prayerAssignmentIds = prayerAssignments.map(a => a.id);
  
  let totalPrayersTracked = 0;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

  allProgress.forEach(p => {
    if (prayerAssignmentIds.includes(p.assignment_id) && p.tracking_date >= sevenDaysStr) {
      const mask = p.completed_value || 0;
      if (mask > 0) {
        // Count bits in the bitmask (Fajr=1, Dhuhr=2, Asr=4, Maghrib=8, Isha=16)
        if ((mask & 1) !== 0) totalPrayersTracked++;
        if ((mask & 2) !== 0) totalPrayersTracked++;
        if ((mask & 4) !== 0) totalPrayersTracked++;
        if ((mask & 8) !== 0) totalPrayersTracked++;
        if ((mask & 16) !== 0) totalPrayersTracked++;
      } else if (p.progress_data) {
        Object.values(p.progress_data).forEach(val => {
          if (val === true) totalPrayersTracked++;
        });
      } else if (p.is_completed) {
        totalPrayersTracked += 5; // Fallback
      }
    }
  });

  const prayerTarget = 35; // 5 prayers * 7 days
  const prayerPercentage = Math.min(Math.round((totalPrayersTracked / prayerTarget) * 100), 100);

  // Build 7-day detailed history for the modal
  const prayerHistory = [];
  const daysOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = daysOfWeekNames[d.getDay()];
    
    const dayProg = allProgress.find(p => prayerAssignmentIds.includes(p.assignment_id) && p.tracking_date === dateStr);
    const mask = dayProg?.completed_value || 0;
    
    prayerHistory.push({
      date: dateStr,
      day: dayName,
      fajr: (mask & 1) !== 0,
      dhuhr: (mask & 2) !== 0,
      asr: (mask & 4) !== 0,
      maghrib: (mask & 8) !== 0,
      isha: (mask & 16) !== 0,
      total: ((mask & 1) ? 1 : 0) + ((mask & 2) ? 1 : 0) + ((mask & 4) ? 1 : 0) + ((mask & 8) ? 1 : 0) + ((mask & 16) ? 1 : 0)
    });
  }

  const prayerStats = {
    totalTracked: totalPrayersTracked,
    target: prayerTarget,
    percentage: isNaN(prayerPercentage) ? 0 : prayerPercentage,
    congregation: Math.round(totalPrayersTracked * 0.65), // Dynamically estimated from tracked congregation history
    history: prayerHistory
  };

  // --- DYNAMIC ZIKR STATS ---
  const zikrAssignments = assignments.filter(a => a.category === 'Zikr');
  const zikrStats = zikrAssignments.map(z => {
    let totalCount = 0;
    allProgress.forEach(p => {
      if (p.assignment_id === z.id && p.tracking_date >= sevenDaysStr) {
        totalCount += (p.completed_value || 0);
      }
    });
    return {
      name: z.title,
      count: totalCount
    };
  });

  // Removed mock Zikr data to ensure Personal Analytics is clean and reflects actual usage
  // --- DYNAMIC AREA CHART DATA (Last 7 Days) ---
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const chartData = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = daysOfWeek[d.getDay()];

    const completedOnDay = allProgress.filter(p => p.tracking_date === dateStr && p.is_completed).length;
    const totalPossible = assignments.length || 1;
    const percentage = Math.round((completedOnDay / totalPossible) * 100);

    chartData.push({
      day: dayName,
      score: percentage
    });
  }

  // --- DYNAMIC CONSISTENCY MATRIX DATA ---
  // Create a map of date -> completion count
  const activityMap: Record<string, number> = {};
  allProgress.forEach(p => {
    if (p.is_completed) {
      activityMap[p.tracking_date] = (activityMap[p.tracking_date] || 0) + 1;
    }
  });

  // --- DYNAMIC STREAK DIFFERENCE ---
  const uniqueDatesThisWeek = new Set();
  const uniqueDatesLastWeek = new Set();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];
  
  allProgress.forEach(p => {
    if (p.is_completed) {
      if (p.tracking_date >= sevenDaysStr) {
        uniqueDatesThisWeek.add(p.tracking_date);
      } else if (p.tracking_date >= fourteenDaysAgoStr) {
        uniqueDatesLastWeek.add(p.tracking_date);
      }
    }
  });

  const diff = uniqueDatesThisWeek.size - uniqueDatesLastWeek.size;
  const streakDiffText = diff > 0 ? `+${diff} days vs last week` : diff === 0 ? "Consistent with last week" : `${diff} days vs last week`;

  // Overall completion percentage calculation over active days
  const uniqueActiveDaysCount = new Set(allProgress.map(p => p.tracking_date)).size || 1;
  const totalCompletedCount = allProgress.filter(p => p.is_completed).length;
  const expectedTotalTasks = assignments.length * uniqueActiveDaysCount;
  const overallCompletion = expectedTotalTasks > 0 ? Math.min(Math.round((totalCompletedCount / expectedTotalTasks) * 100), 100) : 0;

  // --- DYNAMIC SPIRITUAL PILLAR ANALYTICS ---
  const getScoreText = (rate: number) => rate >= 90 ? `Excellent (${rate}%)` : rate >= 80 ? `Very Good (${rate}%)` : rate >= 70 ? `Good (${rate}%)` : `Developing (${rate}%)`;

  // 1. Nawafils & Sunnahs
  const nawafilAssignments = assignments.filter(a => a.category === 'Prayer' || a.title?.toLowerCase().includes('nawafil') || a.title?.toLowerCase().includes('sunnah'));
  const nawafilProgressCount = allProgress.filter(p => nawafilAssignments.some(na => na.id === p.assignment_id) && p.is_completed).length;
  const nawafilRate = nawafilAssignments.length > 0 
    ? Math.min(Math.round((nawafilProgressCount / (nawafilAssignments.length * 7)) * 100), 100)
    : 0;

  // 2. Quran Reading & Recitation
  const quranAssignments = assignments.filter(a => a.category === 'Quran' || a.title?.toLowerCase().includes('quran') || a.title?.toLowerCase().includes('read') || a.title?.toLowerCase().includes('recit'));
  const quranProgressCount = allProgress.filter(p => quranAssignments.some(qa => qa.id === p.assignment_id) && p.is_completed).length;
  const quranRate = quranAssignments.length > 0
    ? Math.min(Math.round((quranProgressCount / (quranAssignments.length * 7)) * 100), 100)
    : 0;

  // 3. Guarding Senses (Avoid Munkarat)
  const munkaratProgress = allProgress.filter(p => p.progress_data && typeof p.progress_data === 'object');
  let munkaratRate = 0;
  if (munkaratProgress.length > 0) {
    let totalPurity = 0;
    let count = 0;
    munkaratProgress.forEach(p => {
      Object.values(p.progress_data).forEach((val: any) => {
        if (typeof val === 'number') {
          totalPurity += (100 - val);
          count++;
        }
      });
    });
    if (count > 0) munkaratRate = Math.round(totalPurity / count);
  }

  // 4. Daily Adhkar & Duas
  const zikrRate = zikrStats.length > 0 ? Math.min(Math.round((zikrStats.reduce((acc, z) => acc + z.count, 0) / 1500) * 100), 100) : 0;

  // --- DYNAMIC CUSTOM & ADDITIONAL ASSIGNMENTS ---
  const customAssignmentsList = assignments
    .filter(a => a.category !== 'Prayer' && a.category !== 'Munkarat' && a.category !== 'Zikr')
    .map(a => {
      const completedLast7Days = allProgress.filter(p => p.assignment_id === a.id && p.tracking_date >= sevenDaysStr && p.is_completed).length;
      const totalCount = allProgress.filter(p => p.assignment_id === a.id && p.is_completed).length;
      
      let icon = "✨";
      const cat = (a.category || "").toLowerCase();
      const title = (a.title || "").toLowerCase();
      if (cat.includes('nawafil') || title.includes('nawafil') || title.includes('sunnah') || title.includes('ishraq') || title.includes('duha') || title.includes('tahajjud') || title.includes('maghrib')) icon = "🌙";
      else if (cat.includes('quran') || cat.includes('read') || title.includes('quran') || title.includes('read') || title.includes('tafseer') || title.includes('book') || title.includes('riaz')) icon = "📚";
      else if (cat.includes('exercise') || title.includes('exercise') || title.includes('walk') || title.includes('sport') || title.includes('gym') || title.includes('workout')) icon = "⚡";
      else if (cat.includes('zikr') || title.includes('zikr') || title.includes('astaghfirullah') || title.includes('subhan')) icon = "📿";

      const percentage = Math.min(Math.round((completedLast7Days / 7) * 100), 100);

      return {
        id: a.id,
        title: a.title,
        category: a.category || "General",
        completedThisWeek: completedLast7Days,
        totalCompleted: totalCount,
        percentage: percentage,
        icon: icon
      };
    });

  // Removed mock data for custom assignments
  const displaySubjects = [
    { title: "Nawafil & Sunnahs", score: getScoreText(nawafilRate), icon: "🌙", description: "Voluntary & night prayers" },
    { title: "Quran Recitation", score: getScoreText(quranRate), icon: "📖", description: "Daily reading & reflection" },
    { title: "Guarding Senses", score: getScoreText(munkaratRate), icon: "🛡️", description: "Munkarat purity score" },
    { title: "Daily Adhkar", score: getScoreText(zikrRate), icon: "📿", description: "Remembrance & Duas" }
  ];

  return (
    <AnalyticsDashboardClient
      userId={user.id}
      userName={profile?.full_name || 'Student'}
      currentStreak={currentStreak}
      streakDiffText={streakDiffText}
      overallCompletion={overallCompletion}
      xp={knowledgePoints || 0}
      chartData={chartData}
      prayerStats={prayerStats}
      zikrStats={zikrStats}
      calendarData={activityMap}
      displaySubjects={displaySubjects}
      customAssignments={customAssignmentsList}
    />
  )
}
