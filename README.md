&lt;polymer-ldf-client&gt;
==========================

A declarative [Linked Data Fragments](http://linkeddatafragments.org) client in the form of a [Web Component](http://webcomponents.org/).
Simply insert the ```<polymer-ldf-client>``` in your page, fill in the required attribute values,
and you are ready to go.

Installation
============

This assumes that you have [bower](http://bower.io/) installed.

```sh
$ mkdir web-components
$ cd web-components
$ git clone git@github.com:tomayac/polymer-ldf-client.git
$ cd polymer-ldf-client
$ bower install
$ cd ..
$ python -m SimpleHTTPServer
```

Finally visit [http://localhost:8000/polymer-ldf-client/](http://localhost:8000/polymer-ldf-client/)
and follow the [demo](http://localhost:8000/polymer-ldf-client/demo.html) link. 

Basic Usage
===========

The example below shows basic usage instructions for the element.

```html
<!doctype html>
<html>
  <head>
    <script src="../webcomponentsjs/webcomponents.min.js"></script>
    <link rel="import" href="polymer-ldf-client.html">
  </head>
  <body unresolved>
    <!-- Streaming example -->
    <polymer-ldf-client
        id="polymer-ldf-client-streaming"
        responseFormat="streaming"
        query="SELECT DISTINCT ?frag WHERE {
                 ?a a &lt;http://advene.org/ns/cinelab/ld#Annotation&gt; ;
                   &lt;http://advene.org/ns/cinelab/ld#hasFragment&gt; ?frag ;
                   &lt;http://advene.org/ns/cinelab/ld#taggedWith&gt;
                     [ &lt;http://purl.org/dc/elements/1.1/title&gt; 'personnages: Margaret'],
                     [ &lt;http://purl.org/dc/elements/1.1/title&gt; 'personnages: Grand Papa Pollitt'];
                   .
               }"
        startFragment="http://spectacleenlignes.fr/ldf/spectacle_en_lignes">
    </polymer-ldf-client>

    <!-- Polling example -->
    <polymer-ldf-client
        id="polymer-ldf-client-polling"
        responseFormat="polling"
        query="SELECT DISTINCT ?tag WHERE {
                 [ a &lt;http://advene.org/ns/cinelab/ld#Annotation&gt; ;
                   &lt;http://advene.org/ns/cinelab/ld#taggedWith&gt;
                     [ &lt;http://purl.org/dc/elements/1.1/title&gt;  ?tag ]
                  ]
               }"
        startFragment="http://spectacleenlignes.fr/ldf/spectacle_en_lignes">
    </polymer-ldf-client>

    <button value="Poll" id="button">Poll</button>

    <script>
      document.addEventListener('polymer-ready', function() {
        /* Streaming example */
        var ldfClientStreaming = document.querySelector('#polymer-ldf-client-streaming');
        // Process data as it appears
        ldfClientStreaming.addEventListener('ldf-query-streaming-response-partial',
            function(e) {
          var pre = document.createElement('pre');
          pre.textContent = JSON.stringify(e.detail.response);
          document.body.appendChild(pre);
        });
        // Get notified once all data is received
        ldfClientStreaming.addEventListener('ldf-query-streaming-response-end', function() {
          alert('Received all data');
        });

        /* Polling example */
        var ldfClientPolling = document.querySelector('#polymer-ldf-client-polling');
        // Poll for data
        ldfClientPolling.addEventListener('ldf-query-polling-response', function(e) {
          var pre = document.createElement('pre');
          pre.textContent = JSON.stringify(e.detail.response);
          document.body.appendChild(pre);
        });
        // Manually trigger polling
        var button = document.querySelector('#button');
        button.addEventListener('click', function() {
          ldfClientPolling.showNext();
        });
      });
    </script>
  </body>
</html>
```

License
=======
Copyright 2014 Thomas Steiner (tomac@google.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
