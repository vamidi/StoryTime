![StoryTime logo](./installation/storytime_logo.jpg)

# StoryTime 2020.1.3f1
A management tool that for creating role-playing games. This tool will work with Unity3D &amp; Unreal engine 4

## Requirements

* Make sure you have Node version >= 10.0 and (NPM >= 5 or Yarn ) [url](https://nodejs.org/en/download/)
* Your game engine of choice where you can receive JSON from the API.
* A Firebase project free or blaze tier.
* A web host to communicate with Firebase and return JSON data to your framework/engine.

# Installation

```sh
# clone our repo
git clone https://github.com/vamidi/Project-StoryTime.git


# change directory to our repo
cd project-storytime

# install the repo with npm
npm install
```

* If you don't have a Google account create it. If you already have an account go to the [Firebase Console](https://console.firebase.google.com/u/0/).
* Login and follow the steps to create a new project.

![Firebase app creation part 1](./installation/firebase-start-page.png)

* Fill in the name of your project. Once filled click to continue.

![Firebase app creation part 2](./installation/firebase-start-page-001.png)

> These steps are optional, but I would recommend using it if you want to receive analytics for your app.

* Enable Google Analytics for this project if not already enabled and click continue.

![Firebase app creation part 3](./installation/firebase-start-page-002.png)

* Select an account to use Google Analytics for, if this does not exist create one.
* Once finished click create project.

![Firebase Project creation](./installation/firebase-project-created.png)

* Once your project is generated, press continue to go to the home screen.

![Firebase home screen](./installation/firebase-project-settings.png)

* In the top left corner click on settings ⚙️ and click `project settings` to get your credentials.

![Firebase home screen](./installation/firebase-app-creation.png)

* In the `General` tab when you scroll down you see that you do not have any apps in your project. Click on web app ![Web icon](./installation/firebase-web-icon.png) and register your app.

![Firebase home screen](./installation/firebase-app-registration.png)

* Fill in the name of your app, you can keep `Firebase Hosting` unchecked and click register app.

> The config that you see will be for your firebase credentials. Keep them safe!

* Once you have registered your app click to continue back to console, and you will see your credentials.

> **NOTE - You can also use the credentials from the registration form**

## Authentication

> **NOTE for StoryTime to work you need users, so we have to add it now to the firebase project.**

* Go back to the firebase console, Under the `Build` category click on authentication.

![Firebase authentication screen](./installation/firebase-authentication.png)

* Click on `Get started` to continue to the authentication page.

![Firebase authentication screen](./installation/firebase-sign-in-methods.png)

* In the sign-in methods tab click on `email/password` and enable it (make sure to save it in order to see the changes).

* Go to the users tab

![Firebase authentication screen](./installation/firebase-authentication-add-user.png)

* Add a new user.
> **NOTE - Can be any kind of email as long as it is a valid email. The password can be anything you want**

## Firebase database

> **NOTE for StoryTime to work you need to use Firebase realtime database, so we have to add it now to the firebase project.**

* Go back to the firebase console, unfold `build` on the left side panel and click realtime database.

![Firebase Database Home creation screen](./installation/firebase-database-creation.png)

* Click on `Create database` to continue setting up the database.

![Firebase Database setup screen](./installation/firebase-database-setup-001.png)

> **NOTE - Choosing the database that is close to your location might help with the connection to the database**

* Choose the location where you want to store your database. You can choose what you prefer, I prefer United States.
* Click next to continue.

![Firebase Database rules](./installation/firebase-database-rules.png)

> **NOTE - Database rules can be changed later!**

* For development purposes I recommend choosing test mode, this will give read write access until the timestamp is surpassed (30days).
* Click enable to continue.


* Once the database is created you are set and ready to configure StoryTime.

## Configuration

**StoryTime** uses environment variables to configure firebase automatice. The [.env] file contains all the environment variables used in **StoryTime**.
> **NOTE - the `.env` should not be deleted or renamed, because the installation depends on this file.**

> **NOTE - if you are using separate environments make sure you create multiple apps with different firebase credentials and different `.env.[YOUR_ENVIRONMENT]` files.**
* Create a file in the root of the project, name it `.env` and copy over the content from the `.env.example` file.

The following table describes the configurable environment variables.
> **Variables with an asterisk are optional**

| Variable                | Default Value                          | Description                                                       |
| ----------------------  | -------------------------------------- | ----------------------------------------------------------------- |
| APP_NAME*               | "StoryTime - Dev"                      | The name of your app                                              |
| FIREBASE_API_KEY        | YOUR_API_KEY                		   | The API key firebase uses to connect to the database.             |
| FIREBASE_AUTH_DOMAIN    | YOUR_AUTH_DOMAIN                       | Firebase auth domain.                                             |
| FIREBASE_DATABASE_URL   | YOUR_DATABASE_URL                      | Firebase database url to grab data from the database.             |
| FIREBASE_PROJECT_ID     | YOUR_PROJECT_ID                        | Firebase project id.                                              |
| FIREBASE_STORAGE_BUCKET | YOUR_STORAGE_BUCKET                    | Firebase storage bucket url.                                      |
| FIREBASE_MESSAGING_ID   | YOUR_MESSAGING_ID                      | Firebase messaging id.                                            |
| FIREBASE_APP_ID         | YOUR_APP_ID                            | Firebase app id.                                                  |
| FIREBASE_MEASUREMENT_ID | YOUR_MEASUREMENT_ID                    | Firebase measurement id.

* Go back to Firebase console and in the top left corner click on settings ⚙️ and click afterwards on `project settings` to get part of the credentials needed.
* Scroll down and copy over apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId and measurementId (optional), to the corresponding variables in the `.env` file

```js
var firebaseConfig = {
	apiKey: "[FIREBASE_API_KEY]",
	authDomain: "[FIREBASE_AUTH_DOMAIN]",
	projectId: "[FIREBASE_PROJECT_ID]",
	storageBucket: "[FIREBASE_STORAGE_BUCKET]",
	messagingSenderId: "[FIREBASE_MESSAGING_ID]",
	appId: "[FIREBASE_APP_ID]",
	measurementId: "[FIREBASE_MEASUREMENT_ID]"
};
```

* Go back to Firebase console and unfold `build` and click on realtime database.

![Firebase database screen](./installation/firebase-database-screen.png)

* Copy the url and place in the `.env` file under the variable `FIREBASE_DATABASE_URL`.

## Development

* When all firebase variables are filled in, you are able to start the server to see everything in action.

```sh
# start the server
npm start

# if you're in China use cnpm
# https://github.com/cnpm/cnpm
```

go to http://localhost:4200 in your browser

## Production

```sh
# Build for production
npm run build:prod
```

* Copy over dist folder to your server where you want to run it from.
* Copy over the server folder to communicate with Firebase through Lumen (Laravel framework) - **WIP**.

## License

The StoryTime is open-sourced software licensed under the [Apache 2.0](./LICENSE)

The Lumen framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
