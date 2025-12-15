/**
 * Sound Effects Library - مكتبة المؤثرات الصوتية
 * مؤثرات صوتية خفيفة لتحسين تجربة المستخدم
 */

// Audio Context للتحكم في الصوت
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// توليد نغمة بسيطة
function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.1) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // تجاهل الأخطاء - الصوت اختياري
  }
}

// المؤثرات الصوتية المتاحة
export const sounds = {
  // نقرة خفيفة
  click: () => playTone(800, 0.05, "sine", 0.08),
  
  // نجاح
  success: () => {
    playTone(523.25, 0.1, "sine", 0.1); // C5
    setTimeout(() => playTone(659.25, 0.1, "sine", 0.1), 100); // E5
    setTimeout(() => playTone(783.99, 0.15, "sine", 0.1), 200); // G5
  },
  
  // خطأ
  error: () => {
    playTone(200, 0.15, "sawtooth", 0.08);
    setTimeout(() => playTone(150, 0.2, "sawtooth", 0.08), 150);
  },
  
  // تنبيه
  notification: () => {
    playTone(880, 0.1, "sine", 0.08);
    setTimeout(() => playTone(1100, 0.15, "sine", 0.08), 120);
  },
  
  // تبديل
  toggle: () => playTone(600, 0.05, "triangle", 0.06),
  
  // حذف
  delete: () => {
    playTone(400, 0.1, "sine", 0.08);
    setTimeout(() => playTone(300, 0.15, "sine", 0.08), 100);
  },
  
  // إضافة
  add: () => {
    playTone(400, 0.08, "sine", 0.08);
    setTimeout(() => playTone(600, 0.1, "sine", 0.08), 80);
  },
  
  // تحديث
  refresh: () => playTone(500, 0.08, "triangle", 0.06),
  
  // فتح قائمة
  menuOpen: () => playTone(400, 0.05, "sine", 0.05),
  
  // إغلاق قائمة  
  menuClose: () => playTone(350, 0.05, "sine", 0.05),
  
  // hover
  hover: () => playTone(600, 0.02, "sine", 0.03),
  
  // إرسال
  send: () => {
    playTone(523.25, 0.08, "sine", 0.08);
    setTimeout(() => playTone(698.46, 0.1, "sine", 0.08), 80);
  },
  
  // استلام
  receive: () => {
    playTone(698.46, 0.08, "sine", 0.08);
    setTimeout(() => playTone(523.25, 0.1, "sine", 0.08), 80);
  },
};

// التحقق من تفعيل الصوت
let soundEnabled = true;

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  localStorage.setItem("wakala-sounds", enabled ? "on" : "off");
}

export function initSoundSettings(): void {
  const saved = localStorage.getItem("wakala-sounds");
  soundEnabled = saved !== "off";
}

// تشغيل صوت مع التحقق
export function playSound(sound: keyof typeof sounds): void {
  if (soundEnabled) {
    sounds[sound]();
  }
}

export default sounds;
