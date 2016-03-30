'use strict'

pandoc = require 'pandoc-filter'

# String helpers --------------------------------

createFilter = (extension) ->
  return (type, value, format, meta) ->
    switch type
      when 'Image'
        [ caption, [ filename, prefix ], target ] = value
        match = filename.match /^(.*)[.]pdf[+]svg$/i
        if match
          basename = match[1]
          return pandoc.Image(caption, [ "#{basename}.#{extension}", prefix ], target)

module.exports = {
  createFilter
}
