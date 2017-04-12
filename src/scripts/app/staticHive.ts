import { Map } from './map.ts';
import {Util, Location} from './app.ts';

export interface IStaticHiveOptions {
	text: string;
	center: Location;
	steps: number;
	map: google.maps.Map;
	color: string;
}

export class StaticHive {
  private options: IStaticHiveOptions;

  constructor(options: IStaticHiveOptions) {
	this.options = options;
    const center = google.maps.geometry.spherical.computeOffset(this.options.center.getLatLng(), 350, 0);
	let color = '#aaf';
	
	if (this.options.color.length > 0) {
		color = this.options.color;
	}
	
	let persistInfoWindow = false;
	let radius = Util.getHiveRadius(this.options.steps);

	const computeOffset = google.maps.geometry.spherical.computeOffset;
	const hexPoints: google.maps.LatLng[] = [
		computeOffset(center, radius, 30),
		computeOffset(center, radius, 90),
		computeOffset(center, radius, 150),
		computeOffset(center, radius, 210),
		computeOffset(center, radius, 270),
		computeOffset(center, radius, 330)
	];

	const hex = new google.maps.Polygon({
		paths: hexPoints,
		fillColor: color,
		fillOpacity: 0.3,
		strokeWeight: 1,
		zIndex: 2,
	});
	
	const infoWindow = new google.maps.InfoWindow({ content: this.options.text });
	hex.setMap(this.options.map);

	const map = this.options.map;
	google.maps.event.addListener(hex, 'click', function(event) {
	  if (!persistInfoWindow) {
	      infoWindow.setPosition(google.maps.geometry.spherical.computeOffset(event.latLng, 30, 0));
		  infoWindow.open(map);  
		  persistInfoWindow = true;
	  }
	});

	google.maps.event.addListener(infoWindow, 'closeclick', function () {
		persistInfoWindow = false;
	})

	google.maps.event.addListener(hex, 'mouseover', function(event) {
		if (!persistInfoWindow) {
			infoWindow.setPosition(google.maps.geometry.spherical.computeOffset(event.latLng, 30, 0));
			infoWindow.open(map);
		}
	});

	google.maps.event.addListener(hex, 'mouseout', function(event) {
		if (!persistInfoWindow) {
			infoWindow.close();	
		}
	});
  }
}