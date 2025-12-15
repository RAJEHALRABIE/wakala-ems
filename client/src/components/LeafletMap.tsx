/**
 * Leaflet Map Component - خريطة تفاعلية مجانية
 * لا تحتاج مفتاح API
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Leaflet CSS يجب تحميله
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// تحميل Leaflet ديناميكياً
let leafletLoaded = false;
let leafletLoadingPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (leafletLoaded && (window as any).L) {
    return Promise.resolve();
  }
  
  if (leafletLoadingPromise) {
    return leafletLoadingPromise;
  }
  
  leafletLoadingPromise = new Promise((resolve, reject) => {
    // تحميل CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    
    // تحميل JS
    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.onload = () => {
        leafletLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    } else if ((window as any).L) {
      leafletLoaded = true;
      resolve();
    }
  });
  
  return leafletLoadingPromise;
}

// أنواع البيانات
export interface MapMarker {
  id: number | string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  status?: string;
  onClick?: () => void;
}

interface LeafletMapProps {
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  selectable?: boolean; // للسماح باختيار موقع
  selectedPosition?: { lat: number; lng: number } | null;
  onPositionSelect?: (lat: number, lng: number) => void;
}

export function LeafletMap({
  className,
  center = { lat: 24.7136, lng: 46.6753 }, // الرياض افتراضياً
  zoom = 6,
  markers = [],
  onMapClick,
  onMarkerClick,
  selectable = false,
  selectedPosition,
  onPositionSelect,
}: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const selectedMarkerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // تهيئة الخريطة
  useEffect(() => {
    let mounted = true;
    
    async function initMap() {
      try {
        await loadLeaflet();
        
        if (!mounted || !mapContainer.current) return;
        
        const L = (window as any).L;
        
        // إذا الخريطة موجودة، احذفها أولاً
        if (mapRef.current) {
          mapRef.current.remove();
        }
        
        // إنشاء الخريطة
        const map = L.map(mapContainer.current, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: true,
          attributionControl: true,
        });
        
        // إضافة طبقة الخريطة (OpenStreetMap)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        
        // معالجة النقر على الخريطة
        if (selectable || onMapClick) {
          map.on("click", (e: any) => {
            const { lat, lng } = e.latlng;
            
            if (onMapClick) {
              onMapClick(lat, lng);
            }
            
            if (selectable && onPositionSelect) {
              onPositionSelect(lat, lng);
            }
          });
        }
        
        mapRef.current = map;
        setIsLoading(false);
        
      } catch (err) {
        console.error("Error loading map:", err);
        setError("فشل تحميل الخريطة");
        setIsLoading(false);
      }
    }
    
    initMap();
    
    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // تحديث المركز والزوم
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center.lat, center.lng, zoom]);

  // إضافة/تحديث العلامات
  useEffect(() => {
    if (!mapRef.current || !(window as any).L) return;
    
    const L = (window as any).L;
    
    // حذف العلامات القديمة
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // إضافة العلامات الجديدة
    markers.forEach(markerData => {
      // أيقونة مخصصة
      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background: #3b82f6;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-size: 14px;
            ">📍</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
      
      const marker = L.marker([markerData.latitude, markerData.longitude], { icon })
        .addTo(mapRef.current);
      
      // Popup للمعلومات
      const popupContent = `
        <div style="text-align: right; direction: rtl; min-width: 150px;">
          <strong>${markerData.title}</strong>
          ${markerData.description ? `<br><span style="color: #666;">${markerData.description}</span>` : ""}
          ${markerData.status ? `<br><span style="color: #3b82f6;">${markerData.status}</span>` : ""}
        </div>
      `;
      marker.bindPopup(popupContent);
      
      // معالجة النقر
      if (onMarkerClick || markerData.onClick) {
        marker.on("click", () => {
          if (markerData.onClick) markerData.onClick();
          if (onMarkerClick) onMarkerClick(markerData);
        });
      }
      
      markersRef.current.push(marker);
    });
    
    // تكبير لإظهار كل العلامات
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
    
  }, [markers, onMarkerClick]);

  // علامة الموقع المحدد (للاختيار)
  useEffect(() => {
    if (!mapRef.current || !(window as any).L || !selectable) return;
    
    const L = (window as any).L;
    
    // حذف العلامة القديمة
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
    
    // إضافة علامة جديدة إذا وجد موقع محدد
    if (selectedPosition) {
      const icon = L.divIcon({
        className: "selected-marker",
        html: `
          <div style="
            background: #22c55e;
            width: 40px;
            height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 4px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-size: 18px;
            ">✓</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
      
      selectedMarkerRef.current = L.marker(
        [selectedPosition.lat, selectedPosition.lng],
        { icon, draggable: true }
      ).addTo(mapRef.current);
      
      // السماح بسحب العلامة
      selectedMarkerRef.current.on("dragend", (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        if (onPositionSelect) {
          onPositionSelect(lat, lng);
        }
      });
      
      // تركيز على الموقع
      mapRef.current.setView([selectedPosition.lat, selectedPosition.lng], 15);
    }
    
  }, [selectedPosition, selectable, onPositionSelect]);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-lg", className)}>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className={cn("w-full h-full rounded-lg", isLoading && "invisible")}
        style={{ minHeight: "400px" }}
      />
      {selectable && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-md z-[1000] text-sm">
          📍 اضغط على الخريطة لتحديد الموقع
        </div>
      )}
    </div>
  );
}

export default LeafletMap;
