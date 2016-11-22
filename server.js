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

// TODO: Handle errors
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

        var events = result.Events.Event
        var maxRequests = events.length
        var reqCount = 0
        var movies = []

        events.forEach(function(movie) {
          // Removing parenthesis, 3D and 2D from the title before request
          var title = movie.OriginalTitle.split("(", 1)
          title = title[0].split("3D", 1)
          title = title[0].split("2D", 1)
          title = title[0]
          var addr = 'http://www.omdbapi.com/?t=' + title
          var req = client.get(addr, function (data, response) {
            if (data.Response == "True") {
              var mov = {
                "Title": movie.Title,
                "imdbRating": data.imdbRating,
                "imdbVotes": data.imdbVotes
              }
            // Movie is not found in the omdb database
            } else {
              var mov = {
                "Title": movie.Title,
                "imdbRating": "N/A",
                "imdbVotes": "N/A"
              }
            }
            movies.push(mov)
            reqCount ++
            //All movie requests have been received
            if (reqCount == maxRequests) {
              movies.sort(function(a, b) {
                if (a.imdbRating > b.imdbRating) {
                  if (a.imdbRating == "N/A")
                    return 1
                  return -1
                } else if (a.imdbRating < b.imdbRating) {
                  if (b.imdbRating == "N/A")
                    return -1
                  return 1
                } else {
                  return 0
                }
              })

              res.status(200)
              res.json(movies)
            }
          });
        });
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
