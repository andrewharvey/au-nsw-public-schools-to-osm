download:
	wget -O nsw-public-schools.json 'https://data.cese.nsw.gov.au/data/dataset/027493b2-33ad-3f5b-8ed9-37cdca2b8650/resource/af20d17c-a7ac-4251-af75-e5ae66573e92/download/collections.json'

convertToOSM:
	./index.js

downloadOverpass:
	wget -O osm-schools.json 'https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0Aarea%5B%22ISO3166-2%22%3D%22AU-NSW%22%5D%5Bboundary%3Dadministrative%5D-%3E.searchArea%3B%0A%28%0A%20%20node%5B%22amenity%22%3D%22school%22%5D%28area.searchArea%29%3B%0A%20%20way%5B%22amenity%22%3D%22school%22%5D%28area.searchArea%29%3B%0A%20%20relation%5B%22amenity%22%3D%22school%22%5D%28area.searchArea%29%3B%0A%29%3B%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B'
	./node_modules/.bin/osmtogeojson osm-schools.json > osm-schools.geojson

diff:
	./diff.js -o matches.json osm-schools.geojson nsw-public-schools.geojson
