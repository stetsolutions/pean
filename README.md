#PEAN.JS

PEAN.JS is a full-stack JavaScript open-source solution, which provides a solid starting point for [PostgreSQL](http://www.postgresql.org/), [Node.js](http://www.nodejs.org/), [Express](http://expressjs.com/), and [AngularJS](http://angularjs.org/) based applications. The idea is to solve the common issues with connecting those frameworks, build a robust framework to support daily development needs, and help developers use better practices while working with popular JavaScript components.

## Before You Begin
Before you begin we recommend you read about the basic building blocks that assemble a PEAN.JS application:
* PostgreSQL - Go through [PostegreSQL Official Website](http://www.postgresql.org/) and proceed to their [Official Documentation](http://www.postgresql.org/docs/), which should help you understand PostgreSQL better.
* Express - The best way to understand express is through its [Official Website](http://expressjs.com/), which has a [Getting Started](http://expressjs.com/starter/installing.html) guide, as well as an [ExpressJS Guide](http://expressjs.com/guide/error-handling.html) guide for general express topics. You can also go through this [StackOverflow Thread](http://stackoverflow.com/questions/8144214/learning-express-for-node-js) for more resources.
* AngularJS - Angular's [Official Website](http://angularjs.org/) is a great starting point. You can also use [Thinkster Popular Guide](http://www.thinkster.io/), and the [Egghead Videos](https://egghead.io/).
* Node.js - Start by going through [Node.js Official Website](http://nodejs.org/) and this [StackOverflow Thread](http://stackoverflow.com/questions/2353818/how-do-i-get-started-with-node-js), which should get you going with the Node.js platform in no time.


## Prerequisites
Make sure you have installed all of the following prerequisites on your development machine:
* Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager. If you encounter any problems, you can also use this [GitHub Gist](https://gist.github.com/isaacs/579814) to install Node.js.
  * Node v5 IS NOT SUPPORTED AT THIS TIME! 
* PostgreSQL - [Download & Install PostegreSQL](http://www.postgresql.org/download/).
* Ruby - [Download & Install Ruby](https://www.ruby-lang.org/en/documentation/installation/)
* Bower - You're going to use the [Bower Package Manager](http://bower.io/) to manage your front-end packages. Make sure you've installed Node.js and npm first, then install bower globally using npm:

```bash
$ npm install -g bower
```

* Grunt - You're going to use the [Grunt Task Runner](http://gruntjs.com/) to automate your development process. Make sure you've installed Node.js and npm first, then install grunt globally using npm:

```bash
$ npm install -g grunt-cli
```

* Sass - You're going to use [Sass](http://sass-lang.com/) to compile CSS during your grunt task. Make sure you have ruby installed, and then install Sass using gem install:

```bash
$ gem install sass
```

```bash
$ npm install -g grunt-cli
```

* Gulp - (Optional) You may use Gulp for Live Reload, Linting, and SASS or LESS.

```bash
$ npm install gulp -g
```

## Downloading PEAN.JS
There are several ways you can get the PEAN.JS boilerplate:

### Cloning The GitHub Repository
The recommended way to get PEAN.js is to use git to directly clone the PEAN.JS repository:

```bash
$ git clone https://github.com/StetSolutions/pean.git peanjs
```

This will clone the latest version of the PEAN.JS repository to a **peanjs** folder.

### Downloading The Repository Zip File
Another way to use the PEAN.JS boilerplate is to download a zip copy from the [master branch on GitHub](https://github.com/StetSolutions/pean/archive/master.zip). You can also do this using `wget` command:

```bash
$ wget https://github.com/StetSolutions/pean/archive/master.zip -O peanjs.zip; unzip peanjs.zip; rm peanjs.zip
```

Don't forget to rename **pean-master** after your project name.

## Quick Install
Once you've downloaded the boilerplate and installed all the prerequisites, you're just a few steps away from starting to develop your PEAN application.

The first thing you should do is install the Node.js dependencies. The boilerplate comes pre-bundled with a package.json file that contains the list of modules you need to start your application. To learn more about the modules installed visit the NPM & Package.json section.

To install Node.js dependencies you're going to use npm again. In the application folder, run this from the command-line:

```bash
$ npm install
```

This command does a few things:
* First it will install the dependencies needed for the application to run.
* If you're running in a development environment, it will then also install development dependencies needed for testing and running your application.
* Finally, when the install process is over, npm will initiate a bower install command to install all the front-end modules needed for the application.

## Running Your Application
The first thing you will need to do is supply your PostgreSQL credentials.

To do this, duplicate 'config/env/local.example.js' and rename the file 'config/env/local-development.js' (as instructed in the example file itself). 

If you have not done so already, create a PostgreSQL database (our example uses a database named 'pean_dev'). 

Uncomment 'module.exports' in the 'local-development.js' file you just created and replace the 'db.options' properties with your own PostgreSQL database name, username and password. 

Make sure that 'db.force' is set to 'true' (as in the example). When the Sequelize option 'force' is set to 'true', all tables are dropped and recreated everytime the server is started/restarted. Additionally, any roles defined in your configuration will be added to the 'Roles' table by the application.  

Now just run your application using Grunt. 

In the application folder, run this from the command-line:

```
$ grunt
```

or in 'debugging' mode:

```
$ grunt debug
```

Your application should run on port 3000 with the *development* environment configuration, so in your browser just go to [http://localhost:3000](http://localhost:3000)

That's it! Your application should be running. To proceed with your development, check the other sections in this documentation.

If you encounter any problems, try the Troubleshooting section.

* Explore `config/env/development.js` for development environment configuration options.
* Set 'force' to 'false' if you want to preserve your table data on server restart.  

### Running in Production mode
To run your application with *production* environment configuration, execute grunt as follows:

```bash
$ grunt prod
```

* Explore `config/env/production.js` for production environment configuration options.

### Running with User Seed
To have default account(s) seeded at runtime:

In Development:
```bash
DB_SEED=true grunt
```
It will try to seed the users 'user' and 'admin'. If one of the user already exists, it will display an error message on the console. 

Just grab the passwords from the console.

In Production:
```bash
DB_SEED=true grunt prod
```
This will seed the admin user one time if the user does not already exist. You have to copy the password from the console and save it.

To 'force' a complete refresh of the DB, set the Sequelize 'force' option:
```bash
DB_FORCE=true DB_SEED=true grunt
```

### Running with TLS (SSL)
Application will start by default with secure configuration (SSL mode) turned on and listen on port 8443.
To run your application in a secure manner you'll need to use OpenSSL and generate a set of self-signed certificates. Unix-based users can use the following command:

```bash
$ sh ./scripts/generate-ssl-certs.sh
```

Windows users can follow instructions found [here](http://www.websense.com/support/article/kbarticle/How-to-use-OpenSSL-and-Microsoft-Certification-Authority).
After you've generated the key and certificate, place them in the *config/sslcerts* folder.

Finally, execute grunt's prod task `grunt prod`
* enable/disable SSL mode in production environment change the `secure` option in `config/env/production.js`


## Testing Your Application
You can run the full test suite included with PEAN.JS with the test task:

```bash
$ grunt test
```

This will run both the server-side tests (located in the app/tests/ directory) and the client-side tests (located in the public/modules/*/tests/).

To execute only the server tests, run the test:server task:

```bash
$ grunt test:server
```

And to run only the client tests, run the test:client task:

```bash
$ grunt test:client
```

And to run only the "end to end" tests, run the test:e2e task:
```bash
grunt test:e2e
```

## Running your application with Gulp

After the install process, you can easily run your project with:

```bash
$ gulp
```
or

```bash
$ gulp default
```

The server is now running on http://localhost:3000 if you are using the default settings. 

### Running Gulp Development Environment

Start the development environment with:

```bash
$ gulp dev
```

### Running in Production mode
To run your application with *production* environment configuration, execute gulp as follows:

```bash
$ gulp prod
```

### Testing Your Application with Gulp
Using the full test suite included with PEAN.JS with the test task:

### Run all tests
```bash
$ gulp test
```

### Run server tests
```bash
gulp test:server
```

### Run client tests
```bash
gulp test:client
```

### Run e2e tests
```bash
gulp test:e2e
```

## Getting Started With PEAN.JS
You have your application running, but there is a lot of stuff to understand. We recommend you go over the [Official MEAN Documentation](http://meanjs.org/docs.html).
In the docs we'll try to explain both general concepts of MEAN components and give you some guidelines to help you improve your development process. We tried covering as many aspects as possible, and will keep it updated by your request. You can also help us develop and improve the documentation by checking out the *gh-pages* branch of this repository.

## Community
* Use the [Official Website](http://peanjs.org) to learn about changes and the roadmap.

## Contributing
We welcome pull requests from the community! Just be sure to read the [contributing](https://github.com/StetSolutions/pean/blob/master/CONTRIBUTING.md) doc to get started.

## Credits
Inspired by the great work of [Madhusudhan Srinivasa](https://github.com/madhums/)
The MEAN name was coined by [Valeri Karpov](http://blog.mongodb.org/post/49262866911/the-mean-stack-mongodb-expressjs-angularjs-and)

## License
(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
