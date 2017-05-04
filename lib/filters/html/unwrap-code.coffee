#!/usr/bin/env coffee

unwrap = require '../common/unwrap-code'
pandoc = require 'pandoc-filter'

pandoc.stdio(unwrap.createFilter())
