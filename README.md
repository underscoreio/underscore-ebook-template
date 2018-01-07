# Underscore eBook Template

Copyright 2016 Underscore Consulting LLP.

Source code licensed under the [Apache License 2.0][license].

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

## Setup

This template uses a Docker container to allow setup without (much) agony.

You'll need Docker Machine if you're running on Windows or OS X. Setup a VM to run Docker containers using Docker Machine (you will probably do this as part of the Docker Machine install):

```bash
docker-machine create --driver virtualbox default
```

Check you have a running machine.

```bash
docker-machine ls
```

If you don't have one running, start one and setup the environment.

```bash
docker-machine start default
docker-machine env default
```

Build the image for the book environment

```bash
docker build -t underscore/book .
```

Now copy `docker-compose.yml` to the root of the book you're working on and run it. 

```bash
docker-compose run book bash
```
This will setup a shared filesystem so the material on your local filesystem can be seen by the Docker container and turned into a book, and give a `bash` prompt to interact with the Docker container.

```bash
sbt pdf
```

to generate a PDF version of the book you're working on.
