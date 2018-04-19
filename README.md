# au-nsw-public-schools-to-osm

Convert AU NSW Public Schools data into OpenStreetMap XML

## Download NSW Public Schools Data

    make download

This will download the latest data from https://data.cese.nsw.gov.au/data/dataset/nsw-public-schools-master-dataset

## Download Schools Data from OSM

Visit https://overpass-turbo.eu/s/y2k which will run this Overpass query which returns all schools in NSW.

    [out:json][timeout:25];
    area["ISO3166-2"="AU-NSW"][boundary=administrative]->.searchArea;
    (
      node["amenity"="school"](area.searchArea);
      way["amenity"="school"](area.searchArea);
      relation["amenity"="school"](area.searchArea);
    );
    out body;
    >;
    out skel qt;

Or visit [this link to download the .osm file](https://overpass-api.de/api/interpreter?data=area%5B%22ISO3166-2%22%3D%22AU-NSW%22%5D%5Bboundary%3Dadministrative%5D-%3E.searchArea%3B%0A%28%0A%20%20node%5B%22amenity%22%3D%22school%22%5D%28area.searchArea%29%3B%0A%20%20way%5B%22amenity%22%3D%22school%22%5D%28area.searchArea%29%3B%0A%20%20relation%5B%22amenity%22%3D%22school%22%5D%28area.searchArea%29%3B%0A%29%3B%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B).

## Convert NSW Public Schools Data to OSM format

    ./index.js

Or download the prebuilt cached datasets [nsw-public-schools.geojson](https://tianjara.net/data/nsw-public-schools.geojson), [nsw-public-schools.osm](https://tianjara.net/data/nsw-public-schools.osm).

## Copyright

The [NSW Public Schools Master Dataset](https://data.cese.nsw.gov.au/data/dataset/nsw-public-schools-master-dataset) is licensed under CC BY 4.0 (confirmed via email) by NSW Department of Education, Centre for Education Statistics and Evaluation.

The publisher has [completed](https://wiki.openstreetmap.org/wiki/File:CESE_NSW_AU_MasterSchools.pdf) the [OSMF's CC BY waiver](https://blog.openstreetmap.org/2017/03/17/use-of-cc-by-data/) allowing the dataset to be incorporated into the OpenStreetMap database.
