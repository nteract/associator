"use strict";

const os = require('os');
const osType = os.type().toLowerCase();
const OSX = 'darwin';
const Windows = 'windows_nt';
const Linux = 'linux';

// App object definition for reference
const emptyApp = {
  name: null,
  description: null,
  launchCmd: null,
  launchPath: null,
  icon: null,
  windowsIcon: null,
  launchInTerminal: null,
  categories: null,
};

function stripGlob(globPattern) {
  return globPattern[0] === '*' ? globPattern.slice(1) : globPattern;
}

function isAssociated(app, mimetypes) {
  switch (osType) {
    case Linux:
      const linux = require('./linux');
      return Promise.all(Object.keys(mimetypes).map(mimetype =>
        linux.xdgGetAssociation(mimetype)
          .then(associate => associate === linux.getDesktopFilename(app))
          .catch(err => false)
      )).then(x => x.every(y => y));

    case Windows:
      const windows = require('./windows')
      const extensions = Object.keys(mimetypes).map(mimetype => stripGlob(mimetypes[mimetype]));
      return Promise.all(extensions.map(extension => windows.query(`HKCR\\${extension}`)
        .then(associate => associate.value === app.name)
        .catch(err => false)
      ).concat([
        windows.query(`HKCR\\${app.name}`)
          .then(x => x.value === app.description)
          .catch(err => false)
      ])).then(x => x.every(y => y));

    default:
      throw new Error('platform not supported');
  }
}

function associate(app, mimetypes, allUsers) {
  switch (osType) {
    case Linux:
      const linux = require('./linux');
      return linux.desktopFile(app, mimetypes, allUsers, false)
        .then(() => Promise.all(Object.keys(mimetypes).map(mimetype =>
          linux.xdgMimetype(mimetype, mimetypes[mimetype], app.description, allUsers, false)
            .then(() => linux.xdgAssociate(mimetype, linux.getDesktopFilename(app), allUsers))
        )));

    case Windows:
      const windows = require('./windows')
      const extensions = Object.keys(mimetypes).map(mimetype => stripGlob(mimetypes[mimetype]));

      let launchCmd = `${app.launchCmd} %1`;

      // Windows doesn't support the notion of a launch working dir, so hack
      // around it by using the START command.  This has the unpleasent side
      // effect of leaving a cmd window open.
      if (app.launchPath) {
        launchCmd = `cmd.exe /C start \\"\\" /D ${app.launchPath} /B ${launchCmd}`;
      }

      return windows.add(`HKCR\\${app.name}`, app.description, true)
        .then(() => windows.add(`HKCR\\${app.name}\\DefaultIcon`, app.windowsIcon || app.icon, true))
        .then(() => windows.add(`HKCR\\${app.name}\\shell\\Open\\Command `, launchCmd, true))
        .then(() => Promise.all(extensions.map(extension =>
          windows.add(`HKCR\\${extension}`, app.name, true)
        )))
        .then(() => windows.flushElevated());
    default:
      throw new Error('platform not supported');
  }
}


function unassociate(app, mimetypes, allUsers) {
  switch (osType) {
    case Linux:
      const linux = require('./linux');
      return linux.desktopFile(app, mimetypes, allUsers, true)
        .then(() => Promise.all(Object.keys(mimetypes).map(mimetype =>
          linux.xdgMimetype(mimetype, mimetypes[mimetype], description, allUsers, true)
        )));

    case Windows:
      const windows = require('./windows')
      const extensions = Object.keys(mimetypes).map(mimetype => stripGlob(mimetypes[mimetype]));
      return windows.delete(`HKCR\\${app.name}`)
        .then(() => Promise.all(extensions.map(extension =>
          windows.delete(`HKCR\\${extension}`)
        )))
        .then(() => windows.flushElevated());

    default:
      throw new Error('platform not supported');
  }
}

module.exports = {
  emptyApp,
  isAssociated,
  associate,
  unassociate,
};
