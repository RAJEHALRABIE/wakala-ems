/**
 * Sound Effects Hook - مؤثرات صوتية للتفاعلات
 * 
 * يوفر أصوات خفيفة وممتعة للتفاعلات المختلفة
 */

import { useCallback, useRef, useEffect } from "react";

// إعدادات الصوت
interface SoundSettings {
  enabled: boolean;
  volume: number;
}

// أنواع الأصوات
type SoundType = 
  | "click" 
  | "success" 
  | "error" 
  | "notification" 
  | "hover" 
  | "toggle"
  | "delete"
  | "upload"
  | "pop";

// ترددات الأصوات (Web Audio API)
const SOUND_FREQUENCIES: Record<SoundType, { freq: number; duration: number; type: OscillatorType; gain: number }> = {
  click: { freq: 800, duration: 0.05, type: "sine", gain: 0.15 },
  success: { freq: 880, duration: 0.15, type: "sine", gain: 0.2 },
  error: { freq: 200, duration: 0.2, type: "square", gain: 0.15 },
  notification: { freq: 660, duration: 0.1, type: "sine", gain: 0.2 },
  hover: { freq: 1200, duration: 0.02, type: "sine", gain: 0.05 },
  toggle: { freq: 600, duration: 0.08, type: "sine", gain: 0.1 },
  delete: { freq: 300, duration: 0.15, type: "sawtooth", gain: 0.1 },
  upload: { freq: 440, duration: 0.1, type: "sine", gain: 0.15 },
  pop: { freq: 1000, duration: 0.03, type: "sine", gain: 0.1 },
};

// إعدادات افتراضية
const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.5,
};

// مفتاح التخزين المحلي
const STORAGE_KEY = "wakala_sound_settings";

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<SoundSettings>(DEFAULT_SETTINGS);

  // تحميل الإعدادات من التخزين المحلي
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        settingsRef.current = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Could not load sound settings");
    }
  }, []);

  // إنشاء AudioContext عند الحاجة
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // تشغيل صوت
  const playSound = useCallback((type: SoundType) => {
    if (!settingsRef.current.enabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const config = SOUND_FREQUENCIES[type];
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.freq, ctx.currentTime);

      // تأثير success خاص (نغمتين)
      if (type === "success") {
        oscillator.frequency.setValueAtTime(660, ctx.currentTime);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      }

      // تأثير error خاص (نغمة هابطة)
      if (type === "error") {
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(200, ctx.currentTime + config.duration);
      }

      // تأثير notification خاص (نغمتين سريعتين)
      if (type === "notification") {
        oscillator.frequency.setValueAtTime(660, ctx.currentTime);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.05);
        oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      }

      // Envelope للصوت (fade in/out)
      const volume = config.gain * settingsRef.current.volume;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration + 0.01);
    } catch (e) {
      // تجاهل الأخطاء - الصوت اختياري
    }
  }, [getAudioContext]);

  // تحديث الإعدادات
  const updateSettings = useCallback((newSettings: Partial<SoundSettings>) => {
    settingsRef.current = { ...settingsRef.current, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsRef.current));
    } catch (e) {
      // تجاهل
    }
  }, []);

  // تفعيل/تعطيل الصوت
  const toggleSound = useCallback(() => {
    updateSettings({ enabled: !settingsRef.current.enabled });
    return settingsRef.current.enabled;
  }, [updateSettings]);

  // أصوات مختصرة
  const sounds = {
    click: () => playSound("click"),
    success: () => playSound("success"),
    error: () => playSound("error"),
    notification: () => playSound("notification"),
    hover: () => playSound("hover"),
    toggle: () => playSound("toggle"),
    delete: () => playSound("delete"),
    upload: () => playSound("upload"),
    pop: () => playSound("pop"),
  };

  return {
    playSound,
    sounds,
    toggleSound,
    updateSettings,
    isEnabled: () => settingsRef.current.enabled,
    getVolume: () => settingsRef.current.volume,
  };
}

// Hook للربط مع عناصر DOM
export function useSoundOnClick(soundType: SoundType = "click") {
  const { playSound } = useSoundEffects();
  
  return useCallback((callback?: () => void) => {
    return () => {
      playSound(soundType);
      callback?.();
    };
  }, [playSound, soundType]);
}

// Context للمشاركة عبر التطبيق
import { createContext, useContext, ReactNode } from "react";

const SoundContext = createContext<ReturnType<typeof useSoundEffects> | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const sounds = useSoundEffects();
  return <SoundContext.Provider value={sounds}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    // إرجاع mock إذا لم يكن داخل Provider
    return {
      playSound: () => {},
      sounds: {
        click: () => {},
        success: () => {},
        error: () => {},
        notification: () => {},
        hover: () => {},
        toggle: () => {},
        delete: () => {},
        upload: () => {},
        pop: () => {},
      },
      toggleSound: () => true,
      updateSettings: () => {},
      isEnabled: () => true,
      getVolume: () => 0.5,
    };
  }
  return context;
}

export default useSoundEffects;
