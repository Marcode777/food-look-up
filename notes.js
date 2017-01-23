// in package.json, the dev dependency react-scripts is the dependency that contains all the essentials:
// it has the dependencies such as Babel, ESLint and Webpack
// it has configuration: config files for Webpack, Babel and ESLint, both for development and production
// it has scripts, for instance, the command react-scripts start runs a script shipped with this package. It's responsible for ultimately booting the Webpack development server.


//We have our API server in the top-level directory and we were able to boot that. And we have our client app down here in client and we're able to boot a server for this.
//But why does our React app need its own server? And how are we going to get these two servers working together?
//Understanding this requires getting down to The Rub.

// THE RUB 
//Webpack is a JavaScript bundler. You might have many different JavaScript modules, like React components and Redux reducers, strewn across many different files. 
//Webpack rolls these up into one gigantic "bundle." Think of the bundle as a combination of a vanilla index.html that includes a file bundle.js. This JavaScript file is one big, long file with every line of JavaScript that your app depends on, all shoved into one location. This single file will contain browser-ready JavaScript as Babel will have already worked its transpiling magic.
//You can instruct Webpack you would like it to produce this bundle. create-react-app inserts a build command into package.json:
// $ npm run build
// This command kicks off Webpack and Webpack spits out a bundle. You could then serve the index.html from that bundle wherever you'd like.
// So, we could use Webpack to generate this bundle. And we could have our API server serve the static asset index.html. We'd run the build command inside client/ and out would come the magic build folder. We could then serve this folder with our API server.
// And it would work. And we might even be happy about it.

// However, there's a better approach: You can have Webpack boot a little Node server to serve the bundle. This means that when you make updates to your JavaScript/assets, you don't have to re-build and re-load — you just hit the server again to get the latest bundle. 
//This workflow enables hot reloading, where your web app will reload itself when assets change, saving your modifier+R keys from a significant amount of wear.
// In fact, if you run npm run build you'll find that this command is intended for production use. It does all kinds of optimization that can be time consuming — aggravating when you're quickly iterating in development. Booting a Webpack dev server is the way to go.

//In production, we'll use npm run build to create our static bundle. We can then throw that bundle anywhere (like S3), independent of the API server. 
//The README of the GitHub repo for this project describes the process.
// So the user will direct their browser to localhost:3000, hitting the Webpack dev server. But then how will the React app communicate with our API server?


//In this flow, the user's browser makes a request to localhost:3000, loading the static assets from the Webpack dev server. The user's browser / React then makes requests as needed directly to the API server hosted on localhost:3001 with calls like this:
// fetch('localhost:3001/api/foods?q=carrots', {
// // ...
// });
// This would produce an issue, however. 
//The React app (hosted at localhost:3000) would be attempting to load a resource from a different origin (localhost:3001). This would be performing Cross-Origin Resource Sharing. The browser prevents these types of requests from scripts for security reasons.


//create-react-app provides a mechanism for working with an API server in development. 
//We can have the Webpack development server proxy requests intended for our API server


// In this flow, React makes an API request to localhost:3000, the Webpack development server. And then the development server simply proxies that request to the API server, negating any CORS issues.
// So, the Rub: we need to (1) launch both the Webpack dev server and the API server in order to run the app locally. And then (2) we need to get the Webpack dev server to proxy requests intended for our API server.
// For the first challenge, we could use two terminal windows: boot each server in its own window. 
//But we could get a bit fancier.







// Concurrently  *****quick note from myself: concurrently and its commands did not work or were not recognized until I installed it with this command: sudo npm install -g concurrently --save *****
// Concurrently is a utility for running multiple processes. We'll see how it works by implementing it.

// Make sure you're in the top-level directory and install it with npm:

// $ npm i --save-dev concurrently
// We want concurrently to execute two commands, one to boot the API server and one to boot the Webpack development server. You boot multiple commands by passing them to concurrently in quotes like this:

// $ concurrently "command1" "command2"
// If you were writing your app to just work on Mac or Unix machines, you could do something like this:

// $ concurrently "npm run server" "cd client && npm start"
// Note the second command for booting the client first changes into the client directory and then runs npm start.

// However, the && operator is not cross-platform (doesn't work on Windows). As such, we've included a start-client.js script with the project. This script will boot the client from the top-level directory in a manner that is cross-platform.

// Ultimately, we'll want to boot concurrently like this:

// $ concurrently "npm run server" "npm run client" *****note, this is for the outside package.json at the top-level, not the package.json inside client*****
// This will be our start command. Let's add the start and client commands to our package.json now:

// "scripts": {
//     "start": "concurrently \"npm run server\" \"npm run client\"",
//     "server": "babel-node server.js",
//     "client": "babel-node start-client.js"
//   },s
// For start, we execute both commands, escaping the quotes because we're in a JSON file. For client, we execute the start-client.js script with babel-node.

// Now we can boot both servers by running npm start.

// With the foundations in place, let's wire the two up. We'll toss in the food lookup React components which will make requests against our API server.

// The app's React components
// Let's steal the React source files from the master branch. This will save you from some copying & pasting:

// git checkout master -- client/src
// We use Semantic UI for styling the app. It's included inside of src/index.js. index.css contains a few kludgey margins.

// For brevity, we won't walk through the React components. For the purposes of reading along, you just need to know that changing the value of the search bar (the FoodSearch component) ultimately calls search() on Client.

// Client.js contains a Fetch call to our API endpoint:


// function search(query) {
//   return fetch(`/api/food?q=${query}`, {
//     accept: 'application/json',
//   }).then(checkStatus)
//     .then(parseJSON);
// }
// This is the one touch point between our React web app and the API server.

// Notice how the URL does not include the base localhost:3001. That's because, as noted earlier, we want this request to be made to the Webpack development server. Thanks to the configuration established by create-react-app, the Webpack dev server will infer what traffic to proxy. It will proxy a request if the URL is not recognized or if the request is not loading static assets (like HTML/CSS/JS).

// We just need to instruct Webpack to use the proxy.

// If you're not coding along at home and want to take a peek at FoodSearch.js, just check it out over on GitHub.

// Setting up the proxy
// To have the Webpack development server proxy our API requests to our API server, we just need to add the following line to client/package.json:

// // Inside client/package.json
// "proxy": "http://localhost:3001/",
// We're set.

// Testing it out
// Our React app is ready and in place in client/. We have concurrently setup to boot both our Webpack dev server and our API server together. And we've specified the route that Webpack should proxy API traffic to.

// Let's boot both servers:

// $ npm start  ***** my own note thanks to an update, the command should be, npm run dev, instead of start, when booting the server from the branch*****
// ***** also, for launching to heroku, make sure you are in the top-level directory (in this case food-lookup-demo), and then make sure you are on master branch, then heroku create whatevernameofapp and then, add ., commit whatevermessage, and finally, git push heroku master *****
// We're in business!


