"use client";
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  SetStateAction,
  Dispatch,
} from "react";
import {
  GoogleMap,
  StandaloneSearchBox,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { MarkCoordinate } from "../page";
import Skeleton from "react-loading-skeleton";

const MapWithSearchBar = ({
  selectedCoordinates,
  map,
  setMap,
}: {
  selectedCoordinates: MarkCoordinate[];
  map: google.maps.Map | null;
  setMap: Dispatch<SetStateAction<google.maps.Map | null>>;
}) => {
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  const [center, setCenter] = useState<google.maps.LatLngLiteral>(
    selectedCoordinates.length > 0
      ? selectedCoordinates[0]
      : {
        lat: 36.7378,
        lng: -119.7871,
      }
  );

  const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = useMemo(
    () => ["places", "geometry", "drawing"],
    []
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    libraries,
    id: "google-map-script",
    version: "weekly",
  });

  useEffect(() => {
    if (selectedCoordinates && selectedCoordinates[0]) {
      setCenter(selectedCoordinates[0]);
    }
  }, [selectedCoordinates]);

  const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = useCallback(() => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const location = place.geometry.location;
          const latLng = {
            lat: location.lat(),
            lng: location.lng(),
          };
          setCenter(latLng);
          map?.panTo(latLng);
        }
      }
    }
  }, [searchBox, map]);

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    mapInstance.setOptions({
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT,
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      },
    });

    const streetView = mapInstance.getStreetView();
    streetView.addListener("visible_changed", () => {
      setIsStreetViewActive(streetView.getVisible());
    });
  }, []);

  const markerIcon = {
    path: "M 0,0 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0",
    fillColor: "black",
    fillOpacity: 1,
    strokeColor: "black",
    strokeWeight: 2,
    scale: 1.5,
  };

  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return (
      <div>
        <Skeleton height={700} width={"100%"} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <GoogleMap
        options={{
          mapTypeControl: false,
        }}
        center={center}
        zoom={12}
        mapContainerStyle={{ height: "700px", width: "100%" }}
        onLoad={handleMapLoad}
      >
        {!isStreetViewActive &&
          selectedCoordinates.length > 0 &&
          selectedCoordinates.map((marker, index) => (
            <Marker
              key={index}
              position={marker}
              icon={markerIcon}
              label={{
                text: marker.label || `${index + 1}`,
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            />
          ))}

        <StandaloneSearchBox onLoad={onLoad} onPlacesChanged={onPlacesChanged}>
          <input
            type="text"
            placeholder="Search for an address..."
            style={{
              boxSizing: `border-box`,
              border: `1px solid transparent`,
              width: `240px`,
              height: `42px`,
              padding: `0 12px`,
              borderRadius: `3px`,
              boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
              fontSize: `14px`,
              outline: `none`,
              textOverflow: `ellipses`,
              position: "absolute",
              top: "10px",
              left: "50%",
              marginLeft: "-120px",
            }}
          />
        </StandaloneSearchBox>
      </GoogleMap>
    </div>
  );
};

export default MapWithSearchBar;
