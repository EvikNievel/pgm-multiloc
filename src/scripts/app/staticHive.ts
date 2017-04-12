import { Map } from './map.ts';
import {Util, Location} from './app.ts';

export function StaticHive(text: string, center: Location, steps: number, map: google.maps.Map) {
    function _StaticHive(text, center, steps, map) {
        const _center = google.maps.geometry.spherical.computeOffset(center.getLatLng(), 350, 0);
        this.bounds_ = new google.maps.LatLngBounds(_center, _center);
        this.text_ = text;
        this.map_ = map;
		
		var persistInfoWindow = false;

        let radius = Util.getHiveRadius(steps);

        let computeOffset = google.maps.geometry.spherical.computeOffset;
        let hexPoints: google.maps.LatLng[] = [
            computeOffset(_center, radius, 30),
            computeOffset(_center, radius, 90),
            computeOffset(_center, radius, 150),
            computeOffset(_center, radius, 210),
            computeOffset(_center, radius, 270),
            computeOffset(_center, radius, 330)
        ];

        var hex = new google.maps.Polygon({
            paths: hexPoints,
            fillColor: '#aaf',
            fillOpacity: 0.3,
            strokeWeight: 1,
            zIndex: 2,
        });
		
		var infoWindow = new google.maps.InfoWindow({ content: text });
		hex.setMap(map);

        google.maps.event.addListener(hex, 'click', function(event) {
		  if (!persistInfoWindow) {
			  infoWindow.setPosition(event.latLng);
			  infoWindow.open(map);  
			  persistInfoWindow = true;
		  }
        });

		google.maps.event.addListener(infoWindow, 'closeclick', function () {
			persistInfoWindow = false;
		})

        google.maps.event.addListener(hex, 'mouseover', function(event) {
			if (!persistInfoWindow) {
				infoWindow.setPosition(event.latLng);
				infoWindow.open(map);
			}
        });

        google.maps.event.addListener(hex, 'mouseout', function(event) {
			if (!persistInfoWindow) {
				infoWindow.close();	
			}
        });
    }
	
    new _StaticHive(text, center, steps, map);
}