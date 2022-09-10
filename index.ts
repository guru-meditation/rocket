/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// Note: This example requires that you consent to location sharing when
// prompted by your browser. If you see the error "The Geolocation service
// failed.", it means you probably did not give permission for the browser to
// locate you.

import $ from 'jquery';

let map: google.maps.Map,
  infoWindow: google.maps.InfoWindow,
  rocket: google.maps.Marker;

var homePos = { lat: 52.93362396888282, lng: -1.1295868440978964 };
var svgUrl = 'https://www.svgrepo.com/show/22855/startup.svg';

var counter = 0;

function initMap(): void {
  var step = 50;
  infoWindow = new google.maps.InfoWindow();

  rocket = new google.maps.Marker({
    icon: {
      url: svgUrl, // url
      scaledSize: new google.maps.Size(50, 50),
      size: new google.maps.Size(50, 50),
      origin: new google.maps.Point(0, 0), // origin
      anchor: new google.maps.Point(0, 0), // anchor
    },
  });

  map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
    zoom: 6,
  });

  var mapDiv = $('#map');

  var mapDim = {
    height: mapDiv.height(),
    width: mapDiv.width(),
  };

  var pub = createMarkerForPoint(homePos);
  pub.setIcon('beer.svg');
  pub.setMap(map);

  google.maps.event.addListenerOnce(map, 'idle', () => {
    setInterval(function () {
      var mePos = { lat: 0, lng: 0 };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position: GeolocationPosition) => {
            mePos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            moveTheThing(mePos, step);
            rotateTheThing(mePos);

            calc_distance(mePos, homePos);

            var bounds = createBoundsForMarkers(mePos, homePos);

            map.setZoom(getBoundsZoomLevel(bounds, mapDim) - 2);
          },
          () => {
            handleLocationError(true, infoWindow, map.getCenter()!);
          }
        );
      } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter()!);
      }
    }, 5000 / step);
  });

  rocket.setMap(map);
}

function createBoundsForMarkers(m1, m2) {
  var bounds = new google.maps.LatLngBounds();

  bounds.extend(m1);
  bounds.extend(m2);

  console.log("bounds ", bounds.toString());


  return bounds;
}

function createMarkerForPoint(point) {
  return new google.maps.Marker({
    position: new google.maps.LatLng(point.lat, point.lng),
  });
}

function getBoundsZoomLevel(bounds, mapDim) {
  var WORLD_DIM = { height: 256, width: 256 };
  var ZOOM_MAX = 21;

  function latRad(lat) {
    var sin = Math.sin((lat * Math.PI) / 180);
    var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  function zoom(mapPx, worldPx, fraction) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();

  var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

  var lngDiff = ne.lng() - sw.lng();
  var lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;

  var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
  var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

function calc_distance(mk1, mk2) {
  var R = 3958.8; // Radius of the Earth in miles
  var rlat1 = mk1.lat * (Math.PI / 180); // Convert degrees to radians
  var rlat2 = mk2.lat * (Math.PI / 180); // Convert degrees to radians
  var difflat = rlat2 - rlat1; // Radian difference (latitudes)
  var difflon = (mk2.lng - mk1.lng) * (Math.PI / 180); // Radian difference (longitudes)

  var d =
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
          Math.cos(rlat1) *
            Math.cos(rlat2) *
            Math.sin(difflon / 2) *
            Math.sin(difflon / 2)
      )
    );
  return d;
}

function moveTheThing(position, step) {
  var deltaLat = (position.lat - homePos.lat) / step;
  var deltaLng = (position.lng - homePos.lng) / step;

  counter = counter + 1;
  if (counter > step) {
    counter = 0;
  }

  var flyPos = {
    lat: position.lat - deltaLat * counter,
    lng: position.lng - deltaLng * counter,
  };

  drawTheThing(flyPos);
}

function drawTheThing(position) {
  rocket.setPosition(position);
  map.setCenter(position);
}

function rotateTheThing(position) {
  if (position.lat != 0) {
    var rotationAngle = calculateAngle(position, homePos);

    console.log('rotationAngle - ' + rotationAngle);

    $('img[src="' + svgUrl + '"]').css({
      transform: 'rotate(' + rotationAngle + 'deg)',
      'transform-origin': '25px 25px',
    });
  }
}

function handleLocationError(
  browserHasGeolocation: boolean,
  infoWindow: google.maps.InfoWindow,
  pos: google.maps.LatLng
) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? 'Error: The Geolocation service failed.'
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

function calculateAngle(pos1, pos2) {
  var p1 = {
    x: pos1.lat,
    y: pos1.lng,
  };

  var p2 = {
    x: pos2.lat,
    y: pos2.lng,
  };

  return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
}

declare global {
  interface Window {
    initMap: () => void;
  }
}

window.initMap = initMap;
export {};
