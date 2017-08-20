# squeezer-serve
Squeezer Serve Plugin . This plugin enables serving support for local development within the Squeezer Framework.

[![Build Status](https://travis-ci.org/SqueezerIO/squeezer-serve.svg?branch=master)](https://travis-ci.org/SqueezerIO/squeezer-serve)
[![npm version](https://badge.fury.io/js/squeezer-serve.svg)](https://badge.fury.io/js/squeezer-serve)
[![npm version](https://badge.fury.io/js/squeezer-aws.svg)](https://badge.fury.io/js/squeezer-aws)
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

```javascript
process.on('serveEvent', (event) => {
  // event.req - express request hook
  // event.res - express response hook
  // event.data - called function data
});
```
