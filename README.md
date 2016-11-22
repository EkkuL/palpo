Palvelupohjaiset järjestelmät kurssin harjoitustyö
------------------

### Käytettävät rajapinnat:
* Finnkino XML Services - http://www.finnkino.fi/xml
* Ja toinen/molemmat seuraavista:
* OMDb API - http://www.omdbapi.com/
* The Movie DB - https://www.themoviedb.org/documentation/api

### Idea:
Yhdistetään käyttäjälle Finnkinossa tarjolla olevat elokuvat sekä niiden IMDB:ssä ja/tai muualla saamat arvostelut, jotta käyttäjät voivat käyttää muiden arvioita elokuvavalintaansa tehdessä.

### Toteutus:
REST API toteutetaan Nodella ja palauttaa vastaukset JSON-formaatissa.

### REST Rajapinnan dokumentaatio:

#### Teatterit

##### URI: /theaters
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa listan eri teatterivaihtoehdoista
    * **Status codes:** 
      * 200: If successful

##### URI: /movies/:date (Format: dd.mm.yyyy)
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa kaikki elokuvat joita näytetään finnkinon teattereissa annettuna päivänä.
    * **Status codes:** 
      * 200: If successful

##### URI: /movies/:theater?listType={NowInTheatres|ComingSoon}
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa teatterissa näkyvät elokuvat ja niiden arvostelut
    * **Status codes:** 
      * 200: If successful

##### URI: /movie/:movie_title
  * **HTTP Method:** GET
    * **Media types:** application/json
    * **Description:** Palauttaa elokuvan tiedot ja arvostelut, sekä näytösajat jos niitä on.
    * **Status codes:** 
      * 200: If successful