var express = require('express')
var app = express()
var helpers = require('./helpers.js')

var router = express.Router()

var util = require('util')

// Print timestamp and request url & params for each query.
router.use(function timeLog (req, res, next) {
	console.log('[', Date.now().toString(), '] Url: ', req.url, "Request params: ", req.params)
	next()
})

// TODO: Handle errors.
// List all theaters
router.get('/rest/theaters', function (req, res) {
	helpers.getTheaters( handleTheaters )

	function handleTheaters( code, result ){
		if( result === "error" )
			res.sendStatus(code)

		res.status(code)
		res.json(result)
	}

	req.on('error', function (err) {
    console.error(err)
		res.status(500)
		res.send("Error when connecting to finnkino database.")
	})
})

// TODO: Handle errors
// Get list of movies running on a theater based on id.
router.get('/rest/movies', function (req, res) {

  var listType = "NowInTheatres"
  listType = req.query.listType

	helpers.getEvents( listType, req.query.theater, handleEvents )

	function handleEvents( code, result ){
		if( result === "error" )
			res.sendStatus(code)

		res.status(code)
		res.json(result)
	}

	req.on('error', function (err) {
    console.error(err)
		res.sendStatus(500)
	})
})

// Get movies based on the title
//TODO: Remove duplicates in helpers.js
router.get('/rest/movies/search/:title', function (req, res) {
	helpers.getTitles( req.params.title, req.query.theater, handleResults)

	function handleResults(code, result){
		res.status(code)
    res.json(result)
	}

	req.on('error', function (err) {
		console.error(err)
		res.sendStatus(500)
	})
})

// Get movie info and show times
router.get('/rest/movie', function (req, res) {
  helpers.getMovieInfo( req.query.id, req.query.title, req.query.theater, handle )

  function handle( code, result ){
    if( result === "error" ){
			console.error("Movie not found!")
      res.sendStatus(code)
    }
    res.status(code)
    res.json(result)
  }

	req.on('error', function (err) {
		console.error(err)
		res.sendStatus(500)
	})
})

// Get list of movies showing on a given date and area
router.get('/rest/shows', function (req, res) {
	helpers.getShows( req.query.date, req.query.theater, handleResult )

	function handleResult( code, result ){
		if( result === "error" )
			res.sendStatus(code)

		res.status(code)
		res.json(result)
	}

		req.on('error', function (err) {
			console.error(err)
			res.sendStatus(500)
		})
})

// Mount the router on the app
app.use('/', router)

// Print 404 when unable to find.
app.use(function(req, res){
   res.status(404)
   res.send("Not found.")
})

var server = app.listen(3000, function () {

  var port = server.address().port

  console.log("Finnkino movie ratings REST API listening at http://%s:%s", "127.0.0.1", port)

})
