import {Util, Location} from './app.ts';
import {Map} from './map.ts';

import * as ko from 'knockout';
import * as _ from 'lodash';

export interface IHiveOptions {
  map: Map;
  center: Location;
  steps: number;
  index: number;
  color: string;
}
export class Hive {
  private options: IHiveOptions;
  private mapObject: google.maps.Polygon;
  public isActive: KnockoutObservable<boolean>;
  private activeListener: google.maps.MapsEventListener;
  private hexPoints: google.maps.LatLng[];

  get steps(): number {
    return this.options.steps;
  }

  constructor(options: IHiveOptions) {
    this.options = options;
    this.isActive = ko.observable(false);
	
	if (this.options.color == null){
		this.options.color = '#0F0';
	}

    let center = this.options.center.getLatLng();
    let radius = Util.getHiveRadius(this.options.steps);

    let computeOffset = google.maps.geometry.spherical.computeOffset;

    this.hexPoints = [
      computeOffset(center, radius, 30),
      computeOffset(center, radius, 90),
      computeOffset(center, radius, 150),
      computeOffset(center, radius, 210),
      computeOffset(center, radius, 270),
      computeOffset(center, radius, 330)
    ];

    let hex = new google.maps.Polygon({
      paths: this.hexPoints,
      fillOpacity: 0.3,
      strokeWeight: 1,
      zIndex: 2,
    });

    this.mapObject = hex;
    this.toggleActive();
    this.options.map.addMapObject(hex);
  }

  public reset(): void {
    this.mapObject = this.options.map.removeMapObject(this.mapObject) as google.maps.Polygon;
  }

  public toggleActive(): void {
    this.isActive(!this.isActive());
    this.mapObject.set('fillColor', this.isActive() ? this.options.color : '#F00');
  }

  public addListener(): void {
    this.activeListener = google.maps.event.addListener(this.mapObject, 'click', () => this.toggleActive());
  }

  public removeListener(): void {
    this.activeListener.remove();
  }

  public getCenter(): Location {
    return this.options.center;
  }

	public getHexPoints(): string {
		return _.join(_.map(this.hexPoints, function(l) { return `${l.lat()},${l.lng()}`; }), '\r\n');
	}
}
