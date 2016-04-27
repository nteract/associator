const tmp = require('tmp');
const fs = require('fs');
const exec = require('child_process').exec;

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
  return xdgMimeFile(mimetype, globPattern, comment).then(results => {
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

function xdgAssociate(mimetype, desktopFile) {
  return new Promise((resolve, reject) => {
    exec(`xdg-mime default ${desktopFile} ${mimetype}`, function(error, stdout, stderr) {
      if (error !== null) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  xdgAssociate,
  xdgGetAssociation,
  xdgMimetype,
};
