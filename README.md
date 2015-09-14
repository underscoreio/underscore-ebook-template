# Underscore eBook Template

Copyright 2015 Underscore Consulting LLP.

Source code licensed under the [Apache License 2.2][license].

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons Licence" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a><br />Template content licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Overview

Template for Underscore eBooks, based on [Node], [Pandoc], and [Grunt].
See the source code for [Creative Scala][creative-scala]
for a complete example of use.

[Node]: https://nodejs.org
[Pandoc]: http://pandoc.org/
[Grunt]: http://gruntjs.com/
[license]: https://httpd.apache.org/docs/2.2/license.html
[creative-scala]: https://github.com/underscoreio/creative-scala

## Configuration Guide

The following settings are supported a book's _metadata.yaml_:

 Key           | Value
-------------- | -------------
`title`        | String
`author`       | String, multiple authors represented as: `Name and Name`
`date`         | String, publication identifier such as: `Early Access May 2015`
`filenameStem` | String, filename used for HTML, EPUB, PDF output. E.g., `essential-play`
`copyright`    | String, copyright year or range: `2015` or `2011-2015`.
`tocDepth`     | Integer, number of levels for table of contents. E.g., `3`
`coverColor`   | String, colour of PDF cover. E.g., `F58B40`
`pages`        | Array, list of pages in rendering order
`previewPages` | Array, list of pages for the preview versions in rendering order.
