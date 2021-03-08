# StoryTime server 2020.1.3f1

# Lumen PHP Framework
A server based on the lumen framework. This sever enables the connection between Unity3D &amp; Unreal engine 4.

## Requirements
* Make sure you have the latest version of composer installed.
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

## Development

```sh
# start the server
php -S localhost:8000 -t public
```

## Production

* Copy over this folder to your server where you want to run it from.

## License

The StoryTime is open-sourced software licensed under the [Apache 2.0](./LICENSE)
