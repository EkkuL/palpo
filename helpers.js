var exports = module.exports = {}

// Client for fetching data from public APIS
var Client = require('node-rest-client').Client
var client = new Client()

// For parsing XML to JSON
var parseString = require('xml2js').parseString

// Function for removing parenthesis and 3D/2D abbreviations from the movie title
// because the omdb title search must be done without these.
function cutString(s){
  var x = s.split("(", 1)
  x = x[0].split("3D", 1)
  x = x[0].split("2D", 1)
  x = x[0]
  return x
}

// Function for checking if the searched title is found from movies
function checkTitle(title, movies, callback){
  var result = []
  movies.forEach(function(movie) {
    if( movie.Title.toLowerCase().includes(title.toLowerCase()) ||
        movie.OriginalTitle.toLowerCase().includes(title.toLowerCase()) ) {
          var mov = {
            "ID" : movie.ID,
            "Title" : movie.Title,
            "OriginalTitle": movie.OriginalTitle
          }
          result.push(mov)
    }
  })
  callback(result)
}

// Function for finding matchin movie for title
function matchTitle(title, movies, callback){
  var found = false
  movies.forEach(function(movie) {
    if( movie.Title.toLowerCase() === title.toLowerCase() ||
        movie.OriginalTitle.toLowerCase() === title.toLowerCase() ) {
          found = true
          var mov = {
            "ID" : movie.ID,
            "Title" : movie.Title,
            "OriginalTitle": movie.OriginalTitle
          }
          callback(mov)
    }
  })
  if( !found )
    callback("Not found")
}

// Get the rating for a movie by title
function getRating( movie, callback ){
  var title = cutString(movie.OriginalTitle)
  var addr = 'http://www.omdbapi.com/?t=' + title + '&tomatoes=true'
  var req = client.get(addr, function (data, response) {
    if (data.Response === "True") {
      movie["imdbRating"] = data.imdbRating
      movie["imdbVotes"] = data.imdbVotes
      movie["Metascore"] = data.Metascore
      movie["tomatoMeter"] = data.tomatoMeter
      movie["tomatoUserMeter"] = data.tomatoUserMeter
    // Movie is not found in the omdb database
    } else {
      movie["imdbRating"] = "N/A"
      movie["imdbVotes"] = "N/A"
      movie["Metascore"] = "N/A"
      movie["tomatoMeter"] = "N/A"
      movie["tomatoUserMeter"] = "N/A"
    }
    callback(movie)
  })
}

// Sort movies by imdb ratings, secondarily by Metascore, thirdly by tomatoMeter
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
        if( a.Metascore > b.Metascore ){
          if (a.Metascore === "N/A")
            return 1
          return -1
        }
        else if( a.Metascore < b.Metascore ){
          if (b.Metascore === "N/A")
            return -1
          return 1
        }
        else {
          if( a.tomatoMeter > b.tomatoMeter){
            if( a.tomatoMeter === "N/A")
              return 1
            return -1
          }
          else if( a.tomatoMeter < b.tomatoMeter){
            if( b.tomatoMeter === "N/A")
              return -1
            return 1
          }
        }
      return 0
    }
  })
  callback( movies )
}

// Get Show times and places for a movie from a show list
function getShowInfo(shows, callback) {
  var result = []

  if( shows !== undefined ) {
    if( Array.isArray(shows) ){
      shows.forEach(function(show) {
        var showTime = {
          "startTime": show.dttmShowStart,
          "endTime": show.dttmShowEnd,
          "Place": show.Theatre,
          "ageRating": show.Rating
        }
        result.push(showTime)
      })
    } else {
      var showTime = {
        "startTime": shows.dttmShowStart,
        "endTime": shows.dttmShowEnd,
        "Place": shows.Theatre,
        "ageRating": shows.Rating
      }
      result.push(showTime)
    }
  }
  callback(result)
}

// Get a schedule for movie by id
function getSchedule( id, movie, theater, callback ){
  var addr = "http://www.finnkino.fi/xml/Schedule?eventID=" + id + "&area=" + theater
  var req = client.get(addr, function (data, response) {
    parseXml(data, handleShows)

    function handleShows(result) {
      if(result === "error")
        res.sendStatus(500)

      try {
        getShowInfo( result.Schedule.Shows.Show, handleShowInfo )

        function handleShowInfo( shows ){
          movie["Shows"] = shows
          callback( 200, movie )
        }
      }
      catch(err) {
        console.error(err)
        movie["Shows"] = []
        callback( 200, movie )
      }
    }
  })
}

// Parses XML to js by using xml2js.parseString()
function parseXml(xml, callback){
  parseString(xml, {explicitArray: false}, function (err, result) {
    if(err) {
      console.error(err)
      return "error"
    }
    callback(result)
  })
}

// Get ratings for movies
function collectRatings( movies, callback ){
  var result = []

  if ( movies !== undefined ) {
    if(Array.isArray(movies)) {
      var maxRequests = movies.length
      var reqCount = 0

      if( maxRequests === 0 )
        callback( [] )
      else {
        movies.forEach(function(movie) {
          var titles = {
            "ID": movie.ID,
            "Title": movie.Title,
            "OriginalTitle": movie.OriginalTitle
          }
          getRating( titles, add2Results )

          function add2Results(movie){
            result.push(movie)
            reqCount ++
            //All movie requests have been received
            if (reqCount === maxRequests)
              sortRatings( result, callback )
          }
        })
      }
    } else {
      var titles = {
        "ID": movies.ID,
        "Title": movies.Title,
        "OriginalTitle": movies.OriginalTitle
      }
      getRating( titles, handleMovie )

      function handleMovie( movie ){
        result.push( movie )
        callback( result )
      }
    }
  }
}

