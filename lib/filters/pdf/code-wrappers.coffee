#!/usr/bin/env coffee

_      = require 'underscore'
pandoc = require 'pandoc-filter'

removeWrapper = (code) ->
  # Regex stuff
  code

action = (type, value, format, meta) ->
  switch type
    when 'CodeBlock'
      [ [ident, classes, kvs], body ] = value
      if _.contains(classes, 'scala')
        return pandoc.CodeBlock([ident, classes, kvs], removeWrapper(body))

pandoc.stdio(action)