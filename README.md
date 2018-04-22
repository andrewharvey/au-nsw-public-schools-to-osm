# au-nsw-public-schools-to-osm

Converts AU NSW Public Schools data into GeoJSON/OpenStreetMap XML and tools to compare with OpenStreetMap.

## Download NSW Public Schools Data

    make download

This will download the latest data from https://data.cese.nsw.gov.au/data/dataset/nsw-public-schools-master-dataset

## Download Schools Data from OSM

Visit https://overpass-turbo.eu/s/y3y which will run this Overpass query which returns all schools in NSW (including private schools).

    [out:json][timeout:25];
    area["ISO3166-2"="AU-NSW"][boundary=administrative]->.searchArea;
    (
      node["amenity"="school"](area.searchArea);
      way["amenity"="school"](area.searchArea);
      relation["amenity"="school"](area.searchArea);
    );
    out meta;
    >;
    out skel qt;

You can Export to GeoJSON from Overpass Turbo, or in JOSM under Download Data > Download from Overpass API, paste in the above query to download directly to JOSM.

Or from the command line you can run:

    yarn install
    make downlodOverpass

## Convert NSW Public Schools Data to OSM XML

    yarn install
    make convertToOSM

Or download the prebuilt cached datasets [nsw-public-schools.geojson](https://tianjara.net/data/nsw-public-schools.geojson), [nsw-public-schools.osm](https://tianjara.net/data/nsw-public-schools.osm).

## Compare

    make diff

This will output:

 - `matches.json` contains the matches in the format like `{ B.id: { from: B, to [As] }` where A is OpenStreetMap and B is the NSW Public Schools data.
 - `missingInOSM.geojson` which contains features from the "NSW Public Schools data" not found in OpenStreetMap.
 - `missingInSource.geojson` which contains features from OpenStreetMap not found in the "NSW Public Schools data". This is less useful as most schools in OSM don't differentiate between private and public so most of these features will be private schools obviously not found in the public schools data.

## Copyright

The [NSW Public Schools Master Dataset](https://data.cese.nsw.gov.au/data/dataset/nsw-public-schools-master-dataset) is licensed under CC BY 4.0 (confirmed via email) by NSW Department of Education, Centre for Education Statistics and Evaluation.

The publisher has [completed](https://wiki.openstreetmap.org/wiki/File:CESE_NSW_AU_MasterSchools.pdf) the [OSMF's CC BY waiver](https://blog.openstreetmap.org/2017/03/17/use-of-cc-by-data/) allowing the dataset to be incorporated into the OpenStreetMap database.
