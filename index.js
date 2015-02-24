"use strict";
var fs, path, process, yaml,
  __slice = [].slice;

path = require('path');

process = require('child_process');

yaml = require('js-yaml');

fs = require('fs');

module.exports = function(grunt, options) {
  var createObject, distDir, joinLines, libDir, meta, minify, runCommand, srcDir, _ref, _ref1, _ref2, _ref3;
  if (options == null) {
    options = {};
  }
  minify = (_ref = grunt.option('minify')) != null ? _ref : false;
  libDir = (_ref1 = options.lib) != null ? _ref1 : "node_modules/underscore-ebook-template/lib";
  srcDir = (_ref2 = options.src) != null ? _ref2 : "src";
  distDir = (_ref3 = options.dist) != null ? _ref3 : "dist";
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-css-url-embed");
  joinLines = function(lines) {
    return lines.split(/[ \r\n]+/).join(" ");
  };
  createObject = function() {
    var ans, key, pairs, value, _i, _len, _ref4;
    pairs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    ans = {};
    for (_i = 0, _len = pairs.length; _i < _len; _i++) {
      _ref4 = pairs[_i], key = _ref4[0], value = _ref4[1];
      ans[key] = value;
    }
    return ans;
  };
  runCommand = function(command, done, options) {
    var proc;
    if (options == null) {
      options = {};
    }
    grunt.log.write("Running shell command: " + command + "\n");
    proc = process.exec(command, options);
    proc.stdout.on('data', function(d) {
      return grunt.log.write(d);
    });
    proc.stderr.on('data', function(d) {
      return grunt.log.error(d);
    });
    proc.on('error', function(err) {
      grunt.log.error("Shell command failed with: " + err);
      return done(false);
    });
    proc.on('exit', function(code) {
      if (code === 0) {
        grunt.log.write("Shell command exited with code 0");
        return done();
      } else {
        grunt.log.error("Shell command exited with code " + code);
        return done(false);
      }
    });
  };
  meta = yaml.safeLoad(fs.readFileSync("./" + srcDir + "/meta/metadata.yaml", 'utf8'));
  if (typeof meta.filenameStem !== "string") {
    grunt.fail.fatal("'filename' in metadata must be a string");
  }
  if (!(!meta.exercisesRepo || typeof meta.exercisesRepo === "string")) {
    grunt.fail.fatal("'exercisesRepo' in metadata must be a string or null");
  }
  if (!Array.isArray(meta.pages)) {
    grunt.fail.fatal("'pages' in metadata must be an array of strings");
  }
  grunt.initConfig({
    clean: {
      main: {
        src: "dist"
      }
    },
    less: {
      main: {
        options: {
          paths: ["" + srcDir + "/css", "" + libDir + "/css", "node_modules"],
          compress: minify,
          yuicompress: minify,
          modifyVars: {
            "lib-dir": "\"" + libDir + "\""
          }
        },
        files: createObject(["" + distDir + "/temp/html/main.noembed.css", "" + libDir + "/css/html/main.less"], ["" + distDir + "/temp/epub/main.noembed.css", "" + libDir + "/css/epub/main.less"])
      }
    },
    cssUrlEmbed: {
      main: {
        options: {
          baseDir: "."
        },
        files: createObject(["" + distDir + "/temp/html/main.css", "" + distDir + "/temp/html/main.noembed.css"], ["" + distDir + "/temp/epub/main.css", "" + distDir + "/temp/epub/main.noembed.css"])
      }
    },
    browserify: {
      main: {
        src: "" + libDir + "/js/main.coffee",
        dest: "" + distDir + "/temp/main.js",
        cwd: ".",
        options: {
          watch: false,
          transform: minify ? [
            'coffeeify', [
              'uglifyify', {
                global: true
              }
            ]
          ] : ['coffeeify'],
          browserifyOptions: {
            debug: false,
            extensions: ['.coffee']
          }
        }
      }
    },
    watchImpl: {
      options: {
        livereload: true
      },
      css: {
        files: ["" + libDir + "/css/**/*", "" + srcDir + "/css/**/*"],
        tasks: ["less", "cssUrlEmbed", "pandoc:html"]
      },
      js: {
        files: ["" + libDir + "/js/**/*", "" + srcDir + "/js/**/*"],
        tasks: ["browserify", "pandoc:html"]
      },
      templates: {
        files: ["" + libDir + "/templates/**/*", "" + srcDir + "/templates/**/*"],
        tasks: ["pandoc:html"]
      },
      pages: {
        files: ["" + srcDir + "/pages/**/*"],
        tasks: ["pandoc:html"]
      },
      metadata: {
        files: ["" + srcDir + "/meta/**/*"],
        tasks: ["pandoc:html"]
      }
    },
    connect: {
      server: {
        options: {
          port: 4000,
          base: 'dist'
        }
      }
    }
  });
  grunt.renameTask("watch", "watchImpl");
  grunt.registerTask("pandoc", "Run pandoc", function(target) {
    var command, extras, filters, metadata, output, template, variables;
    if (target == null) {
      target = "html";
    }
    switch (target) {
      case "pdf":
        output = "--output=" + distDir + "/" + meta.filenameStem + ".pdf";
        template = "--template=" + libDir + "/templates/template.tex";
        variables = joinLines("--variable=lib-dir:" + libDir);
        filters = joinLines("--filter=" + libDir + "/filters/pdf/callout.coffee\n--filter=" + libDir + "/filters/pdf/columns.coffee\n--filter=" + libDir + "/filters/pdf/solutions.coffee\n--filter=" + libDir + "/filters/pdf/vector-images.coffee");
        extras = joinLines("--include-before-body=" + libDir + "/templates/cover-notes.tex");
        metadata = "" + srcDir + "/meta/pdf.yaml";
        break;
      case "html":
        output = "--output=" + distDir + "/" + meta.filenameStem + ".html";
        template = "--template=" + libDir + "/templates/template.html";
        variables = joinLines("--variable=lib-dir:" + libDir);
        filters = joinLines("--filter=" + libDir + "/filters/html/tables.coffee\n--filter=" + libDir + "/filters/html/solutions.coffee\n--filter=" + libDir + "/filters/html/vector-images.coffee");
        extras = joinLines("--toc-depth=2\n--include-before-body=" + libDir + "/templates/cover-notes.html");
        metadata = "" + srcDir + "/meta/html.yaml";
        break;
      case "epub":
        output = "--output=" + distDir + "/" + meta.filenameStem + ".epub";
        template = "--template=" + libDir + "/templates/template.epub.html";
        variables = joinLines("--variable=lib-dir:" + libDir);
        filters = joinLines("--filter=" + libDir + "/filters/epub/solutions.coffee\n--filter=" + libDir + "/filters/epub/vector-images.coffee");
        extras = joinLines("--epub-stylesheet=" + distDir + "/temp/epub/main.css\n--epub-cover-image=" + srcDir + "/covers/epub-cover.png\n--include-before-body=" + libDir + "/templates/cover-notes.html");
        metadata = "" + srcDir + "/meta/epub.yaml";
        break;
      case "json":
        output = "--output=" + distDir + "/" + meta.filenameStem + ".json";
        template = "";
        variables = joinLines("--variable=lib-dir:" + libDir);
        filters = joinLines("--filter=" + libDir + "/filters/pdf/callout.coffee\n--filter=" + libDir + "/filters/pdf/columns.coffee\n--filter=" + libDir + "/filters/pdf/solutions.coffee");
        extras = "";
        metadata = "";
        break;
      default:
        grunt.log.error("Bad pandoc format: " + target);
    }
    command = joinLines("pandoc\n--smart\n" + output + "\n" + template + "\n--from=markdown+grid_tables+multiline_tables+fenced_code_blocks+fenced_code_attributes+yaml_metadata_block+implicit_figures+header_attributes+definition_lists\n--latex-engine=xelatex\n" + variables + "\n" + filters + "\n--chapters\n--number-sections\n--table-of-contents\n--highlight-style tango\n--standalone\n--self-contained\n" + extras + "\n" + srcDir + "/meta/metadata.yaml\n" + metadata + "\n" + (meta.pages.join(" ")));
    return runCommand(command, this.async());
  });
  grunt.registerTask("exercises", "Download and build exercises", function(target) {
    var command;
    if (!meta.exercisesRepo) {
      return;
    }
    command = joinLines("rm -rf " + meta.filenameStem + "-code &&\ngit clone " + meta.exercisesRepo + " &&\nzip -r " + meta.filenameStem + "-code.zip " + meta.filenameStem + "-code");
    return runCommand(command, this.async(), {
      cwd: 'dist'
    });
  });
  grunt.registerTask("json", ["pandoc:json"]);
  grunt.registerTask("html", ["less", "cssUrlEmbed", "browserify", "pandoc:html"]);
  grunt.registerTask("pdf", ["pandoc:pdf"]);
  grunt.registerTask("epub", ["less", "cssUrlEmbed", "pandoc:epub"]);
  grunt.registerTask("all", ["less", "cssUrlEmbed", "browserify", "pandoc:html", "pandoc:pdf", "pandoc:epub"]);
  grunt.registerTask("watch", ["html", "connect:server", "watchImpl"]);
  return grunt.registerTask("default", ["all", "exercises"]);
};
