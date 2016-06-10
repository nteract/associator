const tmp = require('tmp');
const fs = require('fs');
const exec = require('child_process').exec;
const expandHomeDir = require('expand-home-dir');
const rimraf = require('rimraf');
const path = require('path');

function xdgMimetypeFile(mimetype, globPattern, comment) {
  return new Promise((resolve, reject) => {
    tmp.file({ mode: 0644, prefix: 'application-', postfix: '-mimetype.xml' }, (err, path, fd, done) => {
      if (err) {
        reject(err);
        return;
      }

      // TODO: Support icons and install them with xdg-icon-resource
      fs.write(fd, `<?xml version="1.0"?>
<mime-info xmlns='http://www.freedesktop.org/standards/shared-mime-info'>
  <mime-type type="${mimetype}">
    <comment>${comment}</comment>
    <glob pattern="${globPattern}"/>
  </mime-type>
</mime-info>`, err => {

        if (err) {
          done();
          reject(err);
        } else {
          resolve({ path, done });
        }
      });
    });
  });
}

function xdgMimetype(mimetype, globPattern, comment, allUsers, uninstall) {
  return xdgMimetypeFile(mimetype, globPattern, comment).then(results => {
    const mode = allUsers ? ' --mode system' : '';
    const command = uninstall ? 'uninstall' : 'install';
    return new Promise((resolve, reject) => {
      exec(`xdg-mime ${command} --novendor${mode} ${results.path}`, function(error, stdout, stderr) {
        results.done();
        if (error !== null) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

  });
}

function xdgGetAssociation(mimetype) {
  return new Promise((resolve, reject) => {
    exec(`xdg-mime query default ${mimetype}`, function(error, stdout, stderr) {
      if (error !== null) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function xdgAssociate(mimetype, desktopFile, allUsers) {
  return new Promise((resolve, reject) => {
    const mode = allUsers ? ' --mode system' : '';
    exec(`xdg-mime default${mode} ${desktopFile} ${mimetype}`, function(error, stdout, stderr) {
      if (error !== null) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Create a Freedesktop desktop file's contents
 * @param  {object} app - Well formed app object, see index.js
 * @return {string}
 */
function desktopFileTemplate(app, mimetypes) {
  let contents = ['[Desktop Entry]'];
  contents.push('Version=1.0');
  contents.push(`Type=Application`);
  if (app.name) contents.push(`Name=${app.name}`);
  if (app.description) contents.push(`Comment=${app.description}`);
  if (app.launchCmd) contents.push(`Exec=${app.launchCmd} %F`);
  if (app.launchPath) contents.push(`Path=${app.launchPath}`);
  if (app.icon) contents.push(`Icon=${app.icon}`);
  if (app.launchInTerminal) contents.push(`Terminal=${app.launchInTerminal}`);
  if (mimetypes) contents.push(`MimeType=${Object.keys(mimetypes).join(';')};`);
  if (app.categories) contents.push(`Categories=${app.categories.join(';')};`);
  return contents.join('\n');
}

function desktopFile(app, mimetypes, allUsers, uninstall) {
  const localInstall = expandHomeDir('~/.local/share/applications');
  const globalInstall = '/usr/share/applications';
  const path = path.join(allUsers ? globalInstall : localInstall, getDesktopFilename(app));
  return new Promise((resolve, reject) => {
    function promiseCallback(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }
    if (uninstall) {
      rimraf(path, promiseCallback);
    } else {
      fs.writeFile(path, desktopFileTemplate(app, mimetypes), promiseCallback);
    }
  });
}

function getDesktopFilename(app) {
  return app.name + '.desktop';
}

module.exports = {
  xdgAssociate,
  xdgGetAssociation,
  xdgMimetype,
  desktopFile,
  getDesktopFilename,
};
