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
    soldierMarker: google.maps.Marker;

var homePos = {lat: 52.95381219378043, lng: -1.145829369884382};
var soldierUrl = './soldier.svg';

var counter = 0;
var curveMarker;
var curvature = 0.7;

function initMap(): void {
    var step = 100;
    infoWindow = new google.maps.InfoWindow();

    soldierMarker = new google.maps.Marker({
        icon: {
            url: soldierUrl, // url
            scaledSize: new google.maps.Size(50, 50)
        },
    });

    console.log("VITE_GOOGLE_MAPS_API_KEY - " + import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

    map = new google.maps.Map(document.getElementById("map") as HTMLElement,
        {
            center: { lat: 40.674, lng: -73.945 },
            zoom: 12,
            styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                {
                    featureType: "administrative.locality",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#d59563" }],
                },
                {
                    featureType: "poi",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#d59563" }],
                },
                {
                    featureType: "poi.park",
                    elementType: "geometry",
                    stylers: [{ color: "#263c3f" }],
                },
                {
                    featureType: "poi.park",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#6b9a76" }],
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#38414e" }],
                },
                {
                    featureType: "road",
                    elementType: "geometry.stroke",
                    stylers: [{ color: "#212a37" }],
                },
                {
                    featureType: "road",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#9ca5b3" }],
                },
                {
                    featureType: "road.highway",
                    elementType: "geometry",
                    stylers: [{ color: "#746855" }],
                },
                {
                    featureType: "road.highway",
                    elementType: "geometry.stroke",
                    stylers: [{ color: "#1f2835" }],
                },
                {
                    featureType: "road.highway",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#f3d19c" }],
                },
                {
                    featureType: "transit",
                    elementType: "geometry",
                    stylers: [{ color: "#2f3948" }],
                },
                {
                    featureType: "transit.station",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#d59563" }],
                },
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#17263c" }],
                },
                {
                    featureType: "water",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#515c6d" }],
                },
                {
                    featureType: "water",
                    elementType: "labels.text.stroke",
                    stylers: [{ color: "#17263c" }],
                },
            ],
        });

    var mapDiv = $('#map');

    var mapDim = {
        height: mapDiv.height(),
        width: mapDiv.width(),
    };

    var barracks = createMarkerForPoint(homePos);
    barracks.setIcon('./base.svg');
    barracks.setMap(map);

    var path = new google.maps.MVCArray();
    var service = new google.maps.DirectionsService();

    // Set the Path Stroke Color
    var poly = new google.maps.Polyline({ map: map, strokeColor: '#4986E7' });

    var lat_lng = new Array;
    //Loop and Draw Path Route between the Points on MAP
    for (var i = 0; i < lat_lng.length; i++) {
        if ((i + 1) < lat_lng.length) {
            var src = lat_lng[i];
            var des = lat_lng[i + 1];
            path.push(src);
            poly.setPath(path);
            service.route({
                origin: src,
                destination: des,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (result, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    if(result) {
                        for (var i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
                            path.push(result.routes[0].overview_path[i]);
                        }
                    }
                }
            });
        }
    }

    google.maps.event.addListenerOnce(map, 'idle', () => {
        setInterval(function () {
            var mePos = {lat: 0, lng: 0};

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

                        map.setZoom(getBoundsZoomLevel(bounds, mapDim) - 1);

                        // updateCurveMarker(homePos, mePos);
                    },
                    () => {
                        handleLocationError(true, infoWindow, map.getCenter()!);
                    }
                );
            } else {
                // Browser doesn't support Geolocation
                handleLocationError(false, infoWindow, map.getCenter()!);
            }
        }, 8000 / step);
    });

    soldierMarker.setMap(map);
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
    var WORLD_DIM = {height: 256, width: 256};
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
    soldierMarker.setPosition(position);
    map.setCenter(position);
}

function rotateTheThing(position) {
    /*if (position.lat != 0) {
        var rotationAngle = calculateAngle(position, homePos);

        console.log('rotationAngle - ' + rotationAngle);

        $('img[src="' + soldierUrl + '"]').css({
            transform: 'rotate(' + rotationAngle + 'deg)',
            'transform-origin': '25px 25px',
        });
    }*/
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

function updateCurveMarker(pos1, pos2) {
    const projection = map.getProjection();
    // @ts-ignore
    var p1 = projection.fromLatLngToPoint(pos1);
    // @ts-ignore
    var p2 = projection.fromLatLngToPoint(pos2);

    // Calculate the arc.
    // To simplify the math, these points
    // are all relative to p1:
    if (p1 && p2) {

        var e = new google.maps.Point(p2.x - p1.x, p2.y - p1.y), // endpoint (p2 relative to p1)
            m = new google.maps.Point(e.x / 2, e.y / 2), // midpoint
            o = new google.maps.Point(e.y, -e.x), // orthogonal
            c = new google.maps.Point( // curve control point
                m.x + curvature * o.x,
                m.y + curvature * o.y);

        var pathDef = 'M 0,0 ' +
            'q ' + c.x + ',' + c.y + ' ' + e.x + ',' + e.y;

        var zoom = map.getZoom();
        var scale = 1 / (Math.pow(2, -((zoom) ? zoom : 1)));

        var symbol = {
            path: pathDef,
            scale: scale,
            strokeWeight: 3,
            fillColor: 'none'
        };

        if (!curveMarker) {
            curveMarker = new google.maps.Marker({
                position: pos1,
                clickable: false,
                icon: symbol,
                zIndex: 0, // behind the other markers
                map: map
            });
        } else {
            curveMarker.setOptions({
                position: pos1,
                icon: symbol,
            });
        }
    }
}

declare global {
    interface Window {
        initMap: () => void;
    }
}

window.initMap = initMap;
export {};
