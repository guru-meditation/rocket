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

var homePos = { lat: 52.93093371771126, lng: -1.1291451566825852 };
var svgUrl = 'https://www.svgrepo.com/show/22855/startup.svg';

var counter = 0;
var step = 200;

function initMap(): void {
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

            moveTheThing(mePos);
            rotateTheThing(mePos);
          },
          () => {
            handleLocationError(true, infoWindow, map.getCenter()!);
          }
        );
      } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter()!);
      }
    }, 10000/step);
  });

  rocket.setMap(map);
}

function moveTheThing(position) {
  console.log('here >>> - ' + counter++);
  var deltaLat = homePos.lat - position.lat;
  var deltaLng = homePos.lng - position.lng;

  counter = counter + 1;
  if (counter > step) {
    counter = 0;
  }

  var flyPos = {
    lat: position.lat + (deltaLat/step) * counter,
    lng: position.lng + (deltaLng/step) * counter,
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
