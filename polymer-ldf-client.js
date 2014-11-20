Polymer({
  ready: function() {
    this.executeQuery();
  },

  executeQuery: function() {
    var query = 'SELECT ?p ?c WHERE {' +
          '?p a <http://dbpedia.org/ontology/Artist>.' +
          '?p <http://dbpedia.org/ontology/birthPlace> ?c.' +
        '}';
    var startFragment = 'http://data.linkeddatafragments.org/dbpedia';
    var fragmentsClient = new ldf.FragmentsClient(startFragment);
    var results = new ldf.SparqlIterator(query, {
      fragmentsClient: fragmentsClient,
    });

    var data = '';
    var showNext = (function() {
      var result = results.read();
      if (result === null) {
        results.once('readable', showNext);
      } else {
        data += JSON.stringify(result);
        console.log(JSON.stringify(result));
      }
    })();
  }

});