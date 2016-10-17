#global module:false

"use strict"

path    = require 'path'
process = require 'child_process'
yaml    = require 'js-yaml'
fs      = require 'fs'

module.exports = (grunt, options = {}) ->
  minify      = grunt.option('minify') ? false

  libDir      = options.dir?.lib       ? "node_modules/underscore-ebook-template/lib"
  srcDir      = options.dir?.src       ? "src"
  distDir     = options.dir?.dist      ? "dist"
  metaSrcDir  = options.dir?.meta      ? "#{srcDir}/meta"
  pageSrcDir  = options.dir?.page      ? "#{srcDir}/pages"
  cssSrcDir   = options.dir?.css       ? "#{srcDir}/css"
  jsSrcDir    = options.dir?.js        ? "#{srcDir}/js"
  tplSrcDir   = options.dir?.template  ? "#{srcDir}/templates"
  coverSrcDir = options.dir?.cover     ? "#{srcDir}/covers"

  grunt.loadNpmTasks "grunt-browserify"
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-contrib-connect"
  grunt.loadNpmTasks "grunt-contrib-less"
  grunt.loadNpmTasks "grunt-contrib-watch"
  # grunt.loadNpmTasks "grunt-exec"
  grunt.loadNpmTasks "grunt-css-url-embed"

  joinLines = (lines) ->
    lines.split(/[ \r\n]+/).join(" ")

  createObject = (pairs...) ->
    ans = {}
    for [ key, value ] in pairs
      ans[key] = value
    ans

  runCommand = (command, done, options = {}) ->
    grunt.log.write("Running shell command: #{command}\n")

    proc = process.exec(command, options)

    proc.stdout.on 'data', (d) -> grunt.log.write(d)
    proc.stderr.on 'data', (d) -> grunt.log.error(d)

    proc.on 'error', (err) ->
      grunt.log.error("Shell command failed with: #{err}")
      done(false)

    proc.on 'exit', (code) ->
      if code == 0
        grunt.log.write("Shell command exited with code 0")
        done()
      else
        grunt.log.error("Shell command exited with code #{code}")
        done(false)

    return

  meta = yaml.safeLoad(fs.readFileSync("./#{metaSrcDir}/metadata.yaml", 'utf8'))

  unless typeof meta.filenameStem == "string"
    grunt.fail.fatal("'filename' in metadata must be a string")

  if meta.exercises
    unless typeof meta.exercises?.repo == "string"
      grunt.fail.fatal("'exercises.repo' in metadata must be a string")

    unless typeof meta.exercises?.name == "string"
      grunt.fail.fatal("'exercises.name' in metadata must be a string")
  else if meta.exercisesRepo
    grunt.fail.fatal("""Metadata key 'exercisesRepo: string' is deprecated.
                        Replace with 'exercises: { repo: string, name: string }'""")

  unless Array.isArray(meta.pages)
    grunt.fail.fatal("'pages' in metadata must be an array of strings")

  unless meta.copyright
    grunt.fail.fatal("'copyright' in metadata must be a string such as '2015' or '2014-2015'")

  grunt.initConfig
    clean:
      main:
        src: "dist"

    less:
      main:
        options:
          paths: [
            cssSrcDir
            "#{libDir}/css"
            "node_modules"
          ]
          compress: minify
          yuicompress: minify
          modifyVars:
            "lib-dir": "\"#{libDir}\""
        files: createObject(
          [ "#{distDir}/temp/html/main.noembed.css", "#{libDir}/css/html/main.less" ]
          [ "#{distDir}/temp/epub/main.noembed.css", "#{libDir}/css/epub/main.less" ]
        )

    cssUrlEmbed:
      main:
        options:
          baseDir: "."
        files: createObject(
          [ "#{distDir}/temp/html/main.css", "#{distDir}/temp/html/main.noembed.css" ]
          [ "#{distDir}/temp/epub/main.css", "#{distDir}/temp/epub/main.noembed.css" ]
        )

    browserify:
      main:
        src:  "#{libDir}/js/main.coffee"
        dest: "#{distDir}/temp/main.js"
        cwd:  "."
        options:
          watch: false
          transform: if minify
            [ 'coffeeify', [ 'uglifyify', { global: true } ] ]
          else
            [ 'coffeeify' ]
          browserifyOptions:
            debug: false
            extensions: [ '.coffee' ]

    watchImpl:
      options:
        livereload: true
      css:
        files: [
          "#{libDir}/css/**/*"
          "#{cssSrcDir}/**/*"
        ]
        tasks: [
          "less"
          "cssUrlEmbed"
          "pandoc:html"
        ]
      js:
        files: [
          "#{libDir}/js/**/*"
          "#{jsSrcDir}/**/*"
        ]
        tasks: [
          "browserify"
          "pandoc:html"
        ]
      templates:
        files: [
          "#{libDir}/templates/**/*"
          "#{tplSrcDir}/**/*"
        ]
        tasks: [
          "pandoc:html"
          # "pandoc:pdf"
          # "pandoc:epub"
        ]
      pages:
        files: [
          "#{pageSrcDir}/**/*"
        ]
        tasks: [
          "pandoc:html"
          # "pandoc:pdf"
          # "pandoc:epub"
        ]
      metadata:
        files: [
          "#{metaSrcDir}/**/*"
        ]
        tasks: [
          "pandoc:html"
          # "pandoc:pdf"
          # "pandoc:epub"
        ]

    connect:
      server:
        options:
          port: 4000
          base: 'dist'

  grunt.renameTask "watch", "watchImpl"

  grunt.registerTask "pandoc", "Run pandoc", (target, preview = false) ->
    target ?= "html"

    crossrefFilter = if meta.usePandocCrossref then "--filter=pandoc-crossref" else ""

    switch target
      when "pdf"
        output    = "--output=#{distDir}/#{meta.filenameStem}.pdf"
        template  = "--template=#{tplSrcDir}/template.tex"
        variables = joinLines """
                      --variable=lib-dir:#{libDir}
                    """
        filters   = joinLines """
                      #{crossrefFilter}
                      --filter=#{libDir}/filters/pdf/merge-code.coffee
                      --filter=#{libDir}/filters/pdf/callout.coffee
                      --filter=#{libDir}/filters/pdf/columns.coffee
                      --filter=#{libDir}/filters/pdf/solutions.coffee
                      --filter=#{libDir}/filters/pdf/vector-images.coffee
                      --filter=#{libDir}/filters/pdf/listings.coffee
                    """
        extras    = joinLines """
                      --toc-depth=#{meta.tocDepth ? 2}
                      --include-before-body=#{tplSrcDir}/cover-notes.tex
                    """
        metadata  = "#{metaSrcDir}/pdf.yaml"

      when "pdfpreview"
        output    = "--output=#{distDir}/#{meta.filenameStem}.pdf"
        template  = "--template=#{tplSrcDir}/template.tex"
        variables = joinLines """
                      --variable=lib-dir:#{libDir}
                    """
        filters   = joinLines """
                      #{crossrefFilter}
                      --filter=#{libDir}/filters/pdf/merge-code.coffee
                      --filter=#{libDir}/filters/pdf/callout.coffee
                      --filter=#{libDir}/filters/pdf/columns.coffee
                      --filter=#{libDir}/filters/pdf/solutions.coffee
                      --filter=#{libDir}/filters/pdf/vector-images.coffee
                      --filter=#{libDir}/filters/pdf/listings.coffee
                    """
        extras    = joinLines """
                      --toc-depth=#{meta.tocDepth ? 2}
                      --include-before-body=#{tplSrcDir}/cover-notes.tex
                    """
        metadata  = "#{metaSrcDir}/pdf.yaml"

      when "html"
        output    = "--output=#{distDir}/#{meta.filenameStem}.html"
        template  = "--template=#{tplSrcDir}/template.html"
        variables = joinLines """
                      --variable=lib-dir:#{libDir}
                    """
        filters   = joinLines """
                      #{crossrefFilter}
                      --filter=#{libDir}/filters/html/merge-code.coffee
                      --filter=#{libDir}/filters/html/tables.coffee
                      --filter=#{libDir}/filters/html/solutions.coffee
                      --filter=#{libDir}/filters/html/vector-images.coffee
                    """
        extras    = joinLines """
                      --toc-depth=#{meta.tocDepth ? 2}
                      --include-before-body=#{tplSrcDir}/cover-notes.html
                    """
        metadata  = "#{metaSrcDir}/html.yaml"

      when "epub"
        output    = "--output=#{distDir}/#{meta.filenameStem}.epub"
        template  = "--template=#{libDir}/templates/template.epub.html"
        variables = joinLines """
                      --variable=lib-dir:#{libDir}
                    """
        filters   = joinLines """
                      #{crossrefFilter}
                      --filter=#{libDir}/filters/epub/merge-code.coffee
                      --filter=#{libDir}/filters/epub/solutions.coffee
                      --filter=#{libDir}/filters/epub/vector-images.coffee
                    """
        extras    = joinLines """
                      --toc-depth=#{meta.tocDepth ? 2}
                      --epub-stylesheet=#{distDir}/temp/epub/main.css
                      --epub-cover-image=#{coverSrcDir}/epub-cover.png
                      --include-before-body=#{tplSrcDir}/cover-notes.html
                    """
        metadata  = "#{metaSrcDir}/epub.yaml"

      when "json"
        output    = "--output=#{distDir}/#{meta.filenameStem}.json"
        template  = ""
        variables = joinLines """
                      --variable=lib-dir:#{libDir}
                    """
        filters   = joinLines """
                      #{crossrefFilter}
                      --filter=#{libDir}/filters/pdf/merge-code.coffee
                      --filter=#{libDir}/filters/pdf/callout.coffee
                      --filter=#{libDir}/filters/pdf/columns.coffee
                      --filter=#{libDir}/filters/pdf/solutions.coffee
                      --filter=#{libDir}/filters/pdf/vector-images.coffee
                      --filter=#{libDir}/filters/pdf/listings.coffee
                    """
        extras    = ""
        metadata  = ""

      else
        grunt.log.error("Bad pandoc format: #{target}")

    if preview
      if meta.previewPages
        output    = output.replace(/([.][a-z]+)$/i, "-preview$1")
        variables = "#{variables} --metadata=title:'Preview: #{meta.title}'"
        pages     = meta.previewPages.map((page) -> "#{pageSrcDir}/#{page}").join(" ")
      else
        return
    else
      pages     = meta.pages.map((page) -> "#{pageSrcDir}/#{page}").join(" ")

    command = joinLines """
      pandoc
      --smart
      #{output}
      #{template}
      --from=markdown+grid_tables+multiline_tables+fenced_code_blocks+fenced_code_attributes+yaml_metadata_block+implicit_figures+header_attributes+definition_lists+link_attributes
      --latex-engine=xelatex
      #{variables}
      #{filters}
      --chapters
      --number-sections
      --table-of-contents
      --highlight-style tango
      --standalone
      --self-contained
      #{extras}
      #{metaSrcDir}/metadata.yaml
      #{metadata}
      #{pages}
    """

    runCommand(command, this.async())

  grunt.registerTask "exercises", "Download and build exercises", (target) ->
    unless meta.exercises?.repo then return

    repo = meta.exercises.repo
    name = meta.exercises.name ? "#{meta.filenameStem}-code"

    command = joinLines """
      rm -rf #{name} &&
      git clone #{repo} &&
      zip -r #{name}.zip #{name}
    """

    runCommand(command, this.async(), { cwd: 'dist' })

  grunt.registerTask "json", [
    "pandoc:json"
  ]

  grunt.registerTask "html", [
    "less"
    "cssUrlEmbed"
    "browserify"
    "pandoc:html"
  ]

  grunt.registerTask "pdf", [
    "pandoc:pdf"
  ]

  grunt.registerTask "epub", [
    "less"
    "cssUrlEmbed"
    "pandoc:epub"
  ]

  grunt.registerTask "all", [
    "less"
    "cssUrlEmbed"
    "browserify"
    "pandoc:html"
    "pandoc:pdf"
    "pandoc:epub"
    "pandoc:html:preview"
    "pandoc:pdf:preview"
    "pandoc:epub:preview"
  ]

  grunt.registerTask "watch", [
    "html"
    "connect:server"
    "watchImpl"
  ]

  grunt.registerTask "default", [
    "all"
    "exercises"
  ]
