# squeezer-serve
Squeezer Serve Plugin . This plugin enables serving support for local development within the Squeezer Framework.

[![Squeezer.IO](https://cdn.rawgit.com/SqueezerIO/squeezer/9a010c35/docs/gitbook/images/badge.svg)](https://Squeezer.IO)
[![Build Status](https://travis-ci.org/SqueezerIO/squeezer-serve.svg?branch=master)](https://travis-ci.org/SqueezerIO/squeezer-serve)
[![npm version](https://badge.fury.io/js/squeezer-serve.svg)](https://badge.fury.io/js/squeezer-serve)
[![DUB](https://img.shields.io/dub/l/vibe-d.svg)]()


### Installation

`cd PROJECT_DIR`

`npm i squeezer-serve --save`

### Activate the plugin

*PROJECT_DIR/squeezer.yml*

```yaml
plugins:
  - name: squeezer-serve
    path: node_modules
```