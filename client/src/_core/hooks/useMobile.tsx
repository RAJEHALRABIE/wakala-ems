import { useState, useEffect } from 'react';

type Direction = 'ltr' | 'rtl';

export const useMobile = () => {
  const [dir, setDir] = useState<Direction>('rtl');
  
  useEffect(() => {
    // يمكنك إضافة منطق لتغيير الاتجاه هنا إذا احتجت
    // مثلاً بناءً على معلمة URL أو تفضيل المستخدم
  }, []);

  return { dir, setDir };
};
