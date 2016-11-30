Palvelupohjaiset järjestelmät kurssin harjoitustyö
------------------

TIE-26300 Palvelupohjaiset järjestelmät kurssin harjoitustyö, jossa ideana yhdistää kaksi julkista API:a (API Mashup) ja tuottaa oma REST rajapinta.

## Käytettävät rajapinnat:
* Finnkino XML Services - http://www.finnkino.fi/xml
* Ja toinen/molemmat seuraavista:
* OMDb API - http://www.omdbapi.com/
* The Movie DB - https://www.themoviedb.org/documentation/api

## Idea
Yhdistetään käyttäjälle Finnkinossa tarjolla olevat elokuvat sekä niiden IMDB:ssä ja/tai muualla saamat arvostelut, jotta käyttäjät voivat käyttää muiden arvioita elokuvavalintaansa tehdessä.

## Toteutus
REST API toteutetaan Nodella ja palauttaa vastaukset JSON-formaatissa.

## REST Rajapinnan dokumentaatio

### /theaters
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa listan eri teatterivaihtoehdoista ja näiden ID:t
    * **Status codes:**
      * 200: If successful
      * 500: If there is an error parsing the XML or request error

### /movies?listType={NowInTheatres|ComingSoon}&theater={theater_id}
  * Defaults to NowInTheatres
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa teattereissa näkyvät tai sinne tulossa olevat elokuvat ja niiden arvostelut.
    * **Status codes:**
      * 200: If successful
      * 500: If there is an error parsing the XML or request error

### /movies/search/:title?theater={theater_id}
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa kaikki elokuvat nimen ja id:n kanssa, joiden nimessä on annettu :title.
    * **Status codes:**
      * 200: If successful
      * 500: If there is an error parsing the XML or request error

### /movie?id={movie_id}&title={movie_title}&theater={theater_id}
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa elokuvan tiedot ja arvostelut, sekä näytösajat jos niitä on.
    * **Status codes:**
      * 200: If successful
      * 500: If there is an error parsing the XML or request error
      * 400: If id/title doesn't match any movie or id/title is not found

### /shows?date={date}&theater={theater_id}&movie={movie_id}
  * date format: dd.mm.yyyy, defaults to today
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa kaikki näytökset finnkinon teattereissa annettuna päivänä.
    * **Status codes:**
      * 200: If successful
      * 500: If there is an error parsing the XML or request error
