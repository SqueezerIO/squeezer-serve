'use strict';

class ServePlugin {
  constructor(sqz) {
    this.sqz = sqz;

    this.commands = [
      {
        arg         : ['serve'],
        summary     : 'Serve project in watch mode . Live reload is enabled by default.',
        description : '',
        lifecycle   : [
          'project:validate',
          'functions:load',
          'project:info',
          'compile:run',
          'serve:run'
        ],
        options     : {
          stage : {
            title        : 'environment stage',
            description  : null,
            value        : true,
            required     : false,
            defaultValue : 'local'
          }
        },
        examples    : [
          ''
        ]
      }
    ];
  }
}

module.exports = ServePlugin;
