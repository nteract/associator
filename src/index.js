"use strict";

const os = require('os');
const osType = os.type().toLowerCase();
const isOsx = osType === 'darwin';
const isWindows = osType === 'windows_nt';
const isLinux = osType === 'linux';

function appObject(name, description, launchCmd, launchPath, icon, mimetypes, launchInTerminal=false, categories=['Utility', 'Application', 'Development']) {
  return {
    name,
    description,
    launchCmd,
    launchPath,
    icon,
    mimetypes,
    launchInTerminal,
    categories,
  }
}

function registerApp(app, allUsers) {
  if (isLinux) {
    const linux = require('./linux');
    return linux.desktopFile(app, allUsers, false);
  }
  throw new Error('platform not supported');
}

function unregisterApp(app, allUsers) {
  if (isLinux) {
    const linux = require('./linux');
    return linux.desktopFile(app, allUsers, true);
  }
  throw new Error('platform not supported');
}

function registerMimetype(mimetype, globPattern, description, allUsers) {
  if (isLinux) {
    const linux = require('./linux');
    return linux.xdgMimetype(mimetype, globPattern, description, allUsers, false);
  }
  throw new Error('platform not supported');
}

function unregisterMimetype(mimetype, allUsers) {
  if (isLinux) {
    const linux = require('./linux');
    return linux.xdgMimetype(mimetype, globPattern, '', allUsers, true);
  }
  throw new Error('platform not supported');
}

function isAssociated(app, mimetype) {
  if (isLinux) {
    const linux = require('./linux');
    return linux.xdgGetAssociation(mimetype)
      .then(associate => associate === linux.getDesktopFilename(app));
  }
  throw new Error('platform not supported');
}

function associate(app, mimetype, allUsers) {
  if (isLinux) {
    const linux = require('./linux');
    return linux.xdgAssociate(mimetype, linux.getDesktopFilename(app), allUsers);
  }
  throw new Error('platform not supported');
}
