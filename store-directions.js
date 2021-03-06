var rest = require('restler');
var _ = require('lodash');
var pmongo = require('promised-mongo');

var api_url = "https://maps.googleapis.com/maps/api/directions/json"

var features = [
	['Manhattan Bridge', 'manhattan'],
	['George Washington Bridge', 'gwb'],
	['F.D.R Drive', 'fdr'],
	['onto <b>FDR Drive', 'fdr'],
	['Triboro Bridge', 'triboro'],
	['Lincoln Tunnel', 'lincoln'],
	['Hamilton Ave', 'hugh'],
	['Brooklyn Bridge', 'brooklyn'],
	['I-84 E', 'newburg-beacon'],
	['Saw Mill Pkwy S', 'tappan-zee'],
	['I-287 W/I-87 N', 'tappan-zee'],
	['95 N/G Washington Br.*exit', 'gwb'],
	['I-678 S', 'whitestone'],
	['exit toward <b>Triboro Br', 'triboro']
];

var db = pmongo(process.env.MONGO_DSN, [process.env.ENV]);
var saved = 0;

var handle_response = function(result, response, direction) {

	var route = result.routes[0].legs[0];
	var english = '',
		route_features = [],
		duration_seconds = route.duration.value,
		meters = route.distance.value;
	
	_.each(route.steps, function(leg){
		english += leg.html_instructions + "\n";
	});

	_.each(features, function(f) {
		if ((new RegExp(f[0])).test(english))
		{
			route_features.push(f[1]);
		}
	})

	db.collection(process.env.ENV).save({
		meta: {
			route_direction:direction,
			duration_seconds: duration_seconds,
			meters: meters,
			features: route_features,
		},
		route: route
	});

};


rest.get(api_url, {
	query: {
		origin: process.env.ORIGIN,
		destination: process.env.DEST,
		key: process.env.GOOGLE_PUBLIC_KEY,
		alternatives: true
	}
}).on('complete', function(a,b) {
	handle_response(a,b,'forward');
})

rest.get(api_url, {
	query: {
		origin: process.env.DEST,
		destination: process.env.ORIGIN,
		key: process.env.GOOGLE_PUBLIC_KEY,
		alternatives: true
	}
}).on('complete', function(a,b) {
	handle_response(a,b,'backward');
})

setTimeout(process.exit, 10000, 1);
