Polymer({
  ready: function() {
    this.executeQuery();
  },

  executeQuery: function() {
    var that = this;
    var query = this.query;
    console.log('Query:\n' + query);
    var startFragment = this['start-fragment'];
    console.log('Start Fragment:\n' + startFragment);
    if (!query || !startFragment) {
      return;
    }

    var fragmentsClient = new ldf.FragmentsClient(startFragment);
    var results = new ldf.SparqlIterator(query, {
      fragmentsClient: fragmentsClient,
    });

    var data = '';
    (function showNext() {
      var result = results.read();
      if (result === null) {
        results.once('readable', showNext);
      } else {
        data += JSON.stringify(result);
        console.log(JSON.stringify(result));
        console.log('Fired "query-response"');
        that.fire('query-response', data);
      }
    })();

  }

});