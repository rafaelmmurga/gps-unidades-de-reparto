import { useState, useEffect, useContext } from "react";
import { v4 } from "uuid";

import { SocketContext } from "../context/SocketContext";

const initialPath = [
  { lat: 18.22940669206061, lng: -95.60512109375001 },
  { lat: 16.709153992119276, lng: -96.67876171875001 },
  { lat: 19.020577, lng: -98.126357 },
];
const velocity = 10000;
const initialDate = new Date();

const getDistance = () => {
  // seconds between when the component loaded and now
  const differentInTime = (new Date() - initialDate) / 1000; // pass to seconds
  return differentInTime * velocity; // d = v*t -- thanks Newton!
};

export const useGoogleMap = () => {
  const { socket } = useContext(SocketContext);

  const [markers, setMarkers] = useState([]);
  const [progress, setProgress] = useState([]);
  const [path, setPath] = useState(initialPath);

  // función para agregar marcadores
  const agregarMarcador = (coords, id) => {
    setMarkers((markers) =>
      markers.concat([{ coords, id: id ?? v4(), style: {} }])
    );
  };

  // Funcion para actualizar la ubicación del marcador
  const actualizarPosicion = ({ id, lng, lat }) => {
    setMarkers((markers) => markers.concat([{ lng, lat, id }]));
  };

  // Escuchar los marcadores existentes
  useEffect(() => {
    socket.on("marcadores-activos", (marcadores) => {
      console.log("socket.on marcadores-activos");
      for (const key of Object.keys(marcadores)) {
        agregarMarcador(marcadores[key], key);
        socket.emit("marcador-nuevo", marcadores[key]);
      }
    });
  }, [socket]);

  // Mover marcador mediante sockets
  useEffect(() => {
    socket.on("marcador-actualizado", (marcador) => {
      console.log("socket.on marcador-actualizado");
      actualizarPosicion(marcador);
    });
  }, [socket]);

  // Escuchar nuevos marcadores
  useEffect(() => {
    socket.on("marcador-nuevo", (marcador) => {
      console.log("socket.on marcador-nuevo");
      agregarMarcador(marcador, marcador.id);
    });
  }, [socket]);

  useEffect(() => {
    if (progress.length > 0) {
      const distance = getDistance();
      if (!distance) {
        return;
      }

      let progress = path.filter(
        (coordinates) => coordinates.distance < distance
      );

      const nextLine = path.find(
        (coordinates) => coordinates.distance > distance
      );

      let point1, point2;

      if (nextLine) {
        point1 = progress[progress.length - 1];
        point2 = nextLine;
      } else {
        // it's the end, so use the latest 2
        point1 = progress[progress.length - 2];
        point2 = progress[progress.length - 1];
      }

      const point1LatLng = new window.google.maps.LatLng(
        point1.lat,
        point1.lng
      );
      const point2LatLng = new window.google.maps.LatLng(
        point2.lat,
        point2.lng
      );

      const angle = window.google.maps.geometry.spherical.computeHeading(
        point1LatLng,
        point2LatLng
      );
      const actualAngle = angle - 230;

      //const marker = markers[0];
      const markerUrl =
        "https://images.vexels.com/media/users/3/190486/isolated/preview/53c80f13feed9b8d40230febed56b94e-cami-oacute-n-verde-de-transporte-isom-eacute-trico-by-vexels.png";
      const marker = document.querySelector(`[src="${markerUrl}"]`);

      console.log("marker", marker);
      if (marker) {
        // when it hasn't loaded, it's null
        marker.style.transform = `rotate(${actualAngle}deg)`;
      }
    }
  }, [progress, path, markers]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("actualizar marcador");
      const distance = getDistance();
      if (!distance) {
        return;
      }
      let newProgress = path.filter(
        (coordinates) => coordinates.distance < distance
      );
      const nextLine = path.find(
        (coordinates) => coordinates.distance > distance
      );
      if (!nextLine) {
        setProgress(newProgress);
        return; // it's the end!
      }
      const lastLine = newProgress[newProgress.length - 1];

      const lastLineLatLng = new window.google.maps.LatLng(
        lastLine.lat,
        lastLine.lng
      );

      const nextLineLatLng = new window.google.maps.LatLng(
        nextLine.lat,
        nextLine.lng
      );

      // distance of this line
      const totalDistance = nextLine.distance - lastLine.distance;
      const percentage = (distance - lastLine.distance) / totalDistance;

      const position = window.google.maps.geometry.spherical.interpolate(
        lastLineLatLng,
        nextLineLatLng,
        percentage
      );

      newProgress = progress.concat({
        lat: position.lat(),
        lng: position.lng(),
      });
      setProgress(newProgress);
    }, 2000);
    return () => clearInterval(intervalId);
  }, [path, progress]);

  return {
    agregarMarcador,
    actualizarPosicion,
    markers,
    progress,
    path,
    setPath,
  };
};
