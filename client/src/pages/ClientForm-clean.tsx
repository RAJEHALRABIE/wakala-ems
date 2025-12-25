import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '../utils/trpc';
import { toast } from 'sonner';

// تعريف أنواع النزع (عربي سليم)
const EXPROPRIATION_TYPES = [
  { value: 'FULL', label: 'نزع كلي' },
  { value: 'PARTIAL', label: 'نزع جزئي' },
  { value: 'IMPROVEMENTS_ONLY', label: 'تعويض إحياءات' },
];

export function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // الحالة (State)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id_number: '',
    expropriation_type: 'FULL',
    area_sqm: '',
    expected_compensation_per_sqm: '',
    possession_ratio: '1.0',
    improvement_value: '',
    decision_number: '',
    decision_date: '',
    expropriated_area: '',
    property_description: '',
    city: '',
    district: '',
    remaining_area: '',
  });

  const { data: client, isLoading } = trpc.clients.get.useQuery(id!, {
    enabled: isEditMode,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        id_number: client.id_number || '',
        expropriation_type: client.expropriation_type || 'FULL',
        area_sqm: client.area_sqm?.toString() || '',
        expected_compensation_per_sqm: client.expected_compensation_per_sqm?.toString() || '',
        possession_ratio: client.possession_ratio?.toString() || '1.0',
        improvement_value: client.improvement_value?.toString() || '',
        decision_number: client.decision_number || '',
        decision_date: client.decision_date ? new Date(client.decision_date).toISOString().split('T')[0] : '',
        expropriated_area: client.expropriated_area?.toString() || '',
        property_description: client.property_description || '',
        city: client.city || '',
        district: client.district || '',
        remaining_area: client.remaining_area?.toString() || '',
      });
    }
  }, [client]);

  const totals = useMemo(() => {
    const price = parseFloat(formData.expected_compensation_per_sqm) || 0;
    const ratio = parseFloat(formData.possession_ratio) || 1.0;
    const improvements = parseFloat(formData.improvement_value) || 0;

    let chargeableArea = 0;
    if (formData.expropriation_type === 'PARTIAL') {
      chargeableArea = parseFloat(formData.expropriated_area) || 0;
    } else if (formData.expropriation_type === 'FULL') {
      chargeableArea = parseFloat(formData.area_sqm) || 0;
    }

    const totalCompensation = (chargeableArea * price * ratio) + improvements;
    const successFee = totalCompensation * 0.025;

    return { totalCompensation, successFee };
  }, [formData]);

  const mutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['clients.list']);
      navigate('/clients');
    },
    onError: (error) => {
      toast.error('حدث خطأ', {
        description: error.message,
        duration: 5000,
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      area_sqm: parseFloat(formData.area_sqm) || 0,
      expected_compensation_per_sqm: parseFloat(formData.expected_compensation_per_sqm) || 0,
      possession_ratio: parseFloat(formData.possession_ratio) || 1.0,
      improvement_value: parseFloat(formData.improvement_value) || 0,
      expropriated_area: parseFloat(formData.expropriated_area) || 0,
      remaining_area: parseFloat(formData.remaining_area) || 0,
      expected_compensation_total: totals.totalCompensation,
      success_fee: totals.successFee,
    };
    mutation.mutate(submissionData);
  };

  if (isLoading) return <div className="p-10 text-center">جاري تحميل البيانات...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            {isEditMode ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}
          </h1>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
            {formData.expropriation_type === 'FULL' ? 'نزع كلي' :
             formData.expropriation_type === 'PARTIAL' ? 'نزع جزئي' : 'إحياءات'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* بيانات المالك */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">بيانات المالك</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الثلاثي</label>
                <input required type="text" className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية</label>
                <input required type="text" className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  value={formData.id_number} onChange={e => setFormData({...formData, id_number: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
                <input required type="text" dir="ltr" className="w-full rounded-md border-gray-300 shadow-sm p-2 border text-right"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* تفاصيل العقار */}
          <section className="bg-blue-50/50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4">تفاصيل المعاملة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع النزع</label>
                <select className="w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
                  value={formData.expropriation_type} onChange={e => setFormData({...formData, expropriation_type: e.target.value})}>
                  {EXPROPRIATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة / الحي</label>
                <div className="flex gap-2">
                   <input placeholder="المدينة" className="w-1/2 rounded-md border-gray-300 shadow-sm p-2 border"
                     value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                   <input placeholder="الحي" className="w-1/2 rounded-md border-gray-300 shadow-sm p-2 border"
                     value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                </div>
              </div>
            </div>

            {formData.expropriation_type === 'FULL' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">إجمالي المساحة (م٢)</label>
                   <input type="number" className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                     value={formData.area_sqm} onChange={e => setFormData({...formData, area_sqm: e.target.value})} />
                </div>
              </div>
            )}

            {formData.expropriation_type === 'PARTIAL' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-yellow-50 p-4 rounded border border-yellow-200">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">المساحة المنزوعة (م٢)</label>
                   <input type="number" className="w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
                     value={formData.expropriated_area} onChange={e => setFormData({...formData, expropriated_area: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">المساحة المتبقية (م٢)</label>
                   <input type="number" className="w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
                     value={formData.remaining_area} onChange={e => setFormData({...formData, remaining_area: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">رقم القرار</label>
                   <input type="text" className="w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
                     value={formData.decision_number} onChange={e => setFormData({...formData, decision_number: e.target.value})} />
                 </div>
              </div>
            )}

            {(formData.expropriation_type === 'IMPROVEMENTS_ONLY' || formData.improvement_value) && (
              <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
                <label className="block text-sm font-medium text-green-800 mb-1">قيمة التعويض عن الإحياءات</label>
                <input type="number" className="w-full md:w-1/3 rounded-md border-green-300 shadow-sm p-2 border"
                  value={formData.improvement_value} onChange={e => setFormData({...formData, improvement_value: e.target.value})} />
              </div>
            )}
          </section>

          {/* التقييم المالي */}
          <section className="bg-gray-900 text-white p-6 rounded-lg shadow-inner">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">التقييم المالي</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
               <div>
                  <label className="block text-sm text-gray-300 mb-1">سعر المتر التقديري</label>
                  <input type="number" className="w-full rounded bg-gray-800 border-gray-700 text-white p-2"
                    value={formData.expected_compensation_per_sqm} onChange={e => setFormData({...formData, expected_compensation_per_sqm: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm text-gray-300 mb-1">نسبة التملك (1.0 = 100%)</label>
                  <input type="number" step="0.01" className="w-full rounded bg-gray-800 border-gray-700 text-white p-2"
                    value={formData.possession_ratio} onChange={e => setFormData({...formData, possession_ratio: e.target.value})} />
               </div>
               <div className="text-left">
                  <div className="text-xs text-gray-400">إجمالي التعويض المتوقع</div>
                  <div className="text-2xl font-bold text-green-400 font-mono">
                    {totals.totalCompensation.toLocaleString()} <span className="text-sm">ر.س</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    أتعاب السعي (2.5%): {totals.successFee.toLocaleString()} ر.س
                  </div>
               </div>
            </div>
          </section>

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/clients')} className="ml-3 px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
              إلغاء
            </button>
            <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md">
              حفظ وتوثيق
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
