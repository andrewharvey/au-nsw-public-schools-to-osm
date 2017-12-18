# au-nsw-public-schools-to-osm

Convert AU NSW Public Schools data into OpenStreetMap

## Download NSW Public Schools Data

    make download

This will download the latest data from https://data.cese.nsw.gov.au/data/dataset/nsw-public-schools-master-dataset

## Download Schools Data from OSM

Visit https://overpass-turbo.eu/s/tS9 which will run this Overpass query which returns all schools in NSW as a point.

    (
      area["ISO3166-2"="AU-NSW"][boundary=administrative];
      node["amenity"="school"](area);
      way["amenity"="school"](area);
      relation["amenity"="school"](area);
    );
    out center meta;

Or visit [this link to download the .osm file](https://overpass-api.de/api/interpreter?data=%28%20%0A%20%20area%5B%22ISO3166-2%22%3D%22AU-NSW%22%5D%5Bboundary%3Dadministrative%5D%3B%0A%20%20node%5B%22amenity%22%3D%22school%22%5D%28area%29%3B%0A%20%20way%5B%22amenity%22%3D%22school%22%5D%28area%29%3B%0A%20%20relation%5B%22amenity%22%3D%22school%22%5D%28area%29%3B%0A%0A%29%3B%0Aout%20center%20meta%3B)

## Convert NSW Public Schools Data to OSM format

    ./index.js
