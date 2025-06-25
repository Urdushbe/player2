let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock faollashtirildi');

      wakeLock.addEventListener('release', () => {
        console.log('ℹ️ Wake Lock o‘chirildi');
      });
    } else {
      console.log('❌ Wake Lock API brauzeringizda ishlamaydi');
    }
  } catch (err) {
    console.error('Wake Lock xatosi:', err);
  }
}
