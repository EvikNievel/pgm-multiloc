import {Util, Location} from './app.ts';

export function StaticHive(text, center, steps, map) {
    _StaticHive.prototype = new google.maps.OverlayView();
    function _StaticHive(text, center, steps, map) {
        const _center = google.maps.geometry.spherical.computeOffset(center.getLatLng(), 350, 0);
        this.bounds_ = new google.maps.LatLngBounds(_center, _center);
        this.text_ = text;
        this.map_ = map;

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

        let hex = new google.maps.Polygon({
            paths: hexPoints,
            fillColor: '#aaf',
            fillOpacity: 0.3,
            strokeWeight: 1,
            zIndex: 2,
        });

        //map.addMapObject(hex);

        // Define a property to hold the image's div. We'll
        // actually create this div upon receipt of the onAdd()
        // method so we'll leave it null for now.
        this.div_ = null;

        // Explicitly call setMap on this overlay
        map.addMapObject(hex);
        map.addMapObject(this);
        //this.setMap(map);
    }
    _StaticHive.prototype.onAdd = function() {
        var div = document.createElement('div');
        div.style.border = 'none';
        div.style.borderWidth = '0px';
        div.style.display = 'flex';
        div.style.height = '0px';
        div.style.width  = '0px';
        div.style.backgroundColor = 'transparent';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.position = 'absolute';

        div.innerHTML = `<div style="display: inline-block;padding: 8px; font-weight: bold; background: white; border: 1px solid #ccc;">${this.text_}</div>`;

        this.div_ = div;

        // Add the element to the "overlayImage" pane.
        var panes = this.getPanes();
        panes.floatPane.appendChild(this.div_);
    };     
    _StaticHive.prototype.draw = function() {
        // We use the south-west and north-east
        // coordinates of the overlay to peg it to the correct position and size.
        // To do this, we need to retrieve the projection from the overlay.
        var overlayProjection = this.getProjection();

        // Retrieve the south-west and north-east coordinates of this overlay
        // in LatLngs and convert them to pixel coordinates.
        // We'll use these coordinates to resize the div.
        var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
        var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

        // Resize the image's div to fit the indicated dimensions.
        var div = this.div_;
        div.style.left = sw.x + 'px';
        div.style.top = ne.y + 'px';
    };

    _StaticHive.prototype.onRemove = function() {
        this.div_.parentNode.removeChild(this.div_);
    };
    new _StaticHive(text, center, steps, map);
}