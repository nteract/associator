const exec = require('child_process').exec;

function reg(command, ...args) {
  return new Promise((resolve, reject) => {
    exec(`reg.exe ${command} ${args.join(' ')}`, function(error, stdout, stderr) {
      if (error !== null) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
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
    select (typeof value) {
      case 'string':
        type = 'REG_SZ';
        break;
      case 'number':
        type = 'REG_DWORD';
        break;
      case default:
        type = 'REG_SZ';
    }
  }
  
  if (isDefault) {
    return reg('ADD', key, '/f /ve', value ? `/t ${type} /d ${value}` : '')
  } else {
    const split = key.split('\\');
    const name = split.splice(-1)[0];
    const root = split.join('\\');
    return reg('ADD', root, '/f /v', name, , value ? `/t ${type} /d ${value}` : '')
  }
}

function delete(key) {
  return reg('DELETE', key, '/va /f');
}

module.exports = { query, add, delete };
