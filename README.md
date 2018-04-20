# au-nsw-public-schools-to-osm

Convert AU NSW Public Schools data into OpenStreetMap XML

## Download NSW Public Schools Data

    make download

This will download the latest data from https://data.cese.nsw.gov.au/data/dataset/nsw-public-schools-master-dataset

## Download Schools Data from OSM

Visit https://overpass-turbo.eu/s/y3y which will run this Overpass query which returns all schools in NSW.

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

## Convert NSW Public Schools Data to OSM format

    ./index.js

Or download the prebuilt cached datasets [nsw-public-schools.geojson](https://tianjara.net/data/nsw-public-schools.geojson), [nsw-public-schools.osm](https://tianjara.net/data/nsw-public-schools.osm).

## Copyright

The [NSW Public Schools Master Dataset](https://data.cese.nsw.gov.au/data/dataset/nsw-public-schools-master-dataset) is licensed under CC BY 4.0 (confirmed via email) by NSW Department of Education, Centre for Education Statistics and Evaluation.

The publisher has [completed](https://wiki.openstreetmap.org/wiki/File:CESE_NSW_AU_MasterSchools.pdf) the [OSMF's CC BY waiver](https://blog.openstreetmap.org/2017/03/17/use-of-cc-by-data/) allowing the dataset to be incorporated into the OpenStreetMap database.
