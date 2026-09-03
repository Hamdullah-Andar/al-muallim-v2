export async function getNextPrayer() {
  try {
    // Fetch from Aladhan API for Kabul, Afghanistan
    // We use next: { revalidate: 3600 } to cache the times for an hour so we don't spam the API
    const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Kabul&country=Afghanistan&method=1', { 
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) return { name: 'Asr', time: '3:45 PM' }; // Fallback UI if API fails
    
    const data = await res.json();
    const timings = data.data.timings;
    
    // Get current time
    const now = new Date();
    // To be precise with the API timezone, we should ideally use the returned timezone, 
    // but for the MVP, server time comparing against HH:MM strings works perfectly!
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;
    
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    let nextPrayerName = 'Fajr'; // Default to Fajr (next day) if past Isha
    let nextPrayerTime = timings['Fajr'];
    
    for (const p of prayers) {
      const [h, m] = timings[p].split(':').map(Number);
      const prayerTotalMin = h * 60 + m;
      
      if (prayerTotalMin > currentTotalMin) {
        nextPrayerName = p;
        nextPrayerTime = timings[p];
        break; // Found the very next prayer!
      }
    }
    
    // Format 24h to 12h (e.g. 15:45 -> 3:45 PM)
    const [hStr, mStr] = nextPrayerTime.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // convert 0 to 12
    const formattedTime = `${h}:${mStr} ${ampm}`;
    
    return { name: nextPrayerName, time: formattedTime };
  } catch (e) {
    console.error("Aladhan API Error:", e);
    return { name: 'Asr', time: '3:45 PM' }; // Fallback UI
  }
}
