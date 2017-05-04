#!/usr/bin/env coffee

_      = require 'underscore'
pandoc = require 'pandoc-filter'

###
This script strips the object/import pattern
needed to emulate Scala's :paste mode in Tut:

```scala
object wrapper {

}; import wrapper._
```
###

emptyRegex   = /^\s*(?:\/[\/*].*)?$/
openingRegex = /^\s*object\s+([a-zA-Z0-9_]+)\s*\{[\r\n]*/
closingRegex = /[\r\n]*\}[\s;]+import\s*([a-zA-Z0-9_]+)\._\s*$/

unindentBy = (line, indent) ->
  # If there are at least that many whitespaces at the start...
  if line.substring(0, indent).trim().length == 0
    line.substring(indent, line.length)
  else
    console.error("""Can't unindent "#{line}" by #{indent} spaces.""")
    line

indentSize = (line) -> # detects how many spaces this line is indented by
  match = line.match(/[^\s]/)
  if match? then match.index else 0

unindent = (text) ->
  lines = text.split('\n')

  indent = _.chain(lines)
    .filter((l) -> !emptyRegex.test(l))
    .map((l) -> indentSize(l))
    .min()
    .value()

  _.map(lines, (l) -> unindentBy(l, indent)).join('\n')

filter = (type, value, format, meta) ->
  unless type == 'CodeBlock'
    return

  [ [ident, classes, kvs], body ] = value

  unless _.contains(classes, 'scala')
    return

  openingMatch = body.match(openingRegex)
  closingMatch = body.match(closingRegex)

  unless openingMatch? && closingMatch? && openingMatch[1] == closingMatch[1]
    return

  pandoc.CodeBlock(
    [ident, classes, kvs]
    unindent(body.replace(openingRegex, '').replace(closingRegex, ''))
  )

createFilter = ->
  filter

module.exports = {
  createFilter
}