// Gets all events from shows
function getShowTimes(shows, callback){
  var result = []

  if( shows !== undefined ) {
    if( Array.isArray(shows) ){
      var movies = []
      shows.forEach(function(show) {
        var showTime = {
          "Title": show.Title,
          "OriginalTitle": show.OriginalTitle,
          "startTime": show.dttmShowStart,
          "endTime": show.dttmShowEnd,
          "Place": show.Theatre,
          "ageRating": show.Rating
        }
          result.push(showTime)
      })
    } else {
      result.push(shows.Title)
    }
  }
  callback( result )
}

// Get all coming finnkino events
function getComingEvents(callback){
  var addr = "http://www.finnkino.fi/xml/Events?listType=" + "ComingSoon"
  var req = client.get(addr, function (data, response) {
    parseXml(data, searchMovies)

    function searchMovies(result) {
      if(result === "error")
        res.sendStatus(500)

      callback(result.Events.Event)
    }
  })
}

// Get all current finnkino events
function getCurrentEvents(callback){
  var addr = "http://www.finnkino.fi/xml/Events"
  var req = client.get(addr, function (data, response) {
    parseXml(data, searchMovies)

    function searchMovies(result) {
      if(result === "error")
        res.sendStatus(500)

      callback(result.Events.Event)
    }
  })
}

// Get all finnkino events
function getAllEvents(callback){
  getCurrentEvents(handleCurrent)
  var events = []

  function handleCurrent( result ){
    events = result
    getComingEvents(handleEvents)

    function handleEvents( result ){
      var final = events.concat(result)
      // TODO: remove duplicates
      // removeDuplicates(final)
      callback(final)
    }
  }
}

// Get a specific movie by id
function getEvent( id, callback ){
  var addr = "http://www.finnkino.fi/xml/Events?eventID=" + id
  var req = client.get(addr, function (data, response) {
    parseXml(data, handleMovieInfo)

    function handleMovieInfo(result) {
      if(result === "error")
        callback(500, "error")

      try {
        var titles = {
          "ID": result.Events.Event.ID,
          "Title": result.Events.Event.Title,
          "OriginalTitle": result.Events.Event.OriginalTitle
        }
        callback( titles )
      }

      catch(err) {
        console.error(err)
        callback( 400, "Error: Movie not found!")
      }
    }
  })
}

function getInfoById(id, theater, callback){
  getEvent( id, handleEvent )
  function handleEvent( titles ){
    getRating( titles, handleResult )
  }

  function handleResult(movie) {
    getSchedule( id, movie, theater, callback)
  }
}

function getIdByTitle(title, callback){
  getAllEvents( handleEvents )

  function handleEvents( result ){
    matchTitle( title, result, handle )
  }

  function handle( titles ){
    callback( titles )
  }
}

function getRatingAndSchedule( titles, theater, callback ){
  getRating( titles, handleResult )

  function handleResult(movie) {
    getSchedule( titles.ID, movie, theater, callback)
  }
}

// Gets the ratings and schedule for movie by id
exports.getMovieInfo = function getMovieInfo(id, title, theater, callback){
  if( id !== undefined && id !== "" )
    getInfoById(id, theater, handleResult)
  else if( title !== undefined && title !== "" )
    getIdByTitle( title, handleId )
  else
    callback(400, "Error: Neither id nor title found!")

  function handleId( titles ){
    if( titles === "Not found" ){
      callback(400, "Error: Title doesn't match any movie!")
    } else {
      getRatingAndSchedule( titles, theater, handleResult )
    }
  }

  function handleResult( code, result ){
    callback( code, result )
  }
}

// Get list of all theaters
exports.getTheaters = function getTheaters(callback){
  var req = client.get("http://www.finnkino.fi/xml/TheatreAreas", function (data, response) {
      parseXml(data, sendTheaters)

      function sendTheaters(result) {
        if(result === "error")
          callback( 500, error )

        callback( 200, result.TheatreAreas.TheatreArea )
      }
	})
}

// Get list of movies running on a theater based on id.
exports.getEvents = function getEvents(listType, theater, callback){
  var addr = "http://www.finnkino.fi/xml/Events?listType=" + listType + "&area=" + theater
  var req = client.get(addr, function (data, response) {
    parseXml(data, getMovies)

    function getMovies(result) {
      if(result === "error")
        callback( 500, error )

			try {
        collectRatings( result.Events.Event, handleResults )

        function handleResults( movies ){
          callback( 200, movies )
        }
			}
			// No movies found
			catch(err) {
        console.error(err)
				callback( 200, [] )
      }
    }
	})
}

// Get list of movies showing on a given date and area
exports.getShows = function getShows(date, theater, callback){
  var addr = "http://www.finnkino.fi/xml/Schedule?dt=" + date + "&area=" + theater
  var req = client.get(addr, function (data, response) {
    parseXml(data, handleMovies)

    function handleMovies(result) {
      if(result === "error")
        callback( 500, error )

			try {
        getShowTimes(result.Schedule.Shows.Show, handleResult)

        function handleResult(result){
          callback( 200, result )
        }
			}
			// No movies found
			catch(err) {
        console.error(err)
				callback( 200, [] )
			}
    }
  })
}

// Get all movies that have the searched title in their title
exports.getTitles = function getTitles(title, theater, callback){
  getAllEvents( handleEvents )

  function handleEvents( result ){
    checkTitle( title, result, handleMovies )
  }

  function handleMovies( result ){
    collectRatings(result, handleResults )
  }

  function handleResults( result ){
    callback( 200, result )
  }
}
