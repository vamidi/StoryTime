<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

use App\Http\Controllers\FirebaseController;

// use App\Http\Controllers\SettingController;
use Laravel\Lumen\Routing\Router;

// use App\Http\Controllers\PageController;
// use App\Http\Controllers\MenuController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

/** @var Router $router */
$router->get('/', function () use ($router) {
//    Route::redirect('/', '/api');
    return $router->app->version();
});

$router->group(['prefix' => 'api/'/*, 'middleware' => 'auth:api'*/], function () use ($router) {

    $router->post('authenticate', UserController::class . '@authenticate');

    $router->get('me', UserController::class . '@me');

    $router->get('refresh', UserController::class . '@refresh');

    $router->group(['prefix' => '/firebase'], function () use ($router) {
        $router->get('/', FirebaseController::class . '@index');
        // Get all projects of the user
        $router->get('/projects/', FirebaseController::class . '@projects');
        // Get one of the projects for the user
        $router->get('/projects/{project}', FirebaseController::class . '@project');
        // Get the tables of the selected project
        $router->get('/projects/{project}/tables/', FirebaseController::class . '@tables');
        // Get a table inside the project of the user.
        $router->get('/projects/{project}/tables/{table}', FirebaseController::class . '@table');
    });
});

