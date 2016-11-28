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
    * **Description:** Palauttaa listan eri teatterivaihtoehdoista
    * **Status codes:**
      * 200: If successful

### /movies/date/:date?theater={theater_id}
  * Format: dd.mm.yyyy
  * Defaults to today
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa kaikki elokuvat joita näytetään finnkinon teattereissa annettuna päivänä.
    * **Status codes:**
      * 200: If successful

### /movies/theater/:id?listType={NowInTheatres|ComingSoon}
  * Defaults to NowInTheatres
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa teatterissa näkyvät tai sinne tulossa olevat elokuvat ja niiden arvostelut. Jos id:tä ei tunnisteta, palautetaan kaikissa teattereissa näkyvät elokuvat.
    * **Status codes:**
      * 200: If successful

### /movie/info/:id
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa id:n perusteella elokuvan tiedot ja arvostelut, sekä näytösajat jos niitä on.
    * **Status codes:**
      * 200: If successful

### /movie/id/:title
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa kaikki elokuvat nimen ja id:n kanssa, joiden nimessä on annettu :title.
    * **Status codes:**
      * 200: If successful
