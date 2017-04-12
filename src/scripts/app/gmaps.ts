import {config} from '../config.ts';
import * as $ from 'jquery';
import loadGoogleMapsApi from 'load-google-maps-api';
import {Location} from './app.ts';
import {IMapOptions, Map} from './map.ts';
import {IBeehiveOptions, Beehive} from './beehive.ts';
import {IHiveOptions, Hive} from './hive.ts';
import {StaticHive} from './staticHive.ts';

import * as ko from 'knockout';
import * as sheetrock from 'sheetrock';

export class GMaps {
    private map: Map;
    private gmap: google.maps.Map;
    private geocoder: google.maps.Geocoder;
	private hives: KnockoutObservableArray<StaticHive>;
	public existingHives: StaticHive[];

    constructor() {
        this.map = new Map();
		this.hives = ko.observableArray([]); 
		
        loadGoogleMapsApi({
            key: config.googleMapsKey,
            libraries: ['places', 'geometry']
        }).then((googleMaps) => {
            this.initMap();
        });
    }

    public getMap(): Map {
        return this.map;
    }

    public getGMap(): google.maps.Map {
        return this.gmap;
    }

    private initMap(): void {
        this.gmap = new google.maps.Map(document.getElementById('map'), {
            zoom: config.zoom,
            center: new google.maps.LatLng(config.latitude, config.longitude),
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_RIGHT
            }
        });

        let input = document.getElementById('pac-input') as HTMLInputElement;
        (<HTMLInputElement>document.getElementById("latlng")).placeholder = "'" + config.latitude + "," + config.longitude + "'";

        this.gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('custom-map-controls'));
        this.gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(document.getElementById('script-options'));

        let autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', this.gmap);

        autocomplete.addListener('place_changed', () => {
            let place = autocomplete.getPlace();
            if (place.geometry) {
                this.gmap.setCenter(place.geometry.location);
                this.gmap.setZoom(10);
                var inputElement = <HTMLInputElement>document.getElementById('latlng');
                inputElement.value = String(place.geometry.location.lat()) + "," + String(place.geometry.location.lng());
            }
        });

        document.getElementById('submit').addEventListener('click', () => {
            this.geocoder = new google.maps.Geocoder;

            let geo_input = document.getElementById('latlng') as HTMLInputElement;
            if(!geo_input.value){
                window.alert('Please enter a valid location or coordinates to add a new hive.');
                return;
            }

            var latlngStr = geo_input.value.split(',', 2);
            var latlng = {lat: parseFloat(latlngStr[0]), lng: parseFloat(latlngStr[1])};

            this.geocoder.geocode({'location': latlng}, (results, status) => {
                var status_string: string = String(status);
                if (status_string === 'OK') {
                  if (results[1]) {
                    this.gmap.setZoom(12);
                    this.gmap.setCenter(latlng);
                    this.map.addBeehive(new Location(parseFloat(latlngStr[0]), parseFloat(latlngStr[1])));
                  } else {
                    window.alert('No results found.');
                  }
                } else {
                  window.alert('Geocoder failed due to: ' + status);
                }
            });
        });

        document.getElementById('legacy-checkbox').addEventListener('click', () => {
            let label = document.getElementById('legacy-label') as HTMLElement;
            label.classList.toggle('legacy-mode');
            if (label.classList.contains('legacy-mode')) {
                this.gmap.addListener('click', (event: google.maps.MouseEvent) => {
                    this.map.addBeehive(new Location(event.latLng.lat(), event.latLng.lng()));
                    this.gmap.setCenter({lat: event.latLng.lat(), lng: event.latLng.lng()});
                });
            }else {
                google.maps.event.clearListeners(this.gmap, 'click');
            }
        });
		
        google.maps.event.addListenerOnce(this.gmap, 'idle', () => {
            this.map.initMap(<IMapOptions>{ gmap: this });	
			
			var map = this.gmap;
			var hives = this.hives;
			var scanLocationData;
			sheetrock({
				url: config.scanLocationUrl,
				query: 'select A,B,C,D,E,F,G',
				callback: function (locationError, locationOptions, locationResponse) {
					if (!locationError) {
						sheetrock({
							url: config.areaRepUrl,
							query: "select D,E,H,I,K,L",
							callback: function (repError, repOptions, repResponse) {
								if (!repError) {
									for (var i = 1; i < locationResponse.rows.length; i++) {
										var locationRow = locationResponse.rows[i];
										var content = `
											<div style="padding: 10px;">
												<h5 style="text-align: center;">${locationRow.cells.DisplayName}</h5>
												<div><b>Location Name: </b> ${locationRow.cells.Name}</div>
												<div><b>Coordinates: </b> ${locationRow.cells.Latitude}, ${locationRow.cells.Longitude}</div>
												<div><b>Steps: </b> ${locationRow.cells.Steps}</div>
											</div>
										`;
										
										for (var j = 1; j < repResponse.rows.length; j++) {
											var repRow = repResponse.rows[j];
											if (repRow.cells.Name == locationRow.cells.Name) {
												content += `<div style="padding: 10px;"><b>Area Representative: </b>${repRow.cells.AreaRep}</div>`;
												
												if (repRow.cells.TwitterUrl.length > 0 ||
													repRow.cells.FacebookUrl.length > 0 ||
													repRow.cells.TelegramUrl.length > 0) {
													
													let feedsHtml = '';
													if (repRow.cells.TwitterUrl.length > 0) {
														feedsHtml += `<span style="padding: 5px;"><a href="${repRow.cells.TwitterUrl}" target="_blank"><img src="https://pogovaalerts.files.wordpress.com/2016/11/twitter.png" width="16"></a></span>`;
													}
													
													if (repRow.cells.FacebookUrl.length > 0) {
														feedsHtml += `<span style="padding: 5px;"><a href="${repRow.cells.FacebookUrl}" target="_blank"><img src="https://pogovaalerts.files.wordpress.com/2016/11/fb.jpg" width="16"></a></span>`;
													}
													
													if (repRow.cells.TelegramUrl.length > 0) {
														feedsHtml += `<span style="padding: 5px;"><a href="${repRow.cells.TelegramUrl}" target="_blank"><img src="https://pogovaalerts.files.wordpress.com/2016/11/apps-telegram-icon.png" width="16"></a></span>`;
													}
													
													content += `<div style="padding: 10px;"><b>Feeds: </b> ${feedsHtml}</div>`;
												}
												
												break;
											}
										}
										
										if (locationRow.cells.Notes.length > 0) {
											content += `<div style="padding: 10px;">${locationRow.cells.Notes}</div>`;
										}
										
										let color = '#aaf';							
										switch (parseInt(locationRow.cells.Type)) {
											case 2:
												color = '#e60073';
												break;
											case 3:
												color = '#6b00b3';
												break;
											case 4:
												color = '#F5B800';
												break;
										}
										
										hives.push(new StaticHive({ text: content, color: color, center: new Location(locationRow.cells.Latitude, locationRow.cells.Longitude), steps: locationRow.cells.Steps, map: map }));
									}
								}
								else {
									alert(repError);
								}
							}
						});
					}
					else {
						alert(locationError);
					}
				}
			});
        });

    }
}
