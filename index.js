"use strict";
var fs, path, process, yaml,
  __slice = [].slice;

path = require('path');

process = require('child_process');

yaml = require('js-yaml');

fs = require('fs');

module.exports = function(grunt, options) {
  var coverSrcDir, createObject, cssSrcDir, distDir, joinLines, jsSrcDir, libDir, meta, metaSrcDir, minify, pageSrcDir, runCommand, srcDir, tplSrcDir, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref18, _ref19, _ref2, _ref20, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
  if (options == null) {
    options = {};
  }
  minify = (_ref = grunt.option('minify')) != null ? _ref : false;
  libDir = (_ref1 = (_ref2 = options.dir) != null ? _ref2.lib : void 0) != null ? _ref1 : "node_modules/underscore-ebook-template/lib";
  srcDir = (_ref3 = (_ref4 = options.dir) != null ? _ref4.src : void 0) != null ? _ref3 : "src";
  distDir = (_ref5 = (_ref6 = options.dir) != null ? _ref6.dist : void 0) != null ? _ref5 : "dist";
  metaSrcDir = (_ref7 = (_ref8 = options.dir) != null ? _ref8.meta : void 0) != null ? _ref7 : "" + srcDir + "/meta";
  pageSrcDir = (_ref9 = (_ref10 = options.dir) != null ? _ref10.page : void 0) != null ? _ref9 : "" + srcDir + "/pages";
  cssSrcDir = (_ref11 = (_ref12 = options.dir) != null ? _ref12.css : void 0) != null ? _ref11 : "" + srcDir + "/css";
  jsSrcDir = (_ref13 = (_ref14 = options.dir) != null ? _ref14.js : void 0) != null ? _ref13 : "" + srcDir + "/js";
  coverSrcDir = (_ref15 = (_ref16 = options.dir) != null ? _ref16.cover : void 0) != null ? _ref15 : "" + srcDir + "/covers";
  tplSrcDir = (_ref17 = (_ref18 = options.dir) != null ? _ref18.template : void 0) != null ? _ref17 : "" + libDir + "/templates";
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
    var ans, key, pairs, value, _i, _len, _ref19;
    pairs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    ans = {};
    for (_i = 0, _len = pairs.length; _i < _len; _i++) {
      _ref19 = pairs[_i], key = _ref19[0], value = _ref19[1];
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
  meta = yaml.safeLoad(fs.readFileSync("./" + metaSrcDir + "/metadata.yaml", 'utf8'));
  if (typeof meta.filenameStem !== "string") {
    grunt.fail.fatal("'filename' in metadata must be a string");
  }
  if (meta.exercises) {
    if (typeof ((_ref19 = meta.exercises) != null ? _ref19.repo : void 0) !== "string") {
      grunt.fail.fatal("'exercises.repo' in metadata must be a string");
    }
    if (typeof ((_ref20 = meta.exercises) != null ? _ref20.name : void 0) !== "string") {
      grunt.fail.fatal("'exercises.name' in metadata must be a string");
    }
  } else if (meta.exercisesRepo) {
    grunt.fail.fatal("Metadata key 'exercisesRepo: string' is deprecated.\nReplace with 'exercises: { repo: string, name: string }'");
  }
  if (!Array.isArray(meta.pages)) {
    grunt.fail.fatal("'pages' in metadata must be an array of strings");
  }
  if (!meta.copyright) {
    grunt.fail.fatal("'copyright' in metadata must be a string such as '2015' or '2014-2015'");
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
          paths: [cssSrcDir, "" + libDir + "/css", "node_modules"],
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
        files: ["" + libDir + "/css/**/*", "" + cssSrcDir + "/**/*"],
        tasks: ["less", "cssUrlEmbed", "pandoc:html"]
      },
      js: {
        files: ["" + libDir + "/js/**/*", "" + jsSrcDir + "/**/*"],
        tasks: ["browserify", "pandoc:html"]
      },
      templates: {
        files: ["" + libDir + "/templates/**/*", "" + tplSrcDir + "/**/*"],
        tasks: ["pandoc:html"]
      },
      pages: {
        files: ["" + pageSrcDir + "/**/*"],
        tasks: ["pandoc:html"]
      },
      metadata: {
        files: ["" + metaSrcDir + "/**/*"],
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
  grunt.registerTask("pandoc", "Run pandoc", function(target, preview) {
    var command, crossrefFilter, extras, filters, metadata, output, pages, template, variables, _ref21, _ref22, _ref23, _ref24;
    if (preview == null) {
      preview = false;
    }
    if (target == null) {
      target = "html";
    }
    crossrefFilter = meta.usePandocCrossref ? "--filter=pandoc-crossref" : "";
    switch (target) {
      case "pdf":
        output = "--output=" + distDir + "/" + meta.filenameStem + ".pdf";
        template = "--template=" + tplSrcDir + "/template.tex";
        variables = joinLines("--variable=lib-dir:" + libDir);
        filters = joinLines("" + crossrefFilter + "\n--filter=" + libDir + "/filters/pdf/unwrap-code.coffee\n--filter=" + libDir + "/filters/pdf/merge-code.coffee\n--filter=" + libDir + "/filters/pdf/callout.coffee\n--filter=" + libDir + "/filters/pdf/columns.coffee\n--filter=" + libDir + "/filters/pdf/solutions.coffee\n--filter=" + libDir + "/filters/pdf/vector-images.coffee\n--filter=" + libDir + "/filters/pdf/listings.coffee");
        extras = joinLines("--toc-depth=" + ((_ref21 = meta.tocDepth) != null ? _ref21 : 2) + "\n--include-before-body=" + tplSrcDir + "/cover-notes.tex");
        metadata = "" + metaSrcDir + "/pdf.yaml";
        break;
      case "pdfpreview":
        output = "--output=" + distDir + "/" + meta.filenameStem + ".pdf";
        template = "--template=" + tplSrcDir + "/template.tex";
        variables = joinLines("--variable=lib-dir:" + libDir);
        filters = joinLines("" + crossrefFilter + "\n--filter=" + libDir + "/filters/pdf/unwrap-code.coffee\n--filter=" + libDir + "/filters/pdf/merge-code.coffee\n--filter=" + libDir + "/filters/pdf/callout.coffee\n--filter=" + libDir + "/filters/pdf/columns.coffee\n--filter=" + libDir + "/filters/pdf/solutions.coffee\n--filter=" + libDir + "/filters/pdf/vector-images.coffee\n--filter=" + libDir + "/filters/pdf/listings.coffee");
        extras = joinLines("--toc-depth=" + ((_ref22 = meta.tocDepth) != null ? _ref22 : 2) + "\n--include-before-body=" + tplSrcDir + "/cover-notes.tex");
        metadata = "" + metaSrcDir + "/pdf.yaml";
        break;
      case "html":
        output = "--output=" + distDir + "/" + meta.filenameStem + ".html";
        template = "--template=" + tplSrcDir + "/template.html";
        variables = joinLines("--variable=lib-dir:" + libDir);
        filters = joinLines("" + crossrefFilter + "\n--filter=" + libDir + "/filters/html/unwrap-code.coffee\n--filter=" + libDir + "/filters/html/merge-code.coffee\n--filter=" + libDir + "/filters/html/tables.coffee\n--filter=" + libDir + "/filters/html/solutions.coffee\n--filter=" + libDir + "/filters/html/vector-images.coffee");
        extras = joinLines("--toc-depth=" + ((_ref23 = meta.tocDepth) != null ? _ref23 : 2) + "\n--include-before-body=" + tplSrcDir + "/cover-notes.html");
        metadata = "" + metaSrcDir + "/html.yaml";
        break;
      case "epub":
        output = "--output=" + distDir + "/" + meta.filenameStem + ".epub";
        template = "--template=" + libDir + "/templates/template.epub.html";
        variables = joinLines("--variable=lib-dir:" + libDir);
        filters = joinLines("" + crossrefFilter + "\n--filter=" + libDir + "/filters/epub/unwrap-code.coffee\n--filter=" + libDir + "/filters/epub/merge-code.coffee\n--filter=" + libDir + "/filters/epub/solutions.coffee\n--filter=" + libDir + "/filters/epub/vector-images.coffee");
        extras = joinLines("--toc-depth=" + ((_ref24 = meta.tocDepth) != null ? _ref24 : 2) + "\n--epub-stylesheet=" + distDir + "/temp/epub/main.css\n--epub-cover-image=" + coverSrcDir + "/epub-cover.png\n--include-before-body=" + tplSrcDir + "/cover-notes.html");
        metadata = "" + metaSrcDir + "/epub.yaml";
        break;
      case "json":
        output = "--output=" + distDir + "/" + meta.filenameStem + ".json";
        template = "";
        variables = joinLines("--variable=lib-dir:" + libDir);
        filters = joinLines("" + crossrefFilter + "\n--filter=" + libDir + "/filters/pdf/unwrap-code.coffee\n--filter=" + libDir + "/filters/pdf/merge-code.coffee\n--filter=" + libDir + "/filters/pdf/callout.coffee\n--filter=" + libDir + "/filters/pdf/columns.coffee\n--filter=" + libDir + "/filters/pdf/solutions.coffee\n--filter=" + libDir + "/filters/pdf/vector-images.coffee\n--filter=" + libDir + "/filters/pdf/listings.coffee");
        extras = "";
        metadata = "";
        break;
      default:
        grunt.log.error("Bad pandoc format: " + target);
    }
    if (preview) {
      if (meta.previewPages) {
        output = output.replace(/([.][a-z]+)$/i, "-preview$1");
        variables = "" + variables + " --metadata=title:'Preview: " + meta.title + "'";
        pages = meta.previewPages.map(function(page) {
          return "" + pageSrcDir + "/" + page;
        }).join(" ");
      } else {
        return;
      }
    } else {
      pages = meta.pages.map(function(page) {
        return "" + pageSrcDir + "/" + page;
      }).join(" ");
    }
    command = joinLines("pandoc\n--smart\n" + output + "\n" + template + "\n--from=markdown+grid_tables+multiline_tables+fenced_code_blocks+fenced_code_attributes+yaml_metadata_block+implicit_figures+header_attributes+definition_lists+link_attributes\n--latex-engine=xelatex\n" + variables + "\n" + filters + "\n--chapters\n--number-sections\n--table-of-contents\n--highlight-style tango\n--standalone\n--self-contained\n" + extras + "\n" + metaSrcDir + "/metadata.yaml\n" + metadata + "\n" + pages);
    return runCommand(command, this.async());
  });
  grunt.registerTask("exercises", "Download and build exercises", function(target) {
    var command, name, repo, _ref21, _ref22;
    if (!((_ref21 = meta.exercises) != null ? _ref21.repo : void 0)) {
      return;
    }
    repo = meta.exercises.repo;
    name = (_ref22 = meta.exercises.name) != null ? _ref22 : "" + meta.filenameStem + "-code";
    command = joinLines("rm -rf " + name + " &&\ngit clone " + repo + " &&\nzip -r " + name + ".zip " + name);
    return runCommand(command, this.async(), {
      cwd: 'dist'
    });
  });
  grunt.registerTask("json", ["pandoc:json"]);
  grunt.registerTask("html", ["less", "cssUrlEmbed", "browserify", "pandoc:html"]);
  grunt.registerTask("pdf", ["pandoc:pdf"]);
  grunt.registerTask("epub", ["less", "cssUrlEmbed", "pandoc:epub"]);
  grunt.registerTask("all", ["less", "cssUrlEmbed", "browserify", "pandoc:html", "pandoc:pdf", "pandoc:epub", "pandoc:html:preview", "pandoc:pdf:preview", "pandoc:epub:preview"]);
  grunt.registerTask("watch", ["html", "connect:server", "watchImpl"]);
  return grunt.registerTask("default", ["all", "exercises"]);
};
