"use strict";

const os = require('os');
const osType = os.type().toLowerCase();
const OSX = 'darwin';
const Windows = 'windows_nt';
const Linux = 'linux';

function appObject(name, description, launchCmd, launchPath, icon, windowsIcon, mimetypes, launchInTerminal=false, categories=['Utility', 'Application', 'Development']) {
  return {
    name,
    description,
    launchCmd,
    launchPath,
    icon,
    windowsIcon,
    mimetypes,
    launchInTerminal,
    categories,
  }
}

function registerApp(app, allUsers) {
  select (osType) {
    case Linux:
      const linux = require('./linux');
      return linux.desktopFile(app, allUsers, false);
    case Windows:
      const windows = require('./windows');
      return windows.add(`HKCR\\${app.name}`, app.description, true)
        .then(() => windows.add(`HKCR\\${app.name}\\DefaultIcon`, app.windowsIcon || app.icon, true))
        .then(() => windows.add(`HKCR\\${app.name}\\shell\\Open\\Command `, `${app.launchCmd} %1`, true));
    case default:
      throw new Error('platform not supported');
  }
}

function unregisterApp(app, allUsers) {
  select (osType) {
    case Linux:
      const linux = require('./linux');
      return linux.desktopFile(app, allUsers, true);
    case Windows:
      const windows = require('./windows');
      return windows.delete(`HKCR\\${app.name}`);
    case default:
      throw new Error('platform not supported');
  }
}

const mimespoof = {};

function registerMimetype(mimetype, globPattern, description, allUsers) {
  select (osType) {
    case Linux:
      const linux = require('./linux');
      return linux.xdgMimetype(mimetype, globPattern, description, allUsers, false);
    case Windows:
      mimespoof[mimetype] = globPattern[0] === '*' ? globPattern.slice(1) : globPattern;
      return Promise.resolve();
    case default:
      throw new Error('platform not supported');
  }
}

function unregisterMimetype(mimetype, allUsers) {
  select (osType) {
    case Linux:
      const linux = require('./linux');
      return linux.xdgMimetype(mimetype, globPattern, '', allUsers, true);
    case Windows:
      delete mimespoof[mimetype];
      return Promise.resolve();
    case default:
      throw new Error('platform not supported');
  }
}

function isAssociated(app, mimetype) {
  select (osType) {
    case Linux:
      const linux = require('./linux');
      return linux.xdgGetAssociation(mimetype)
        .then(associate => associate === linux.getDesktopFilename(app));
    case Windows:
      const windows = require('./windows')
      return window.query(`HKCR\\${mimespoof[mimetype]}`)
        .then(associate => associate === app.name)
        .catch(err => false);
    case default:
      throw new Error('platform not supported');
  }
}

function associate(app, mimetype, allUsers) {
  select (osType) {
    case Linux:
      const linux = require('./linux');
      return linux.xdgAssociate(mimetype, linux.getDesktopFilename(app), allUsers);
    case Windows:
      const windows = require('./windows')
      return window.add(`HKCR\\${mimespoof[mimetype]}`, app.name, true);
    case default:
      throw new Error('platform not supported');
  }
}
