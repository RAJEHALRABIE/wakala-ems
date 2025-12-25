import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook لجلب إحصائيات الحالات الـ11 من النظام
 * يُستخدم في StatusDashboard لعرض عدد الملفات في كل حالة
 * 
 * @returns {Object} كائن يحتوي على:
 *   - counts: سجل (Record) من [statusKey]: count لكل حالة
 *   - loading: حالة التحميل
 *   - error: خطأ إذا حدث
 *   - refetch: دالة لإعادة جلب البيانات يدوياً
 */
export function useStatusCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // استخدام tRPC query لجلب البيانات
  const { data, isLoading, error: queryError, refetch } = trpc.clients.getStatusCounts.useQuery();

  useEffect(() => {
    if (data) {
      setCounts(data);
      setError(null);
    }
    if (queryError) {
      setError(queryError instanceof Error ? queryError : new Error(String(queryError)));
      console.error('فشل في جلب إحصائيات الحالات:', queryError);
    }
    setLoading(isLoading);
  }, [data, isLoading, queryError]);

  // دالة لإعادة جلب البيانات يدوياً
  const manualRefetch = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  // تحديث البيانات كل 60 ثانية (دقيقة واحدة)
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        refetch();
      }, 60000); // 60 ثانية

      return () => clearInterval(interval);
    }
  }, [loading, refetch]);

  return { 
    counts, 
    loading, 
    error,
    refetch: manualRefetch,
    lastUpdated: new Date()
  };
}

/**
 * Hook بديل باستخدام fetch مباشرة (إذا لزم الأمر)
 */
export function useStatusCountsFallback() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      // يمكن استخدام REST API بدلاً من tRPC إذا لزم الأمر
      const response = await fetch('/api/clients/status-counts');
      
      if (!response.ok) throw new Error('فشل في جلب البيانات');
      const data = await response.json();
      
      setCounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('خطأ غير معروف'));
      console.error('فشل في جلب إحصائيات الحالات:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    
    // تحديث تلقائي كل دقيقة
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  return { 
    counts, 
    loading, 
    error,
    refetch: fetchCounts
  };
}
