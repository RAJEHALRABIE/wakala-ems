/**
 * Google Maps Component - خريطة متقدمة
 * يدعم: صور الأقمار، البحث، اختيار الموقع
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Satellite, Map, Layers, Locate } from "lucide-react";

// الحصول على API Key من البيئة أو استخدام الافتراضي
const GOOGLE_MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAzQ4mBB3vDiUicaZdamMqDkP-OeVPVx-Q";

// تحميل Google Maps API
let googleMapsLoaded = false;
let googleMapsLoadingPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaded && (window as any).google?.maps) {
    return Promise.resolve();
  }
  
  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }
  
  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    // تحقق إذا كانت محملة مسبقاً
    if ((window as any).google?.maps) {
      googleMapsLoaded = true;
      resolve();
      return;
    }
    
    // إنشاء callback
    const callbackName = `googleMapsCallback_${Date.now()}`;
    (window as any)[callbackName] = () => {
      googleMapsLoaded = true;
      delete (window as any)[callbackName];
      resolve();
    };
    
    // تحميل السكريبت
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&callback=${callbackName}&language=ar&region=SA`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  
  return googleMapsLoadingPromise;
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

interface GoogleMapProps {
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  selectable?: boolean;
  selectedPosition?: { lat: number; lng: number } | null;
  onPositionSelect?: (lat: number, lng: number) => void;
  showSearch?: boolean;
  showMapTypeControl?: boolean;
  showSatelliteToggle?: boolean;
  height?: string;
}

export function GoogleMap({
  className,
  center = { lat: 24.7136, lng: 46.6753 },
  zoom = 6,
  markers = [],
  onMapClick,
  onMarkerClick,
  selectable = false,
  selectedPosition,
  onPositionSelect,
  showSearch = false,
  showMapTypeControl = true,
  showSatelliteToggle = true,
  height = "500px",
}: GoogleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const selectedMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid">("roadmap");
  const [searchQuery, setSearchQuery] = useState("");

  // تهيئة الخريطة
  useEffect(() => {
    let mounted = true;
    
    async function initMap() {
      try {
        await loadGoogleMaps();
        
        if (!mounted || !mapContainer.current) return;
        
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
        
        // إنشاء الخريطة
        const map = new Map(mapContainer.current, {
          center: center,
          zoom: zoom,
          mapId: "wakala_map",
          mapTypeId: mapType,
          mapTypeControl: showMapTypeControl,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_LEFT,
          },
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: "greedy",
        });
        
        // معالجة النقر على الخريطة
        if (selectable || onMapClick) {
          map.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              
              if (onMapClick) onMapClick(lat, lng);
              if (selectable && onPositionSelect) onPositionSelect(lat, lng);
            }
          });
        }
        
        mapRef.current = map;
        setIsLoading(false);
        
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError("فشل تحميل خرائط جوجل. تحقق من اتصال الإنترنت.");
        setIsLoading(false);
      }
    }
    
    initMap();
    
    return () => {
      mounted = false;
    };
  }, []);

  // تحديث نوع الخريطة
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // تحديث المركز والزوم
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
    }
  }, [center.lat, center.lng, zoom]);

  // إضافة العلامات
  useEffect(() => {
    // التأكد من أن الخريطة جاهزة
    if (!mapRef.current || !googleMapsLoaded) return;
    
    // التأكد من تحميل مكتبة marker
    if (!(google.maps as any).marker?.AdvancedMarkerElement) {
      // إعادة المحاولة بعد قليل
      const timer = setTimeout(() => {
        // سيتم تشغيل useEffect مرة أخرى
      }, 100);
      return () => clearTimeout(timer);
    }
    
    // حذف العلامات القديمة
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];
    
    if (markers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    let hasValidMarkers = false;
    
    markers.forEach(markerData => {
      const position = { lat: markerData.latitude, lng: markerData.longitude };
      
      // التحقق من صحة الإحداثيات
      if (isNaN(position.lat) || isNaN(position.lng)) {
        console.warn('Invalid marker coordinates:', markerData);
        return;
      }
      
      bounds.extend(position);
      hasValidMarkers = true;
      
      // إنشاء محتوى العلامة
      const markerContent = document.createElement("div");
      markerContent.className = "flex flex-col items-center cursor-pointer transform hover:scale-110 transition-transform";
      markerContent.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          white-space: nowrap;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          direction: rtl;
        ">
          ${markerData.title}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid #1d4ed8;
          margin-top: -1px;
        "></div>
      `;
      
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position,
        title: markerData.title,
        content: markerContent,
      });
      
      // معالجة النقر
      marker.addListener("click", () => {
        if (markerData.onClick) markerData.onClick();
        if (onMarkerClick) onMarkerClick(markerData);
        
        // إنشاء InfoWindow
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="direction: rtl; text-align: right; padding: 8px; min-width: 180px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${markerData.title}</h3>
              ${markerData.description ? `<p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;">${markerData.description}</p>` : ""}
              ${markerData.status ? `<span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${markerData.status}</span>` : ""}
            </div>
          `,
        });
        infoWindow.open(mapRef.current, marker);
      });
      
      markersRef.current.push(marker);
    });
    
    // ضبط الحدود فقط إذا كان هناك علامات صحيحة
    if (hasValidMarkers && markers.length > 1) {
      // استخدام setTimeout للتأكد من رسم العلامات أولاً
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitBounds(bounds, 50);
        }
      }, 100);
    } else if (markers.length === 1) {
      mapRef.current.setCenter({ lat: markers[0].latitude, lng: markers[0].longitude });
      mapRef.current.setZoom(14);
    }
    
  }, [markers, onMarkerClick]);

  // علامة الموقع المحدد
  useEffect(() => {
    if (!mapRef.current || !googleMapsLoaded || !selectable) return;
    
    // حذف العلامة القديمة
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.map = null;
      selectedMarkerRef.current = null;
    }
    
    if (selectedPosition) {
      const markerContent = document.createElement("div");
      markerContent.innerHTML = `
        <div style="
          background: #22c55e;
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); color: white; font-size: 16px;">✓</span>
        </div>
      `;
      
      selectedMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: selectedPosition,
        content: markerContent,
        gmpDraggable: true,
      });
      
      // السماح بسحب العلامة
      selectedMarkerRef.current.addListener("dragend", () => {
        const pos = selectedMarkerRef.current?.position;
        if (pos && onPositionSelect) {
          onPositionSelect(pos.lat as number, pos.lng as number);
        }
      });
      
      mapRef.current.setCenter(selectedPosition);
      mapRef.current.setZoom(16);
    }
    
  }, [selectedPosition, selectable, onPositionSelect]);

  // تهيئة البحث
  useEffect(() => {
    if (!mapRef.current || !showSearch || !searchInputRef.current || !googleMapsLoaded) return;
    
    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: "sa" },
      fields: ["geometry", "name", "formatted_address"],
    });
    
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        mapRef.current?.setCenter({ lat, lng });
        mapRef.current?.setZoom(16);
        
        if (selectable && onPositionSelect) {
          onPositionSelect(lat, lng);
        }
      }
    });
    
    autocompleteRef.current = autocomplete;
    
  }, [isLoading, showSearch, selectable, onPositionSelect]);

  // البحث اليدوي
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !mapRef.current) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: searchQuery, region: "sa" },
      (results, status) => {
        if (status === "OK" && results?.[0]) {
          const location = results[0].geometry.location;
          mapRef.current?.setCenter(location);
          mapRef.current?.setZoom(16);
          
          if (selectable && onPositionSelect) {
            onPositionSelect(location.lat(), location.lng());
          }
        }
      }
    );
  }, [searchQuery, selectable, onPositionSelect]);

  // تحديد موقع المستخدم
  const locateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapRef.current?.setCenter(pos);
          mapRef.current?.setZoom(15);
          
          if (selectable && onPositionSelect) {
            onPositionSelect(pos.lat, pos.lng);
          }
        },
        () => {
          console.error("Error getting location");
        }
      );
    }
  }, [selectable, onPositionSelect]);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-lg", className)} style={{ height }}>
        <div className="text-center p-4">
          <p className="text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ height }}>
      {/* شريط البحث */}
      {showSearch && !isLoading && (
        <div className="absolute top-3 right-3 left-3 z-10 flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="ابحث عن مكان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pr-10 bg-white/95 backdrop-blur shadow-lg"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="secondary" size="icon" onClick={locateUser} className="shadow-lg">
            <Locate className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* أزرار نوع الخريطة */}
      {showSatelliteToggle && !isLoading && (
        <div className="absolute bottom-3 right-3 z-10 flex gap-1 bg-white/95 backdrop-blur rounded-lg shadow-lg p-1">
          <Button
            variant={mapType === "roadmap" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMapType("roadmap")}
            className="h-8"
          >
            <Map className="h-4 w-4 ml-1" />
            خريطة
          </Button>
          <Button
            variant={mapType === "satellite" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMapType("satellite")}
            className="h-8"
          >
            <Satellite className="h-4 w-4 ml-1" />
            قمر صناعي
          </Button>
          <Button
            variant={mapType === "hybrid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMapType("hybrid")}
            className="h-8"
          >
            <Layers className="h-4 w-4 ml-1" />
            هجين
          </Button>
        </div>
      )}
      
      {/* رسالة الاختيار */}
      {selectable && !isLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          📍 اضغط على الخريطة لتحديد الموقع (أو اسحب العلامة)
        </div>
      )}
      
      {/* التحميل */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">جاري تحميل خرائط جوجل...</p>
          </div>
        </div>
      )}
      
      {/* الخريطة */}
      <div 
        ref={mapContainer} 
        className={cn("w-full h-full rounded-lg", isLoading && "invisible")}
      />
    </div>
  );
}

export default GoogleMap;
