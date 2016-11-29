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
router.get('/rest/movies/theater/:id', function (req, res) {

  var listType = "NowInTheatres"
  listType = req.query.listType

	helpers.getEvents( listType, req.params.id, handleEvents )

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

// Get list of movies showing on a given date and area
router.get('/rest/movies/date/:date', function (req, res) {
	helpers.getMoviesFromSchedule( req.params.date, req.query.theater, handleResult )

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

// Get movie info and show times
router.get('/rest/movie/info/:id', function (req, res) {
  helpers.getMovieInfo( req.params.id, req.query.theater, handle )

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

// Get the movie id based on the title if found
router.get('/rest/movie/id/:title', function (req, res) {
  var title = req.params.title
  helpers.getIdByTitle(title, "NowInTheatres", [], handleMovies)

  // Callback to be used after the first request is ready
  function handleMovies( movies ){
    helpers.getIdByTitle(title, "ComingSoon", movies, handleBoth)
  }

  // Callback after both requests are ready
  function handleBoth( movies ){
    res.status(200)
    res.json(movies)
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

  console.log("Example app listening at http://%s:%s", "127.0.0.1", port)

})
