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
            "Title" : movie.Title,
            "ID" : movie.ID,
            "Status" : listType
          }
          result.push(mov)
    }
  })
  callback(result)
}

// Get the rating for a movie by title
function getRating( originalTitle, callback ){
  var title = cutString(originalTitle)
  var addr = 'http://www.omdbapi.com/?t=' + title + '&tomatoes=true'
  var req = client.get(addr, function (data, response) {
    if (data.Response === "True") {
      var movie = {
        "Title": originalTitle,
        "imdbRating": data.imdbRating,
        "imdbVotes": data.imdbVotes,
        "Metascore": data.Metascore,
        "tomatoMeter": data.tomatoMeter,
        "tomatoUserMeter": data.tomatoUserMeter
      }
    // Movie is not found in the omdb database
    } else {
      var movie = {
        "Title": originalTitle,
        "imdbRating": "N/A",
        "imdbVotes": "N/A",
        "Metascore": "N/A",
        "tomatoMeter": "N/A",
        "tomatoUserMeter": "N/A"
      }
    }
    callback(movie)
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

// Get a schedule for movie by id
function getSchedule( id, movie, callback ){
  var req = client.get("http://www.finnkino.fi/xml/Schedule?eventID=" + id
    , function (data, response) {
      exports.parseXml(data, handleShows)

      function handleShows(result) {
        if(result === "error")
          res.sendStatus(500)

        var shows = result.Schedule.Shows.Show
        var showTimes = []
        shows.forEach(function(show) {
          var showTime = {
            "startTime": show.dttmShowStart,
            "endTime": show.dttmShowEnd,
            "Place": show.Theatre,
            "ageRating": show.Rating
          }
          showTimes.push(showTime)
        })

        movie["Shows"] = showTimes
        callback( 200, movie )
      }
    })
}

// Parses XML to js by using xml2js.parseString()
exports.parseXml = function parseXml(xml, callback){
  parseString(xml, {explicitArray: false}, function (err, result) {
    if(err) {
      console.log(err)
      return "error"
    }
    callback(result)
  })
}

// Gets the id of movies by given title
exports.getIdByTitle = function getIdByTitle(title, listType, movies, callback){
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

// Get ratings for movies
exports.collectRatings = function collectRatings( movies, callback ){
  var result = []
  var maxRequests = movies.length
  var reqCount = 0

  movies.forEach(function(movie) {
    // Removing parenthesis, 3D and 2D from the title before request
    getRating( movie.OriginalTitle, add2Results )

    function add2Results(movie){
      result.push(movie)
      reqCount ++
      //All movie requests have been received
      if (reqCount === maxRequests)
        sortRatings( result, callback )
    }
  })
}

// Finds all movies from shows by title
exports.findMovies = function findMovies(shows, callback){
  var movies = []
  shows.forEach(function(show) {
    if( !movies.includes(show.Title) )
      movies.push(show.Title)
  })
  callback(movies)
}

// Gets the ratings and schedule for movie by id
exports.getMovieInfo = function getMovieInfo(id, callback){
  if( id !== undefined && id !== "" )
    var addr = "http://www.finnkino.fi/xml/Events?eventID=" + id
  else {
    callback(400, "Error: Id not found!")
  }

  var req = client.get(addr, function (data, response) {
    exports.parseXml(data, handleMovieInfo)

    function handleMovieInfo(result) {
      if(result === "error")
        callback(500, "error")

      try {
        getRating( result.Events.Event.OriginalTitle, handleResult)
        function handleResult(movie) {
          getSchedule( id, movie, callback)
        }
      }

      catch(err) {
        callback( 400, "Error: Movie not found!")
      }
    }
  })
}
