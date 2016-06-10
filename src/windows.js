const { exec, execFile } = require('child_process');
const path = require('path');
const getBinaryPath =  require('elevator/lib/command').getBinaryPath;

function cmd(cmd) {
  return new Promise((resolve, reject) => {
    function cb(error, stdout, stderr) {
      if (error !== null) {
        reject(error);
      } else {
        resolve(stdout);
      }
    }
    exec(cmd, cb);
  });
}

function reg(command, ...args) {
  return cmd(`reg.exe ${command} ${args.join(' ')}`);
}

var elevateQue = [];
function elevatedReg(command, ...args) {
  elevateQue.push(`reg.exe ${command} ${args.join(' ')}`);
  return Promise.resolve();
}

function flushElevated() {
  const elevate = getBinaryPath();
  const result = cmd(`${elevate} -c -w cmd.exe /C "${elevateQue.join(' && ')}"`);
  elevateQue = [];
  return result;
}

function query(key) {
  return reg('QUERY', key, '/ve')
    .catch(err => {
      const split = key.split('\\');
      const name = split.splice(-1)[0];
      const root = split.join('\\');
      return reg('QUERY', root, '/v', name);
    })
    .then(output => {
      const lines = output.trim().split('\r\n');
      const cols = lines[1].trim().split('    ', 3);
      return {
        path: lines[0],
        name: cols[0],
        type: cols[1],
        value: cols[2],
      };
    });
}

function add(key, value, isDefault=true, type=null) {
  if (value && type === null) {
    switch (typeof value) {
      case 'string':
        type = 'REG_SZ';
        break;
      case 'number':
        type = 'REG_DWORD';
        break;
      default:
        type = 'REG_SZ';
    }
  }
  
  if (isDefault) {
    return elevatedReg('ADD', key, '/f /ve', value ? `/t ${type} /d "${value}"` : '')
  } else {
    const split = key.split('\\');
    const name = split.splice(-1)[0];
    const root = split.join('\\');
    return elevatedReg('ADD', root, '/f /v', name, value ? `/t ${type} /d "${value}"` : '')
  }
}

function _delete(key) {
  return elevatedReg('DELETE', key, '/f');
}

module.exports = { query, add, delete: _delete, flushElevated };
