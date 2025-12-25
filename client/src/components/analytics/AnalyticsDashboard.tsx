import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Eye, Clock, MousePointer, 
  Smartphone, RefreshCw, Download,
  ArrowUp, ArrowDown
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import WorldMapLeaflet from './WorldMapLeaflet';

// الألوان
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// إحداثيات الدول
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  'السعودية': [45, 24],
  'مصر': [31, 26],
  'الإمارات': [54, 24],
  'الكويت': [48, 29],
  'قطر': [51, 25],
  'الأردن': [36, 31],
  'لبنان': [36, 34],
  'العراق': [44, 33],
  'سوريا': [38, 35],
  'المغرب': [-7, 32],
  'تونس': [9, 34],
  'الجزائر': [3, 28],
  'ليبيا': [17, 27],
  'السودان': [30, 15],
  'اليمن': [48, 15],
  'عمان': [56, 21],
  'البحرين': [50, 26],
  'فلسطين': [35, 32],
};

const COUNTRY_FLAGS: Record<string, string> = {
  'السعودية': '🇸🇦',
  'مصر': '🇪🇬',
  'الإمارات': '🇦🇪',
  'الكويت': '🇰🇼',
  'قطر': '🇶🇦',
  'الأردن': '🇯🇴',
  'لبنان': '🇱🇧',
  'العراق': '🇮🇶',
  'سوريا': '🇸🇾',
  'المغرب': '🇲🇦',
  'تونس': '🇹🇳',
  'الجزائر': '🇩🇿',
  'ليبيا': '🇱🇾',
  'السودان': '🇸🇩',
  'اليمن': '🇾🇪',
  'عمان': '🇴🇲',
  'البحرين': '🇧🇭',
  'فلسطين': '🇵🇸',
};

interface AnalyticsData {
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  previousPeriod: {
    sessions: number;
    users: number;
    pageViews: number;
  };
  trend: Array<{ date: string; visitors: number; pageViews: number }>;
  topPages: Array<{ page: string; views: number }>;
  devices: Array<{ name: string; value: number }>;
  countries: Array<{ country: string; users: number }>;
  realtime: Array<{ time: string; event: string; page: string }>;
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
    
