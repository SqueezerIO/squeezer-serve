'use strict';

const _                 = require('lodash');
const fs                = require('fs');
const colors            = require('colors');
const express           = require('express');
const bodyParser        = require('body-parser');
const UrlPattern        = require('url-pattern');
const Watcher           = require('./watcher');
const Livereload        = require('./livereload');

/**
 * Class that serves a Squeezer project
 */
class Express {
  constructor(sqz) {
    this.sqz = sqz;
  }

  /**
   * Start the Node Express server
   */
  run() {
    return new Promise((resolve) => {
      const app         = express();
      const projectType = this.sqz.vars.project.type;
      const projectPath = this.sqz.vars.project.path;
      const project     = this.sqz.vars.project;
      let port          = 4001;

      app.use((req, res, next) => {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, '
          + 'max-stale=0, post-check=0, pre-check=0');
        req.rawBody = '';

        req.setEncoding('utf8');

        req.on('data', (chunk) => {
          req.rawBody += chunk;
        });

        req.on('end', () => {
          next();
        });
      });

      app.use(bodyParser.raw());

      if (projectType === 'web') {
        const livereload = new Livereload(this.sqz);
        livereload.init(app);
      }

      const watcher = new Watcher(this.sqz);
      watcher.init();

      app.use('/.build', express.static(`${project.buildPath}`, { fallthrough : false, maxAge : 0 }));

      app.all('*', (req, res) => {
        // const data = this.find(req.url, req.method);
        this.find(req.url, req.method).then((data) => {
          if (!data) {
            res.status(400).send({
              error : 'Invalid URL path : There is no any event function configured with this url path'
            });
          } else {
            const target = `${projectPath}/.build/development/microservices/${data.microservice.identifier}`;

            if (!fs.existsSync(target)) {
              this.sqz.cli.log.error(`Microservice ${colors.blue.bold(data.microservice.name)} is not compiled !`);
            }

            // callback.call(req, res, data);
            process.emit('serveEvent', {
              req  : req,
              res  : res,
              data : data
            });
          }
        });
      });

      const httpServer = () => {
        app.listen(port, () => {
          const appHost        = `localhost:${port}`;
          const appUrl         = `http://localhost:${port}`;
          process.env.APP_HOST = appHost;
          process.env.APP_URL  = appUrl;
          this.sqz.cli.log.info(`Listening on       ${colors.blue.bold(appUrl)}`);
          resolve();
        }).on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            port += 1;
            httpServer();
          }
        });
      };

      httpServer();
    });
  }

  /**
   * Find a function's HTTP event that matches to the current requested URL
   *
   * @param url - http request url
   * @param method - http method
   */
  find(url, method) {
    return new Promise((resolve) => {
      this.sqz.lifecycle.run(['microservices:load']).then(() => {
        let data = null;

        _.forEach(this.sqz.vars.microservices, (microservice) => {
          _.forEach(microservice.functions, (func, name) => {
            func.name = name;
            _.forEach(func.events, (val) => {
              const type  = Object.keys(val)[0];
              const event = val[type];

              if (type === 'http') {
                const expressPathFormatted = `${event.path.replace(/{(.*?)}/g, ':$1')}`;
                const pattern              = new UrlPattern(expressPathFormatted);
                const patternMatch         = pattern.match(url.split('?')[0]);
                if (patternMatch && event.method.toUpperCase() === method) {
                  data = {
                    microservice   : microservice,
                    func           : func,
                    event          : event,
                    pathParameters : patternMatch
                  };
                }
              }
            });
          });
        });

        resolve(data);
      });
    });
  }
}

module.exports = Express;
