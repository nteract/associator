const associator = require('associator');
const path = require('path');

// First create an "app object" that represents your application.
// launchCmd and launchPath will probably differ for production and dev builds
const mimetypes = {
  'application/x.associator-example': '*.assoctest',
};
const app = {
  name: 'AssociatorExampleApp',
  description: 'Demonstration application, for file type associations',
  launchCmd: 'npm start',
  launchPath: __dirname, // basically like executing `cd` prior to the app
  icon: path.join(__dirname, 'icon.svg'), // generic icon
  windowsIcon: path.join(__dirname, 'icon.ico'),
  launchInTerminal: false,
  categories: [
    'Utility',
    'Development',
  ],
}

// Check if the app has already been associated as the handle of the mimetype
associator.isAssociated(app, mimetypes, false)
  // Note: Here, you may want to prompt the user before actually performing the association.
  // Associate the application to the mimetype if it's not already
  .then(associated => associated ? null : associator.associate(app, mimetypes, false))
  .catch(err => {
    console.error('association could not be performed', err);
  });
  // .then(() => associator.unassociate(app, mimetypes, false))
  // .catch(err => {
  //   console.error('unassociation could not be performed', err);
  // });
