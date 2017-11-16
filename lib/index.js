'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const express = require('express');
const bodyParser = require('body-parser');
const UrlPattern = require('url-pattern');
const cors = require('cors');
const Watcher = require('./watcher');
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
      const app = express();
      const projectPath = this.sqz.vars.project.path;
      const project = this.sqz.vars.project;
      let port = 4001;

      process.env.noExit = 1;

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

      const livereload = new Livereload(this.sqz);
      if (fs.existsSync(path.join(projectPath, 'livereload.yml'))) {
        livereload.init(app);
      }

      const watcher = new Watcher(this.sqz);
      watcher.init();

      app.use('/.build', express.static(`${project.buildPath}`, { fallthrough: false, maxAge: 0 }));

      app.all('*', cors(), (req, res) => {
        // if (req.method === 'OPTIONS') {
        //   res.status(200).send()
        // } else {
        this.find(req.url, req.method).then((data) => {
          if (!data) {
            res.status(400).send({
              error: 'Invalid URL path : There is no any event function configured for this url path'
            });
          } else {
            const target = `${projectPath}/.build/development/functions/${data.func.identifier}`;

            if (!fs.existsSync(target)) {
              this.sqz.cli.log.error(`Function ${colors.blue.bold(data.func.name)} is not compiled !`);
            }

            const responseFile = `${this.sqz.vars.project.buildPath}/development/response.json`;
            const eventInputFile = `${data.func.path}/event.input.json`;
            const runCmd = this.sqz.yaml.parse(`${projectPath}/lib/hooks/commands/run/execute.function.yml`, {
              projectPath: projectPath,
              target: target,
              eventInputFile: eventInputFile
            })[0];

            const eventData = {
              headers: req.headers,
              method: req.method,
              path: req.path,
              params: data.pathParameters,
              query: req.query,
              clientIpAddress: req.connection.remoteAddress,
              url: req.url,
              body: req.rawBody
            };

            fs.writeFileSync(eventInputFile, JSON.stringify(eventData, null, 2), 'utf8');

            this.sqz.command.run(runCmd.description, runCmd.bin, runCmd.args).then((code) => {
              if (code === 0) {
                const parsedRes = JSON.parse(fs.readFileSync(responseFile, 'utf8'));
                _.forEach(parsedRes.headers, (val, key) => {
                  res.setHeader(key, val);
                });
                res.status(parsedRes.statusCode).send(parsedRes.body);
              } else {
                res.status(200).send(`
                  <html>
                    <body>
                    <h1>ERROR</h1>
                    </body>
                  </html>
                `);
              }
            });
          }
        });
      // }
      });

      const httpServer = () => {
        app.listen(port, () => {
          const appHost = `localhost:${port}`;
          const appUrl = `http://localhost:${port}`;
          process.env.APP_HOST = appHost;
          process.env.APP_URL = appUrl;
          this.sqz.cli.log.info(`Listening on "${colors.blue.bold(appUrl)}"`);
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
      this.sqz.vars.functions = {};
      this.sqz.lifecycle.run(['functions:load']).then(() => {
        const functions = this.sqz.vars.functions;
        let data = null;

        _.forEach(functions, (func) => {
          const event = func.event;
          if (event.type === 'http') {
            const expressPathFormatted = `${event.path.replace(/{(.*?)}/g, ':$1')}`;
            const pattern = new UrlPattern(expressPathFormatted);
            const patternMatch = pattern.match(url.split('?')[0]);

            if ((patternMatch && event.methods.indexOf(method) >= 0)) {
              data = {
                func: func,
                event: event,
                pathParameters: patternMatch
              };
            }
          }
        });

        resolve(data);
      });
    });
  }
}

module.exports = Express;
