import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ExternalLink, Phone, Navigation, List, Map, Building2, Satellite } from "lucide-react";
import { Link } from "wouter";
import { GoogleMap, type MapMarker } from "@/components/GoogleMap";
import { STATUS_LABELS } from "@shared/statuses";

// Property Document Type Labels
const DOC_TYPE_LABELS: Record<string, string> = {
  Deed: "صك",
  Ihkam: "إحكام",
  Revivals: "إحياءات",
  Other: "أخرى",
};

export default function MapViewPage() {
  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  // Filter clients with coordinates (from database)
  const clientsWithCoords = clients?.filter(c => {
    if (!c.latitude || !c.longitude) return false;
    
    // Convert to numbers if they're strings
    const lat = typeof c.latitude === 'string' ? parseFloat(c.latitude) : c.latitude;
    const lng = typeof c.longitude === 'string' ? parseFloat(c.longitude) : c.longitude;
    
    // Check if valid numbers and within Saudi Arabia approximate bounds
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= 16 && lat <= 32 &&  // Saudi Arabia latitude range
           lng >= 34 && lng <= 56;    // Saudi Arabia longitude range
  }) || [];
  
  // Filter clients with location info
  const clientsWithLocation = clients?.filter(c => c.city || c.district) || [];

  // Group by city/district
  const byLocation = clientsWithLocation.reduce((acc, client) => {
    const location = client.city || client.district || "غير محدد";
    acc[location] = acc[location] || [];
    acc[location].push(client);
    return acc;
  }, {} as Record<string, typeof clients>);

  // تحويل العملاء إلى علامات على الخريطة
  const markers: MapMarker[] = clientsWithCoords.map(client => {
    const lat = typeof client.latitude === 'string' ? parseFloat(client.latitude) : client.latitude;
    const lng = typeof client.longitude === 'string' ? parseFloat(client.longitude) : client.longitude;
    
    return {
      id: client.id,
      latitude: lat,
      longitude: lng,
      title: client.name,
      description: client.city || client.district || client.refCode || undefined,
      status: STATUS_LABELS[client.status],
      onClick: () => setSelectedClient(client.id),
    };
  });

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedClient(marker.id as number);
  };

  const selectedClientData = clients?.find(c => c.id === selectedClient);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">الخارطة</h1>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الخارطة</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("map")}
          >
            <Map className="h-4 w-4 ml-1" />
            خريطة
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 ml-1" />
            قائمة
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{clientsWithCoords.length}</div>
                <div className="text-sm text-muted-foreground">موقع على الخريطة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Navigation className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{Object.keys(byLocation).length}</div>
                <div className="text-sm text-muted-foreground">منطقة مختلفة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{clients?.length || 0}</div>
                <div className="text-sm text-muted-foreground">إجمالي العملاء</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "map" ? (
        <>
          {/* Interactive Map */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Satellite className="h-5 w-5" />
                خريطة المواقع
                {clientsWithCoords.length > 0 && (
                  <Badge variant="secondary" className="mr-2">
                    {clientsWithCoords.length} موقع
                  </Badge>
                )}
                <Badge variant="outline" className="mr-2 text-xs">
                  Google Maps
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <GoogleMap
                className="rounded-b-lg"
                height="550px"
                center={{ lat: 24.7136, lng: 46.6753 }}
                zoom={6}
                markers={markers}
                onMarkerClick={handleMarkerClick}
                showSearch={true}
                showSatelliteToggle={true}
              />
            </CardContent>
          </Card>

          {/* Selected Client Info */}
          {selectedClientData && (
            <Card className="border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">العميل المحدد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link href={`/clients/${selectedClientData.id}`}>
                        <span className="font-semibold text-lg hover:text-primary cursor-pointer">
                          {selectedClientData.name}
                        </span>
                      </Link>
                      <Badge>{STATUS_LABELS[selectedClientData.status]}</Badge>
                      {selectedClientData.propertyDocType && (
                        <Badge variant="outline">
                          {DOC_TYPE_LABELS[selectedClientData.propertyDocType] || selectedClientData.propertyDocType}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {selectedClientData.city || selectedClientData.district || "موقع غير محدد"} • {selectedClientData.refCode}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/clients/${selectedClientData.id}`}>
                        <Button size="sm">عرض التفاصيل</Button>
                      </Link>
                      <Link href={`/clients/${selectedClientData.id}/archive`}>
                        <Button size="sm" variant="outline">المستندات</Button>
                      </Link>
                      {selectedClientData.mapLink && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={selectedClientData.mapLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 ml-1" />
                            خرائط جوجل
                          </a>
                        </Button>
                      )}
                      {selectedClientData.phone && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`tel:${selectedClientData.phone}`}>
                            <Phone className="h-3 w-3 ml-1" />
                            اتصال
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* List View - Clients with Coordinates */}
          {clientsWithCoords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  المواقع المسجلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {clientsWithCoords.map((client) => (
                    <div key={client.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/clients/${client.id}`}>
                            <span className="font-medium hover:text-primary cursor-pointer">{client.name}</span>
                          </Link>
                          <Badge className="text-xs">
                            {STATUS_LABELS[client.status]}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {client.city || client.district || "موقع غير محدد"} • {client.refCode}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedClient(client.id);
                              setViewMode("map");
                            }}
                          >
                            <Map className="h-3 w-3 ml-1" />
                            عرض على الخريطة
                          </Button>
                          {client.mapLink && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={client.mapLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 ml-1" />
                                فتح
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* By Location */}
          {Object.keys(byLocation).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  العملاء حسب المنطقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(byLocation).map(([location, locationClients]) => (
                    <div key={location} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {location}
                        </h3>
                        <Badge variant="secondary">{locationClients?.length} عميل</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {locationClients?.map((client) => (
                          <Link key={client.id} href={`/clients/${client.id}`}>
                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                              {client.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {clientsWithCoords.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد مواقع مسجلة</h3>
            <p className="text-muted-foreground mb-4">
              {clients && clients.length > 0 
                ? `لديك ${clients.length} عميل ولكن لا توجد إحداثيات مسجلة. أضف إحداثيات للعملاء لعرضهم على الخريطة.`
                : "أضف روابط خرائط جوجل أو إحداثيات للعملاء لعرضها هنا"}
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/clients">
                <Button variant="outline">عرض قائمة العملاء</Button>
              </Link>
              <Link href="/clients/new">
                <Button>إضافة عميل جديد</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}