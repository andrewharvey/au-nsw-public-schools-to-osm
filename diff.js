#!/usr/bin/env node

/*
 * Compares two GeoJSON files,
 *   - A current state OSM and,
 *   - B reference dataset
 *
 * The assumptions are that B consists of only Points with A any geometry type.
 */

const fs = require('fs');

const argv = require('minimist')(process.argv.slice(2));
const _ = require('lodash');
const turf = {
    featureEach: require('@turf/meta').featureEach,
    featureCollection: require('@turf/helpers').featureCollection,
    centroid: require('@turf/centroid').default
};
const kdbush = require('kdbush');
const geokdbush = require('geokdbush');
const whichPolygon = require('which-polygon');

if (argv._.length !== 2 || !argv.o) {
    console.log("Usage: $0 [--tolerance 200] -o diff.geojson a.geojson b.geojson");
}

const filepathA = argv._[0];
const filepathB = argv._[1];
const matchesFilepath = argv.o;

/* maximum distance between pointns to consider for a match in meters */
const tolerance = argv.tolerance || 200;

// load GeoJSON files
const a = JSON.parse(fs.readFileSync(filepathA));
const b = JSON.parse(fs.readFileSync(filepathB));

// index A by id
const aFeaturesByID = {};

// ensure the ID field is populated in A
a.features = a.features.map((feature, index) => {
    if (!feature.id)
        feature.id = index;

    // add feature to the index of A by id
    aFeaturesByID[feature.id] = feature;
    return feature;
});

// ensure the ID field is populated in B
b.features = b.features.map((feature, index) => {
    if (!feature.id)
        feature.id = index;
    return feature;
});


// index of Points in A
const aPointsIndex = kdbush(a.features.filter((feature) => {
    return feature.geometry && feature.geometry.type == 'Point';
}),
    (feature) => { return feature.geometry.coordinates[0]; },
    (feature) => { return feature.geometry.coordinates[1]; });

// index of Polygons in A for strictly point in polygon queries
const aPolygonsIndex = whichPolygon(a);

// index of LineStrings and Polygons in A for k nearest neigbour queries
// using centroid until something like https://github.com/mourner/rbush-knn/issues/6
// allows for geographic point to bbox queries
const aNearbyPolygonsIndex= kdbush(a.features.filter((feature) => {
    return feature.geometry && feature.geometry.type !== 'Point';
}).map((feature) => {
    return turf.centroid(feature);
}),
    (feature) => { return feature.geometry.coordinates[0]; },
    (feature) => { return feature.geometry.coordinates[1]; });

/* B -> A
 * {
 *   b.id: { from: b, to: [As] }
 * }
 * */
var matches = {};

// for each point in B...
turf.featureEach(b, (bFeature) => {
    const bLng = bFeature.geometry.coordinates[0];
    const bLat = bFeature.geometry.coordinates[1];

    // find nearest point from A
    const nearbyPoints = geokdbush.around(aPointsIndex, bLng, bLat, 1, tolerance / 1000);
    if (nearbyPoints.length) {
        const nearbyPoint = nearbyPoints[0];
        if (!matches[bFeature.id]) {
            matches[bFeature.id] = { from: bFeature, to: [] };
        }
        matches[bFeature.id].to.push(nearbyPoint);
    }

    // find polygons from A which B is within
    const insidePolygons = aPolygonsIndex([bLng, bLat], true);
    if (insidePolygons && insidePolygons.length) {
        if (!matches[bFeature.id]) {
            matches[bFeature.id] = { from: bFeature, to: [] };
        }
        insidePolygons.forEach((insidePolygon) => {
            matches[bFeature.id].to.push(aFeaturesByID[insidePolygon.id]);
        });
    } else {
        const nearestPolygons = geokdbush.around(aNearbyPolygonsIndex, bLng, bLat, 1, tolerance / 1000);
        if (nearestPolygons && nearestPolygons.length) {
            const nearestPolygon = nearestPolygons[0];

            if (!matches[bFeature.id]) {
                matches[bFeature.id] = { from: bFeature, to: [] };
            }

            matches[bFeature.id].to.push(aFeaturesByID[nearestPolygon.id]);
        }
    }
});

const unmatchedFromA = a.features.filter(
    (feature) => {
        return !(
            _.flatten(
                Object.values(matches)
                .map(
                    (object) => {
                        return object.to;
                    }
                )
            )
            .map(
                (object) => {
                    return (object && object.id) || null;
                }
            )
            .includes(feature.id)
        );
    }
);
const unmatchedFromB = b.features.filter((feature) => { return !(feature.id in matches); });


console.log(`Total features from A (OSM): ${a.features.length} (${a.features.length - unmatchedFromA.length} matched, ${unmatchedFromA.length} unmatched)`);
console.log(`Total features from B (Upstream): ${b.features.length} (${Object.keys(matches).length} matched, ${unmatchedFromB.length} unmatched)`);

// include unmatched from B in matches
unmatchedFromB.map((feature) => {
    matches[feature.id] = { from: feature, to: null };
});

fs.writeFileSync(matchesFilepath, JSON.stringify(matches, null, 2));

fs.writeFileSync('missingInOSM.geojson', JSON.stringify(turf.featureCollection(unmatchedFromA), null, 2));
fs.writeFileSync('missingInSource.geojson', JSON.stringify(turf.featureCollection(unmatchedFromB), null, 2));

const matchesGeoJSON = turf.featureCollection(_.flatten(Object.values(matches).map((match) => {
    if (!match.to) {
        match.from.properties['_operation'] = 'insert';
        return [match.from];
    } else {
        var features = [];
        match.from.properties['_operation'] = 'modify_from';
        match.from.properties['_link'] = match.to.filter((to) => { return to && to.id; }).map((to) => { return to.id; })[0];

        match.to.filter((to) => { return !!to; }).map((to) => {
            to.properties['_operation'] = 'modify_to';
            to.properties['_link'] = match.from.id;
            to.properties['_change'] = changeSignificance(match.from.properties, to.properties);

            match.from.properties['_change'] = changeSignificance(match.from.properties, to.properties);

            features.push(to);
        });
        features.push(match.from);
        return features;
    }
})));
fs.writeFileSync('matches.geojson', JSON.stringify(matchesGeoJSON, null, 2));

function changeSignificance(from, to) {
    var newTagsOnly = _.without(
        _.uniq(
            _.concat(
                Object.keys(from),
                Object.keys(to)
            )
        ),
        'id', '_link', '_operation', '_change')
    .map((key) => {
        if (!(key in to))
            return true;

        if (to[key] == from[key]) {
            return true;
        } else {
            return false;
        }
    })
    .reduce((acc, cur) => {
        return acc && cur;
    });
    if (newTagsOnly)
        return 'new_tags_only';
}
