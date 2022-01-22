# StoryTime server 2020.1.3.1

# Lumen PHP Framework
A server based on the lumen framework. This sever enables the connection between Unity3D &amp; Unreal engine 4.

## Requirements
* Make sure you have the latest version of [composer](https://getcomposer.org/download/) installed.
* PHP 7 or higher installed.
* Download the [cacert.pem](https://curl.haxx.se/ca/cacert.pem) file and place it at the same location as the php.ini.
* enable `openssl_dll` in the php.ini file.
* Change the entry `curl.cainfo` to the `cacert.pem` location.

# Installation

```sh
# clone our repo
git clone https://github.com/vamidi/StoryTime.git

# change directory to our repo
cd storytime/server

# install the repo with npm
composer install
```

## Firebase
> **Make sure you add your Firebase service file to your ignore file.**

In order to use the server you need download your `service.json` file from Firebase.
* Go to Firebase console and in the top left corner click on settings ⚙️ and click afterwards on `Service accounts`. Scroll down and click on `Generate new private key`.
* copy the file to the root of this directory.

## Development

* Fill in your credentials in the `.env` file
 
The following table describes the configurable environment variables.
> **Variables with an asterisk are optional**

| Variable                  | Default Value                          | Description                                                       |
| ----------------------    | -------------------------------------- | ----------------------------------------------------------------- |
| APP_NAME                  | "Lumen"                                | The name of your app                                              |
| APP_ENV                   | local                		             | The environment the app is in.                                    |
| APP_KEY                   | `empty`                                |                                                                   |
| APP_DEBUG                 | true                                   | If we should enable debug mode.                                   |
| APP_URL                   | http://localhost                       | the url of the app.                                               |
| APP_TIMEZONE              | UTC                                    | Timezone.                                                         |
| LOG_CHANNEL               | stack                                  |                                                                   |
| LOG_SLACK_WEBHOOK_URL     | `empty`                                |                                                                   |
| DB_CONNECTION             | mysql                                  | The kind of database we are connecting to.                        |
| DB_HOST 	  	            | 127.0.0.1		   	                     | IP address to the the database.                                   |
| DB_PORT 	  	            | 3306		                             | Port of the database.                                             |
| DB_DATABASE 	            | homestead		                         | Database name.                                                    |
| DB_USERNAME 	            | homestead		                         | Database username.                                                |
| DB_PASSWORD 	            | secret	                             | Database password.                                                |
| CACHE_DRIVER 	            | file		                             |                                                                   |
| QUEUE_CONNECTION 	        | sync	                                 |                                                                   |
| AUTH_GUARD 	            | api	                                 |                                                                   |
| JWT_SECRET 	            | random_secret_for_JWT		             | Random secret string for your JWT signing.
| FIREBASE_CREDENTIALS* 	| LOCATION_TO_YOUR_SERVICE_FILE.JSON	 | Firebase service credential file.
| FIREBASE_DATABASE_URL* 	| YOUR_FIREBASE_DATABASE_URL	         | Firebase database url.
| FIREBASE_PROJECT_ID* 	    | YOUR_FIREBASE_PROJECT_ID               | Firebase project id.

```sh
# start the server
php -S localhost:8000 -t public
```

## Production

* Copy over this folder to your server where you want to run it from.

## License

The StoryTime is open-sourced software licensed under the [Apache 2.0](./LICENSE)
