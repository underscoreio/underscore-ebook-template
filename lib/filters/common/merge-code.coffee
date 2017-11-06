'use strict'

pandoc = require 'pandoc-filter'

# String helpers --------------------------------

last = null

# Newer versions of Pandoc output code listings as
# raw latex blocks containing lstlisting environments
# instead of as code blocks:
listingBeginRegex = /^\\begin\{lstlisting\}\[style=([^\]]+)\]/
listingEndRegex   = /\\end\{lstlisting\}$/

areMergeable = (a, b) ->
  # Merge CodeBlock-style blocks:
  if a.t == 'CodeBlock' && b.t == 'CodeBlock'
    aLang = a.c[0][1][0]?
    bLang = b.c[0][1][0]?
    aLang == bLang
  # Merge raw LaTeX blocks containing matching lstlisting environments:
  else if a.t == 'RawBlock' && b.t == 'RawBlock'
    aLang = a.c[1].match(listingBeginRegex)?[1]
    bLang = b.c[1].match(listingBeginRegex)?[1]
    !!aLang && !!bLang && aLang == bLang
  else
    false

mergeTwo = (a, b) ->
  # Merge CodeBlock-style blocks:
  if a.t == 'CodeBlock' && b.t == 'CodeBlock'
    pandoc.CodeBlock(a.c[0], a.c[1] + "\n\n" + b.c[1])
  # Merge raw LaTeX blocks containing matching lstlisting environments:
  else if a.t == 'RawBlock' && b.t == 'RawBlock'
    pandoc.CodeBlock(a.c[0], a.c[1].replace(listingBeginRegex, '') + b.c[1].replace(listingEndRegex))
  else
    false

mergeAll = (blocks, accum = []) ->
  switch blocks.length
    when 0 then accum
    when 1 then accum.concat(blocks)
    else
      [ a, b, tail... ] = blocks
      if areMergeable(a, b)
        mergeAll([ mergeTwo(a, b) ].concat(tail), accum)
      else
        mergeAll([ b ].concat(tail), accum.concat([ a ]))

createFilter = () ->
  return (type, value, format, meta) ->
    switch type
      when 'Pandoc'
        [ meta, blocks ] = value
        return { t: 'Pandoc', c: [ meta, mergeAll(blocks) ] }
      when 'BlockQuote'
        blocks = value
        return pandoc.BlockQuote(mergeAll(blocks))
      when 'Div'
        [ attr, blocks ] = value
        return pandoc.Div(attr, mergeAll(blocks))
      when 'Note'
        blocks = value
        return pandoc.Note(mergeAll(blocks))
      when 'ListItem'
        [ blocks ] = value
        return pandoc.ListItem(mergeAll(blocks))
      when 'Definition'
        [ blocks ] = value
        return pandoc.Definition(mergeAll(blocks))
      when 'TableCell'
        [ blocks ] = value
        return pandoc.TableCell(mergeAll(blocks))

# Rewrite of pandoc.stdio
# that treats the top-level Pandoc as a single element
# so we can merge code blocks at the top level -.-
stdioComplete = (action) ->
  stdin = require('get-stdin')
  stdin (json)  ->
    data   = JSON.parse(json)
    data   = Object.assign(data, { blocks: mergeAll(data.blocks) })
    format = if process.argv.length > 2 then process.argv[2] else ''
    output = pandoc.filter(data, action, format)
    # console.error(new Error(JSON.stringify(temp)))
    # output = [ { meta: temp[0].meta }, mergeAll(temp[1]) ]
    process.stdout.write(JSON.stringify(output))
    return

module.exports = {
  createFilter
  stdioComplete
}