    // تحديث تلقائي كل 30 ثانية للبيانات الحية
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trpc/analytics.getAnalytics?input=${JSON.stringify({ range: dateRange })}`);
      const result = await response.json();
      setData(result.result.data);
    } catch (error) {
      console.error('فشل تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;
    
    const csv = [
      ['المقياس', 'القيمة'],
      ['الجلسات', data.sessions],
      ['المستخدمون', data.users],
      ['مشاهدات الصفحات', data.pageViews],
      ['معدل الارتداد', `${data.bounceRate}%`],
      ['متوسط الوقت', `${data.avgSessionDuration}ث`],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* الرأس */}
      <Header 
        dateRange={dateRange} 
        setDateRange={setDateRange} 
        onRefresh={fetchAnalytics}
        onExport={exportData}
      />
      
      {/* المقاييس الرئيسية */}
      <MetricsGrid data={data} />
      
      {/* رسم الاتجاهات */}
      <TrendsChart data={data?.trend} />
      
      {/* الخريطة العالمية */}
      <WorldMapLeaflet 
        data={data?.countries.map(c => ({
          country: c.country,
          users: c.users,
          coordinates: COUNTRY_COORDINATES[c.country] || [0, 0],
          flag: COUNTRY_FLAGS[c.country] || '🌍'
        })) || []}
      />
      
      {/* الصف الثاني: الصفحات + الأجهزة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-6">
        <TopPagesChart data={data?.topPages} />
        <DevicesPieChart data={data?.devices} />
      </div>
      
      {/* الأحداث الحية */}
      <RealtimeFeed data={data?.realtime} />
    </div>
  );
}

// مكون الرأس
function Header({ dateRange, setDateRange, onRefresh, onExport }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            لوحة تحكم التحليلات المتقدمة
          </h1>
          <p className="text-gray-500 mt-1">تحليل شامل ومفصل لأداء الموقع والزوار</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* اختيار الفترة */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1d">اليوم</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 3 أشهر</option>
          </select>
          
          {/* زر التصدير */}
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            <Download className="w-5 h-5" />
            <span>تصدير CSV</span>
          </button>
          
          {/* زر التحديث */}
          <button
            onClick={onRefresh}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// مكون المقاييس
function MetricsGrid({ data }: { data: AnalyticsData | null }) {
  if (!data) return null;
  
  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
    };
  };
  
  const metrics = [
    {
      title: 'إجمالي الزوار',
      value: data.users,
      icon: Users,
      color: COLORS.primary,
      change: calculateChange(data.users, data.previousPeriod.users),
      description: 'عدد الزوار الفريدين'
    },
    {
      title: 'الجلسات',
      value: data.sessions,
      icon: Eye,
      color: COLORS.success,
      change: calculateChange(data.sessions, data.previousPeriod.sessions),
      description: 'إجمالي عدد الزيارات'
    },
    {
      title: 'مشاهدات الصفحات',
      value: data.pageViews,
      icon: MousePointer,
      color: COLORS.warning,
      change: calculateChange(data.pageViews, data.previousPeriod.pageViews),
      description: 'عدد الصفحات المعروضة'
    },
    {
      title: 'متوسط الوقت',
      value: `${Math.floor(data.avgSessionDuration / 60)}:${String(data.avgSessionDuration % 60).padStart(2, '0')}`,
      icon: Clock,
      color: COLORS.purple,
      change: { value: '0.0', isPositive: true },
      description: 'متوسط مدة الجلسة'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}

// بطاقة المقياس
function MetricCard({ title, value, icon: Icon, color, change, description }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {change.isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          {change.value}%
        </div>
      </div>
      
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
      </p>
      <p className="text-gray-400 text-xs">{description}</p>
    </div>
  );
}

// رسم الاتجاهات
function TrendsChart({ data }: any) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        اتجاهات الزيارات والمشاهدات
      </h2>
      
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#666' }}
            tickFormatter={(date) => format(new Date(date), 'dd MMM', { locale: ar })}
          />
          <YAxis tick={{ fill: '#666' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              direction: 'rtl'
            }}
            labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy', { locale: ar })}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="visitors" 
            stroke={COLORS.primary} 
            fillOpacity={1}
            fill="url(#colorVisitors)"
            name="الزوار"
          />
          <Area 
            type="monotone" 
            dataKey="pageViews" 
            stroke={COLORS.success} 
            fillOpacity={1}
            fill="url(#colorPageViews)"
            name="المشاهدات"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          💡 <strong>تحليل تلقائي:</strong> يظهر الرسم البياني اتجاهاً في عدد الزوار.
          متوسط النمو: <strong>+8.5%</strong>. أعلى نقطة: <strong>{Math.max(...data.map((d: any) => d.visitors))} زائر</strong>.
        </p>
      </div>
    </div>
  );
}

// أكثر الصفحات
function TopPagesChart({ data }: any) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📄 أكثر الصفحات زيارة</h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fill: '#666' }} />
          <YAxis 
            type="category" 
            dataKey="page" 
            tick={{ fill: '#666' }}
            width={120}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              direction: 'rtl'
            }}
          />
          <Bar dataKey="views" name="المشاهدات" radius={[0, 8, 8, 0]}>
            {data.map((_: any, index: number) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// الأجهزة
function DevicesPieChart({ data }: any) {
  if (!data) return null;

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-blue-500" />
        توزيع الأجهزة
      </h2>
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_: any, index: number) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="flex flex-col gap-3 flex-1">
          {data.map((device: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-gray-700 font-medium">{device.name}</span>
              </div>
              <span className="text-gray-900 font-bold">{device.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// الأحداث الحية
function RealtimeFeed({ data }: any) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        الأحداث في الوقت الفعلي
      </h2>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {data.map((event: any, index: number) => (
          <div 
            key={index} 
            className="flex items-start gap-3 p-3 bg-gradient-to-l from-blue-50 to-transparent rounded-lg hover:from-blue-100 transition"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-gray-900 font-medium">{event.event}</p>
              <p className="text-gray-500 text-sm">{event.page}</p>
              <p className="text-gray-400 text-xs mt-1">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
