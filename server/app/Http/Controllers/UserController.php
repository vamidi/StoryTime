<?php

namespace App\Http\Controllers;

use App\User;

use Firebase\Auth\Token\Exception\ExpiredToken;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use Kreait\Firebase\Auth\SignIn\FailedToSignIn;
use Kreait\Firebase\Database as FirebaseDatabase;
use Kreait\Firebase\JWT\Error\IdTokenVerificationFailed;
use Kreait\Firebase\JWT\IdTokenVerifier;

use Tymon\JWTAuth\JWTAuth;

use Firebase\Auth\Token\Exception\InvalidToken;
use Firebase\Auth\Token\Exception\UnknownKey;

class UserController extends Controller
{
	/** @var JWTAuth */
	protected $jwt;

	/** @var FirebaseDatabase $database */
	private $database = null;

	public function __construct(JWTAuth $jwt)
	{
//		$this->middleware('auth:api', ['except' => ['login']]);

		$this->jwt = $jwt;
	}

	public function index()
	{
		$list = User::all();
		return response()->json($list);
	}

	public function show($id)
	{
		$user = User::find($id);
		return response()->json($user);
	}

	/**
	 * @return JsonResponse
	 */
	public function create(/* Request $request */)
	{
		return response()->json(['status' => 'fail', 'errors' => ['User could not be created']],401);
		/*
				try {
					$errors = $this->validate($request, [
						'password' => 'required',
						'email' => 'required|email|unique:cr_users'
					]);
				} catch (ValidationException $e) {
				}

				$user = User::create($request->all());
		*/
	}

	/**
	 * @param Request $request
	 * @param FirebaseDatabase $firebaseDatabase
	 * @return JsonResponse
	 */
	public function authenticate(Request $request, FirebaseDatabase $firebaseDatabase)
	{
		$this->setDatabase($firebaseDatabase);

		$auth = app('firebase.auth');

		$email = $request->post('email', '');
		$clearTextPassword = $request->post('password', '');

		try {
			$signInResult = $auth->signInWithEmailAndPassword($email, $clearTextPassword);

			return response()->json($signInResult->asTokenResponse());
		} catch (FailedToSignIn $e)
		{
            return response()->json(['error' => $e->getMessage()], 401);
//			return response()->json(['error' => 'Email or password is not valid'], 401);
		}
	}

	/**
	 * @return JsonResponse
	 */
	public function logout()
	{
		$this->guard()->logout();

		return response()->json(['message' => 'Successfully logged out']);

	}

	public function register(Request $request)
	{
		return response()->json(['message' => 'User Registration Failed!'], 409);

		/*
		// validate incoming request
		$this->validate($request, [
			'name' => 'required|string',
			'email' => 'required|email|unique:users',
			'password' => 'required|confirmed',
		]);

		try {

			$user = new User;
			$user->name = $request->input('name');
			$user->email = $request->input('email');
			$plainPassword = $request->input('password');
			$user->password = app('hash')->make($plainPassword);

			$user->save();

			//return successful response
			return response()->json(['user' => $user, 'message' => 'CREATED'], 201);

		} catch (\Exception $e) {
			//return error message
			return response()->json(['message' => 'User Registration Failed!'], 409);
		}
		*/
	}

	/**
	 * @param Request $request
	 * @return JsonResponse
	 */
	public function me(Request $request)
	{
		$idTokenString = $request->bearerToken();

		if(!empty($idTokenString))
		{
			$auth = app('firebase.auth');

			try {
				$auth->verifyIdToken($idTokenString);
			} catch (ExpiredToken $e)
			{
				return response()->json(['error' => $e->getMessage()], 401);
			} catch (IdTokenVerificationFailed $e)
			{
				return response()->json(['error' => $e->getMessage()], 401);
			}
		}

		return response()->json(['error_msg' => 'Token is valid!'], 200);
	}

	/**
	 * Refresh a token.
	 * @param Request $request
	 * @return JsonResponse
	 */
	public function refresh(Request $request)
	{
		$auth = app('firebase.auth');

		$idTokenString = $request->bearerToken();

		if(!empty($idTokenString)) {
			$signInResult = $auth->signInWithRefreshToken($idTokenString);

			return response()->json($signInResult->asTokenResponse());
		}

		return response()->json(['error' => 'Invalid user'], 401);
	}

	/**
	 * Get the guard to be used during authentication.
	 *
	 * @return Guard
	 */
	public function guard()
	{
		return Auth::guard();
	}

	// TODO Implement return $this->hasMany('App\Todo','user_id');

	/**
	 * Get the token array structure.
	 *
	 * @param string $token
	 *
	 * @return JsonResponse
	 */
	protected function respondWithToken($token)
	{
		return response()->json([
			'access_token' => $token,
			'token_type' => 'bearer',
			'expires_in' => $this->guard()->factory()->getTTL() * 60
		]);
	}

	/**
	 * @param FirebaseDatabase $firebaseDatabase
	 */
	private function setDatabase(FirebaseDatabase $firebaseDatabase)
	{
		$this->database = $firebaseDatabase;
		$this->response = [];
	}
}
