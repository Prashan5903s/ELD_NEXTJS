import React, { useMemo, useCallback, useState } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
  DirectionsService,
  DirectionsRenderer,
  Polyline,
} from "@react-google-maps/api";
import Skeleton from "react-loading-skeleton";
import { assignMarkerColors, markerSVGs } from "../constants";

export const SpeedingDetailsMap = (data) => {
  const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = useMemo(
    () => ["places", "geometry", "drawing"],
    []
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    libraries, // Make sure 'places' is included or adjust as needed
    id: "google-map-script",
    version: "weekly",
  });

  const [center, setCenter] = useState<google.maps.LatLngLiteral>({
    lat: 37.7749,
    lng: -122.4194,
  });
  const [hoveredMarker, setHoveredMarker] = useState(null);

  const getTooltipPosition = (position) => {
    // Slightly offset position to reduce map movement on hover
    return { lat: position.lat + 0.0003, lng: position.lng };
  };

  const markersData =
    data &&
    data["data"] &&
    data["data"][2] &&
    data["data"][2].map((item) => {
      const locationString = item?.location;
      const locationData = locationString ? JSON.parse(locationString) : null;
      const latitude = locationData?.GeoLocation?.Latitude;
      const longitude = locationData?.GeoLocation?.Longitude;
      const timeData = item?.event_date_time;

      // Convert timeData to the desired format: HH:mm AM/PM
      const formattedTime = timeData ? formatTime(timeData) : "12:00 AM"; // Fallback if timeData is null

      return {
        id: item.id,
        position: { lat: latitude, lng: longitude },
        speed: item.speed,
        time: formattedTime, // Use formatted time
        info: "Origin point", // You can replace this with item.info if your data includes info
      };
    });

  // Helper function to format the time into HH:mm AM/PM
  function formatTime(time) {
    const date = new Date(time);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${formattedMinutes} ${ampm}`;
  }

  const pathCoordinates =
    markersData && markersData.map((marker) => marker.position);

  return isLoaded && data && pathCoordinates ? (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={4}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        scrollwheel: true,
        draggable: true,
        streetViewControl: false,
      }}
    >
      <Polyline
        path={pathCoordinates}
        options={{
          strokeColor: "black",
          strokeOpacity: 0.8,
          strokeWeight: 2,
        }}
      />

      {assignMarkerColors(markersData).map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={{
            url: marker.markerURL,
            scaledSize: new google.maps.Size(20, 20), // Adjust size as needed
            anchor: new google.maps.Point(10, 10), // Center the icon on the position
          }}
          onMouseOver={() => setHoveredMarker(marker)}
          onMouseOut={() => setHoveredMarker(null)}
        />
      ))}

      {hoveredMarker && (
        <InfoWindow
          position={getTooltipPosition(hoveredMarker.position)}
          options={{ disableAutoPan: true }}
          onCloseClick={() => setHoveredMarker(null)}
        >
          <div style={{ paddingTop: "12px" }}>
            <span
              style={{
                fontSize: "14px",
                padding: "0px",
                marginRight: "12px",
              }}
            >
              {hoveredMarker.time}
            </span>
            <strong>{hoveredMarker.speed}mph</strong>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  ) : (
    <Skeleton height={450} />
  );
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "4px",
  borderLeft: 0,
};

const markersData = [
  {
    id: 1,
    position: { lat: 37.7749, lng: -122.4194 },
    speed: 98,
    time: "11:24 AM",
    info: "Origin point",
  },
  {
    id: 2,
    position: { lat: 37.4639, lng: -121.3763 },
    speed: 89,
    time: "11:25 AM",
    info: "Point 2 info",
  },
  {
    id: 3,
    position: { lat: 37.153, lng: -120.3331 },
    speed: 80,
    time: "11:26 AM",
    info: "Point 3 info",
  },
  {
    id: 4,
    position: { lat: 36.8421, lng: -119.2899 },
    speed: 71,
    time: "11:27 AM",
    info: "Point 4 info",
  },
  {
    id: 5,
    position: { lat: 36.5312, lng: -118.2468 },
    speed: 62,
    time: "11:28 AM",
    info: "Point 5 info",
  },
  {
    id: 6,
    position: { lat: 36.2203, lng: -117.2036 },
    speed: 53,
    time: "11:29 AM",
    info: "Point 6 info",
  },
  {
    id: 7,
    position: { lat: 35.9094, lng: -116.1605 },
    speed: 44,
    time: "11:30 AM",
    info: "Point 7 info",
  },
  {
    id: 8,
    position: { lat: 35.5985, lng: -115.1173 },
    speed: 35,
    time: "11:31 AM",
    info: "Point 8 info",
  },
  {
    id: 9,
    position: { lat: 35.2876, lng: -114.0742 },
    speed: 26,
    time: "11:32 AM",
    info: "Point 9 info",
  },
  {
    id: 10,
    position: { lat: 34.0522, lng: -118.2437 },
    speed: 50,
    time: "11:35 AM",
    info: "Destination point",
  },
];
