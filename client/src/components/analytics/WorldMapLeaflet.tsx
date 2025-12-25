import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// إصلاح أيقونات Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface CountryData {
  country: string;
  users: number;
  coordinates: [number, number];
  flag: string;
}

interface WorldMapProps {
  data: CountryData[];
}

export default function WorldMapLeaflet({ data }: WorldMapProps) {
  // حساب الحد الأقصى للمستخدمين
  const maxUsers = Math.max(...data.map(d => d.users));
  
  // دالة لحساب حجم الدائرة
  const getRadius = (users: number) => {
    return Math.sqrt(users / maxUsers) * 40 + 5;
  };
  
  // دالة لحساب اللون
  const getColor = (users: number) => {
    const ratio = users / maxUsers;
    if (ratio < 0.33) return '#3b82f6'; // أزرق
    if (ratio < 0.66) return '#8b5cf6'; // بنفسجي
    return '#ef4444'; // أحمر
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        🗺️ الخريطة العالمية للزوار
      </h2>
      
      {/* الخريطة */}
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '500px' }}>
        <MapContainer
          center={[25, 45]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* رسم النقاط */}
          {data.map((country, index) => (
            <CircleMarker
              key={index}
              center={[country.coordinates[1], country.coordinates[0]]}
              radius={getRadius(country.users)}
              fillColor={getColor(country.users)}
              fillOpacity={0.7}
              color="#fff"
              weight={2}
            >
              <Popup>
                <div className="text-center p-2">
                  <div className="text-2xl mb-2">{country.flag}</div>
                  <div className="font-bold text-gray-900">{country.country}</div>
                  <div className="text-blue-600 font-bold text-lg">{country.users} زائر</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      
      {/* الأسطورة */}
      <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">أقل من {Math.floor(maxUsers / 3)} زائر</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500" />
          <span className="text-sm text-gray-600">متوسط</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">أكثر من {Math.floor(maxUsers * 2 / 3)} زائر</span>
        </div>
      </div>
      
      {/* قائمة الدول */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((country, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{country.flag}</span>
              <span className="text-gray-700 font-medium">{country.country}</span>
            </div>
            <span className="text-blue-600 font-bold">{country.users}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
