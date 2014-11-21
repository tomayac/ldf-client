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
    results.on('data', function (data) {
      that.fire('query-response', data);
    });
  }

});