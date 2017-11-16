'use strict';

const _ = require('lodash');
const chokidar = require('chokidar');
const Promise = require('bluebird');
const path = require('path');

/**
 * Class that serves a Squeezer project
 */
class Watcher {
  constructor(sqz) {
    this.sqz = sqz;
    this.projectType = this.sqz.vars.project.type;
    this.projectPath = this.sqz.vars.project.path;
    this.globs = this.sqz.yaml.parse(`${this.projectPath}/watcher.yml`, { projectPath: this.projectPath }).globs;
  }

  /**
   * initialize the file watcher
   */
  init() {
    const globs = _.union(this.globs.include, this.globs.ignore.map(val => `!${val}`));
    const watcher = chokidar.watch(globs, { persistent: true });
    // let watcherReady = false;

    watcher
      .on('error', error => this.sqz.cli.log.error(error))
      .on('change', () => {
        this.compile();
      });
  }

  compile() {
    const projectVars = this.sqz.yaml.parse(path.join(this.projectPath, 'squeezer.yml'));

    _.assign(this.sqz.vars.project, projectVars);

    const lifecycle = [
      'functions:load',
      'compile:run'
    ];

    return new Promise((resolve) => {
      this.sqz.lifecycle.run(lifecycle).then(() => {
        resolve();
      });
    });
  }
}

module.exports = Watcher;
