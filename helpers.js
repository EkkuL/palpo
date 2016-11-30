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
function checkTitle(title, movies, result, listType, callback){
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
  //collectRatings(result, callback)
  callback(result)
}

// Get the rating for a movie by title
function getRating( movie, callback ){
  var title = cutString(movie.OriginalTitle)
  var addr = 'http://www.omdbapi.com/?t=' + title + '&tomatoes=true'
  var req = client.get(addr, function (data, response) {
    if (data.Response === "True") {
      var mov = {
        "ID": movie.ID,
        "Title": movie.Title,
        "OriginalTitle": movie.OriginalTitle,
        "imdbRating": data.imdbRating,
        "imdbVotes": data.imdbVotes,
        "Metascore": data.Metascore,
        "tomatoMeter": data.tomatoMeter,
        "tomatoUserMeter": data.tomatoUserMeter
      }
    // Movie is not found in the omdb database
    } else {
      var mov = {
        "ID": movie.ID,
        "Title": movie.Title,
        "OriginalTitle": movie.OriginalTitle,
        "imdbRating": "N/A",
        "imdbVotes": "N/A",
        "Metascore": "N/A",
        "tomatoMeter": "N/A",
        "tomatoUserMeter": "N/A"
      }
    }
    callback(mov)
  })
}

// Sort movies by imdb ratings, and secondarily by Metascore, thirdly by tomatoMeter
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

  if(Array.isArray(movies)) {
    var maxRequests = movies.length
    var reqCount = 0

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

// Gets all events from shows
function getShowsTimes(shows, callback){
  var result = []

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
  callback( result )
  //collectRatings( result, callback )
}

// Gets the id of movies by given title
function getIdByTitle(title, theater, movies, listType, callback){
  var addr = "http://www.finnkino.fi/xml/Events?listType=" + listType + "&area=" + theater
  var req = client.get(addr, function (data, response) {
    parseXml(data, searchMovies)

    function searchMovies(result) {
      if(result === "error")
        res.sendStatus(500)

      checkTitle(title, result.Events.Event, movies, listType, callback )
    }
  })
}

function findMovie( title, movies, ifFound ){
  movies.forEach(function (movie) {
    if( title.toLowerCase() === movie.Title.toLowerCase() ){
      var titles = {
        "ID": movie.ID,
        "Title": movie.Title,
        "OriginalTitle": movie.OriginalTitle
      }
      getRating( titles, ifFound )
      return
    }
  })
  notFound()
}

function searchMovie(title, listType, callback) {
  var addr = "http://www.finnkino.fi/xml/Events?listType=" + listType
  var req = client.get(addr, function (data, response) {
    parseXml(data, getMovie)

    function getMovie(result) {
      if(result === "error")
        callback( 500, error )

			try {
        findMovie( result.Events.Event, callback )

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

function getMovieByTitle(title, theater, callback){

}

// Gets the ratings and schedule for movie by id
exports.getMovieInfo = function getMovieInfo(id, title, theater, callback){
  if( id !== undefined && id !== "" )
    var addr = "http://www.finnkino.fi/xml/Events?eventID=" + id
  else if( title !== undefined && title !== "" ){
    //TODO
    /*exports.getEvents()
    if( title ==! "" && title.toLowerCase() === movie.Title.toLowerCase()){
      getRating( titles, handleMovie )
    }*/
    return
  }
  else {
    callback(400, "Error: Neither id nor title found!")
    return
  }

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
        getRating( titles, handleResult)
        function handleResult(movie) {
          getSchedule( id, movie, theater, callback)
        }
      }

      catch(err) {
        console.error(err)
        callback( 400, "Error: Movie not found!")
      }
    }
  })
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
        getShowsTimes(result.Schedule.Shows.Show, handleResult)

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

exports.getTitles = function getTitles(title, theater, callback){
  getIdByTitle(title, theater, [], "NowInTheatres", handleMovies)

  // Callback to be used after the first request is ready
  function handleMovies( movies ){
    getIdByTitle(title, theater, movies, "ComingSoon", handleBoth)
  }

  // Callback after both requests are ready
  function handleBoth( movies ){
		collectRatings(movies, handleResults)

    function handleResults(result){
      callback( 200, result )
    }
  }
}
