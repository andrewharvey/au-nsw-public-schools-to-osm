#!/usr/bin/env node

var geojson2osm = require('geojson2osm');
var fs = require('fs');
var turf = {
    point: require('@turf/helpers').point,
    featureCollection: require('@turf/helpers').featureCollection
};

var source = JSON.parse(fs.readFileSync('nsw-public-schools.json'));

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function formatPhone(original) {
    // remove any parentheses
    var osmPhone = original
        .replace(/\(/g, '')
        .replace(/\)/g, '');

    var countryMatch = osmPhone.match(/^0011\s*(.*)/);
    if (countryMatch) {
        // international number, eg. Norfolk Island
        osmPhone = '+' + countryMatch[1];
    } else {
        osmPhone = osmPhone.replace(/\s/g, '');

        // if starts with a state prefix 0X, remove the leading 0 and use that area code
        var areaMatch = osmPhone.match(/^0(\d)(\d{4})(\d{4})/);
        if (areaMatch) {
            if (areaMatch[2] === '0000' && areaMatch[3] === '0000')
                return '';

            osmPhone = '+61 ' + areaMatch[1] + ' ' + areaMatch[2] + ' ' + areaMatch[3];
        } else {
            // local NSW already
            var localMatch = osmPhone.match(/(\d{4})(\d{4})/);
            if (localMatch) {
                osmPhone = '+61 2 ' + localMatch[1] + ' ' + localMatch[2];
            } else {
                console.warn('Unknown phone format: ' + original);
            }
        }
    }

    return osmPhone;
}

var features = source.map(function (i) {
    var p = {
        'amenity': 'school'
    };

    if (i['School_name'])
        p['name'] = i['School_name'];

    // contact details
    if (i['Phone'])
        p['contact:phone'] = formatPhone(i['Phone']);

    if (i['Fax'])
        p['contact:fax'] = formatPhone(i['Fax']);

    if (i['School_Email'])
        p['contact:email'] = i['School_Email'];

    if (i['Town_suburb'])
        p['addr:city'] = i['Town_suburb'];

    if (i['Postcode'])
        p['addr:postcode'] = i['Postcode'];

    // other details
    if (i['Date_1st_teacher'])
        p['start_date'] = i['Date_1st_teacher'];

    if (i['School_code'])
        p['ref:au.gov.nsw.cese'] = i['School_code'];

    if (i['Student_number'] && isNumeric(i['Student_number']))
        p['capacity'] = Math.floor(i['Student_number']).toString();

    if (i['School_gender']) {
        switch (i['School_gender']) {
            case 'Boys':
                p['school:gender'] = 'male';
                break;
            case 'Girls':
                p['school:gender'] = 'female';
                break;
            case 'Coed':
                p['school:gender'] = 'mixed';
                break;
        }
    }

    if (i['Level_of_schooling']) {
        switch (i['Level_of_schooling']) {
            case 'Infants School':
                p['isced:level'] = '0';
                break;
            case 'Primary School':
                p['isced:level'] = '1';
                break;
            case 'Secondary School':
                p['isced:level'] = '2-3';
                break;
        }
    }

    if (i['School_subtype']) {
        // Year A to Year B
        var yearsMatch = i['School_subtype'].match('Year (\d+) to Year (\d+)')
        if (yearsMatch && yearsMatch.length >= 3) {
            p['grades'] = yearsMatch[1] + '-' + yearsMatch[2];
        }

        // Kinder to Year A
        var yearsMatch = i['School_subtype'].match('Kinder to Year (\d+)')
        if (yearsMatch && yearsMatch.length >= 2) {
            p['grades'] = '0-' + yearsMatch[1];
        }
    }

    if (i['School_specialty_type'] && i['School_specialty_type'] != "Other") {
        p['description'] = i['School_specialty_type'];
    }

    if (i['Selective_school']) {
        switch (i['Selective_school']) {
                case 'Fully Selective':
                    p['school:selective'] = 'yes';
                    break;
                case 'Not Selective':
                    p['school:selective'] = 'no';
                    break;
                case 'Partially Selective':
                    p['school:selective'] = 'partial';
                    break;
        }
    }

    // static details
    p['access'] = 'public';
    p['fee'] = 'no';
    p['operator'] = 'NSW Department of Education';
    p['source'] = 'NSW CESE Public Schools Master Dataset';
    p['source:url'] = 'https://data.cese.nsw.gov.au/data/dataset/nsw-public-schools-master-dataset';

    return turf.point([i['Longitude'], i['Latitude']], p);
});

var geojson = turf.featureCollection(features);
fs.writeFile('nsw-public-schools.geojson', JSON.stringify(geojson), (err) => {
    if (err) throw err;
    console.log('Saved nsw-public-schools.geojson');
});

var osm = geojson2osm.geojson2osm(geojson);
fs.writeFile('nsw-public-schools.osm', osm, (err) => {
    if (err) throw err;
    console.log('Saved nsw-public-schools.osm');
});
