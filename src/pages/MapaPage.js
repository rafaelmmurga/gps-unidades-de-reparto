import React, { useContext } from "react";
import {
  GoogleMap,
  Marker,
  StreetViewPanorama,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";

import { SocketContext } from "../context/SocketContext";
import { useGoogleMap } from "../hooks/useGoogleMap";

const puntoInicial = {
  lng: -96.1429,
  lat: 19.18095,
  zoom: 7.6,
};

const options = {
  strokeColor: "#FF0000",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#FF0000",
  fillOpacity: 0.35,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
  radius: 30000,
  paths: [
    { lat: 18.22940669206061, lng: -95.60512109375001 },
    { lat: 16.709153992119276, lng: -96.67876171875001 },
  ],
  zIndex: 1,
};

const libraries = ["geometry"];

export function MapaPage() {
  const { socket } = useContext(SocketContext);
  const { markers, progress, path, setPath } = useGoogleMap();
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_KEY,
    libraries,
  });

  const RenderMap = () => {
    const onLoad = function onLoad(map) {
      const newPath = path.map((coordinates, i, array) => {
        if (i === 0) {
          return { ...coordinates, distance: 0 }; // it begins here!
        }
        const { lat: lat1, lng: lng1 } = coordinates;
        const latLong1 = new window.google.maps.LatLng(lat1, lng1);

        const { lat: lat2, lng: lng2 } = array[0];
        const latLong2 = new window.google.maps.LatLng(lat2, lng2);

        // in meters:
        const distance =
          window.google.maps.geometry.spherical.computeDistanceBetween(
            latLong1,
            latLong2
          );

        return { ...coordinates, distance };
      });

      console.log("newPath1", newPath);
      setPath(newPath);
    };
    console.log("progress", progress);
    return (
      <GoogleMap
        onLoad={onLoad}
        className="mapContainer"
        mapContainerStyle={{
          height: "98vh",
        }}
        zoom={puntoInicial.zoom}
        center={{ lng: puntoInicial.lng, lat: puntoInicial.lat }}
        onClick={(e) => {
          //agregarMarcador(e.latLng.toJSON());
          socket.emit("marcador-nuevo", e.latLng.toJSON());
        }}
      >
        <Marker
          //key={marker.id}
          draggable={false}
          //position={marker.coords}
          position={progress[progress.length - 1]}
          icon={{
            url: "https://images.vexels.com/media/users/3/190486/isolated/preview/53c80f13feed9b8d40230febed56b94e-cami-oacute-n-verde-de-transporte-isom-eacute-trico-by-vexels.png",
            //url: "https://images.vexels.com/media/users/3/154573/isolated/preview/bd08e000a449288c914d851cb9dae110-hatchback-car-top-view-silhouette-by-vexels.png",
            labelOrigin: { x: 32, y: 20 },
            scaledSize: {
              width: 60,
              height: 55,
            },
          }}
          //title="520"
          label={{
            text: "520",
            background: "#000",
            color: "#fff",
            fontSize: "11px",
            border: "1px solid #000",
          }}
        />
        <StreetViewPanorama />
        {/*<Polyline path={initialPath} options={options} />*/}
        <Polyline path={progress} options={options} />
      </GoogleMap>
    );
  };

  if (loadError) {
    return <div>El mapa no se puedo cargar</div>;
  }

  return isLoaded ? RenderMap() : <h1>Cargando mapa</h1>;
}
