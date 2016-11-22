var express = require('express')
var app = express()

var router = express.Router()

var util = require('util')

// Client for fetching data from public APIS
var Client = require('node-rest-client').Client
var client = new Client()

// For parsing XML to JSON
var parseString = require('xml2js').parseString


// Print timestamp and request url & params for each query.
router.use(function timeLog (req, res, next) {
  console.log('[', Date.now().toString(), '] Url: ', req.url, "Request params: ", req.params)
  next()
})

// TODO: Handle errors.
// List all theaters
router.get('/rest/theaters', function (req, res) {
	var req = client.get("http://www.finnkino.fi/xml/TheatreAreas", function (data, response) {

	    var xml = data
	    parseString(xml, {explicitArray: false}, function (err, result) {
	    	if(err)
	    		console.log(err)
	    	res.status(200)
    	    res.json(result.TheatreAreas.TheatreArea)
		})

	})

	req.on('error', function (err) {
		res.sendStatus(500)
		res.send("Error when connecting to finnkino database.")
	    console.log('request error', err)
	})
})

// TODO: Include reviews & Handle errors
// Get list of movies running on a theater based on id.
router.get('/rest/movies/theater/:theater_id', function (req, res) {

	var listType = "NowInTheatres"

	var req = client.get("http://www.finnkino.fi/xml/Events?listType=" + listType + "&area=" + req.params.theater_id
		, function (data, response) {

	    var xml = data
	    parseString(xml, {explicitArray: false}, function (err, result) {
	    	if(err)
	    		res.sendStatus(500)
	    		console.log(err)
	    	res.status(200)
    	    res.json(result)
		})

	})

	req.on('error', function (err) {
		res.sendStatus(500)
	    console.log('request error', err)
	})
})

// Mount the router on the app
app.use('/', router)

// Print 404 when unable to find. 
app.use(function(req, res){
   res.send("Not found.")
   res.sendStatus(404)
})

var server = app.listen(3000, function () {

  var port = server.address().port

  console.log("Example app listening at http://%s:%s", "127.0.0.1", port)

})
