import { Map } from './map.ts';
import {Util, Location} from './app.ts';

import * as _ from 'lodash';

export interface IStaticHiveOptions {
	name: string;
	type: string;
	text: string;
	center: Location;
	steps: number;
	map: google.maps.Map;
	color: string;
}

export class StaticHive {
  private options: IStaticHiveOptions;
  private hexPoints: google.maps.LatLng[];

  get name(): string {
    return this.options.name;
  }

  get type(): string {
    return this.options.type;
  }

  constructor(options: IStaticHiveOptions) {
	this.options = options;
    const center = this.options.center.getLatLng();
	let color = '#aaf';
	
	if (this.options.color.length > 0) {
		color = this.options.color;
	}
	
	let persistInfoWindow = false;
	let radius = Util.getHiveRadius(this.options.steps);

	const computeOffset = google.maps.geometry.spherical.computeOffset;
	this.hexPoints = [
		computeOffset(center, radius, 30),
		computeOffset(center, radius, 90),
		computeOffset(center, radius, 150),
		computeOffset(center, radius, 210),
		computeOffset(center, radius, 270),
		computeOffset(center, radius, 330)
	];

	const hex = new google.maps.Polygon({
		paths: this.hexPoints,
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

	public getHexPoints(): string {
		return _.join(_.map(this.hexPoints, function(l) { return `${l.lat()},${l.lng()}`; }), '\r\n');
	}
}