var express = require('express')
var app = express()

var router = express.Router()

var util = require('util')

// Client for fetching data from public APIS
var Client = require('node-rest-client').Client
var client = new Client()

// For parsing XML to JSON
var parseString = require('xml2js').parseString

function parseXml(xml, callback){
  parseString(xml, {explicitArray: false}, function (err, result) {
    if(err) {
      console.log(err)
      return "error"
    }
    callback(result)
  })
}

// Function for removing parenthesis and 3D/2D abbreviations from the movie title
// because the omdb title search must be done without these.
function cutString(s){
  var x = s.split("(", 1)
  x = x[0].split("3D", 1)
  x = x[0].split("2D", 1)
  x = x[0]
  return x
}

// Function for checking if the searched title is found from movie list.
function checkTitle(title, movies, result, listType, callback){
  movies.forEach(function(movie) {
    if( movie.Title.toLowerCase().includes(title.toLowerCase()) ||
        movie.OriginalTitle.toLowerCase().includes(title.toLowerCase()) ) {
          var mov = {
            "Title" : movie.Title,
            "ID" : movie.ID,
            "Status" : listType
          }
          result.push(mov)
    }
  })
  callback(result)
}

function getIdByTitle(title, listType, movies, callback){
  var req = client.get("http://www.finnkino.fi/xml/Events?listType=" + listType
    , function (data, response) {

      parseXml(data, searchMovies)

      function searchMovies(result) {
        if(result === "error")
          res.sendStatus(500)

        checkTitle(title, result.Events.Event, movies, listType, callback )
      }
    })
}

function getRating( title, callback ){
  var addr = 'http://www.omdbapi.com/?t=' + title
  var req = client.get(addr, function (data, response) {
    if (data.Response === "True") {
      var movie = {
        "Title": title,
        "imdbRating": data.imdbRating,
        "imdbVotes": data.imdbVotes
      }
    // Movie is not found in the omdb database
    } else {
      var movie = {
        "Title": title,
        "imdbRating": "N/A",
        "imdbVotes": "N/A"
      }
    }
    callback(movie)
  })
}

function sortRatings( movies, callback ){
  movies.sort(function(a, b) {
    if (a.imdbRating > b.imdbRating) {
      if (a.imdbRating === "N/A")
        return 1
      return -1
    } else if (a.imdbRating < b.imdbRating) {
      if (b.imdbRating === "N/A")
        return -1
      return 1
    } else {
      return 0
    }
  })
  callback( movies )
}

function collectRatings( movies, callback ){
  var result = []
  var maxRequests = movies.length
  var reqCount = 0

  movies.forEach(function(movie) {
    // Removing parenthesis, 3D and 2D from the title before request
    getRating( cutString(movie.OriginalTitle), add2Results )

    function add2Results(movie){
      result.push(movie)
      reqCount ++
      //All movie requests have been received
      if (reqCount === maxRequests)
        sortRatings( result, callback )
    }
  })
}

function findMovies(shows, callback){
  var movies = []
  shows.forEach(function(show) {
    if( !movies.includes(show.Title) )
      movies.push(show.Title)
  })
  callback(movies)
}

// Print timestamp and request url & params for each query.
router.use(function timeLog (req, res, next) {
  console.log('[', Date.now().toString(), '] Url: ', req.url, "Request params: ", req.params)
  next()
})

// TODO: Handle errors.
// List all theaters
router.get('/rest/theaters', function (req, res) {
	var req = client.get("http://www.finnkino.fi/xml/TheatreAreas", function (data, response) {

      parseXml(data, sendTheaters)

      function sendTheaters(result) {
        if(result === "error")
          res.sendStatus(500)

        res.status(200)
  	    res.json(result.TheatreAreas.TheatreArea)
      }
	})

	req.on('error', function (err) {
		res.sendStatus(500)
		res.send("Error when connecting to finnkino database.")
	    console.log('request error', err)
	})
})

// TODO: Handle errors
// Get list of movies running on a theater based on id.
router.get('/rest/movies/theater/:id', function (req, res) {

  var listType = "NowInTheatres"
  listType = req.query.listType

	var req = client.get("http://www.finnkino.fi/xml/Events?listType=" + listType + "&area=" + req.params.id
		, function (data, response) {
      parseXml(data, getMovies)

      function getMovies(result) {
        if(result === "error")
          res.sendStatus(500)

        collectRatings( result.Events.Event, handleResults )

        function handleResults( movies ){
          res.status(200)
          res.json(movies)
        }
      }
	})

	req.on('error', function (err) {
		res.sendStatus(500)
	    console.log('request error', err)
	})
})

// Get list of movies showing on a given date and area
router.get('/rest/movies/date/:date', function (req, res) {
  var date = req.params.date
  var theater = req.query.theater

	var req = client.get("http://www.finnkino.fi/xml/Schedule?dt=" + date + "&area=" + theater
		, function (data, response) {
      console.log(req.options);
      parseXml(data, handleMovies)

      function handleMovies(result) {
        if(result === "error")
          res.sendStatus(500)

        findMovies(result.Schedule.Shows.Show, handleResult)

        function handleResult(result){
          res.status(200)
          res.json(result)
        }
      }
    })

    req.on('error', function (err) {
  		res.sendStatus(500)
  	    console.log('request error', err)
    })
})

function getSchedule( id, movie, callback ){
  var req = client.get("http://www.finnkino.fi/xml/Schedule?eventID=" + id
    , function (data, response) {
      parseXml(data, handleShows)

      function handleShows(result) {
        if(result === "error")
          res.sendStatus(500)

        var shows = result.Schedule.Shows.Show
        var showTimes = []
        shows.forEach(function(show) {
          var showTime = {
            "Time": show.dttmShowStart,
            "Place": show.Theatre
          }
          showTimes.push(showTime)
        })

        movie["Shows"] = showTimes
        callback( 200, movie )
      }
    })
}

function getMovieInfo(id, callback){
  // TODO: There could be some more error handling regardin the format of the id
  if( id !== undefined && id !== "" )
    var addr = "http://www.finnkino.fi/xml/Events?eventID=" + id
  else {
    callback(400, "error")
  }

  var req = client.get(addr, function (data, response) {
    parseXml(data, handleMovieInfo)

    function handleMovieInfo(result) {
      if(result === "error")
        callback(500, "error")

      getRating( cutString(result.Events.Event.OriginalTitle ), handleResult)
      function handleResult(movie){
        getSchedule( id, movie, callback)
      }
    }
  })
}

// Get movie info and show times
router.get('/rest/movie/info/:id', function (req, res) {
  getMovieInfo( req.params.id, handle )

  function handle( code, result ){
    if( result === "error" ){
      res.sendStatus(code)
      console.log("Movie not found!")
    }
    res.status(code)
    res.json(result)
  }

  req.on('error', function (err) {
		res.sendStatus(500)
    console.log('request error', err)
  })
})

// Get the movie id based on the title
router.get('/rest/movie/id/:title', function (req, res) {
  var title = req.params.title
  var arr = []
  getIdByTitle(title, "NowInTheatres", arr, handleMovies)

  // Callback to be used after the first request is ready
  function handleMovies( movies ){
    getIdByTitle(title, "ComingSoon", movies, handleBoth)
  }

  // Callback after both requests are ready
  function handleBoth( movies ){
    res.status(200)
    res.json(movies)
  }
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
