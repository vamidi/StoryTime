<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Kreait\Firebase\Database as FirebaseDatabase;
use Kreait\Firebase\Exception\Database\UnsupportedQuery;
use Kreait\Firebase\Exception\FirebaseException;
use Kreait\Firebase\JWT\Error\IdTokenVerificationFailed;
use Kreait\Firebase\JWT\IdTokenVerifier;

class FirebaseController extends Controller
{
	/** @var FirebaseDatabase $database */
	private $database = null;

	/** @var array */
	private $response = [];

	/**
	 * @param $firebaseDatabase
	 * @param $request
	 * @return JsonResponse
	 */
	public function index(FirebaseDatabase $firebaseDatabase, Request $request)
	{
		$this->setDatabase($firebaseDatabase);

		try {
			// Get the children of the root
			$children = $this->getRootReference()->getChildKeys();

			// Get current timestamp
			$timestamp = $this->getTimeStamp($request);

			foreach ($children as $child)
			{
				if (!$this->valuesToArray($child, $timestamp))
					$this->response["error_msg"][] = "There is no (new) data available for table '" . $child . "'";
			}

		} catch (FirebaseException $e)
		{
			return response()->json(["error_msg" => array("There is no (new) data available for any table", $e->getMessage())]);
		}

		return response()->json($this->response);
	}

	/**
	 * @param FirebaseDatabase $firebaseDatabase
	 * @param Request $request
	 * @return JsonResponse
	 */
	public function projects(FirebaseDatabase $firebaseDatabase, Request $request)
	{
		$this->setDatabase($firebaseDatabase);

		$auth = app('firebase.auth');

		$idTokenString = $request->bearerToken();

		$record = null;
		try {
			$verifiedIdToken = $auth->verifyIdToken($idTokenString);
		} catch (IdTokenVerificationFailed $e)
		{
			return response()->json(['error' => $e->getMessage()], 401);
		}

		$uid = $verifiedIdToken->getClaim('sub');

		try {
			$arr = $this->database->getReference('users/'. $uid)->getChild('projects')->getSnapshot()->getValue();
			if (!empty($arr))
			{

				return response()->json(["projects" => $arr]);
			}


			return response()->json(["error_msg" => array("No projects found")]);
		} catch (\Exception|FirebaseException $e) {
			return response()->json(["error_msg" => array("No projects found")]);
		}
	}

	/**
	 * @param string $project
	 * @param FirebaseDatabase $firebaseDatabase
	 * @param Request $request
	 * @return JsonResponse
	 */
	public function project(string $project, FirebaseDatabase $firebaseDatabase, Request $request)
	{
		$this->setDatabase($firebaseDatabase);

		if (empty($project))
			return response()->json(["error_msg" => "No {project} parameters found"], 401);

		// TODO get token through bearer
		$idTokenString = $request->bearerToken();

		if(empty($idTokenString))
            return response()->json(["error_msg" => "Not authorized"], 401);

		$verifier = IdTokenVerifier::createWithProjectId(env('FIREBASE_PROJECT_ID'));

		try {
			$verifier->verifyIdToken($idTokenString);
		} catch (IdTokenVerificationFailed $e)
		{
			return response()->json(['error' => $e->getMessage()], 401);
		}

		try {
			$arr = $this->database->getReference('projects')
				->getChild($project)
				->getSnapshot()
				->getValue();

			if (!empty($arr))
			{
				return response()->json([$arr]);
			}


			return response()->json(["error_msg" => array("No project found with the name $project found")]);
		} catch (\Exception|FirebaseException $e) {
			return response()->json(["error_msg" => array("No project found with the name $project found")]);
		}
	}

	/**
	 * @param string $project
	 * @param FirebaseDatabase $firebaseDatabase
	 * @param Request $request
	 * @return JsonResponse
	 */
	public function tables(string $project, FirebaseDatabase $firebaseDatabase, Request $request)
	{
		$this->setDatabase($firebaseDatabase);

		// TODO get token through bearer
		$idTokenString = $request->bearerToken();

		$verifier = IdTokenVerifier::createWithProjectId(env('FIREBASE_PROJECT_ID'));

		try {
			$verifier->verifyIdToken($idTokenString);
		} catch (IdTokenVerificationFailed $e)
		{
			return response()->json(['error' => $e->getMessage()], 401);
		}

		try {
			$tables = $this->database->getReference('tables')
				->orderByChild('projectID')
				->equalTo($project)
				->getSnapshot()
				->getValue();

			foreach ($tables as $key => $table)
			{
				$table['id'] = $key;

				if(!empty($table["data"]))
				{
					$table["data"] = (object)$table["data"];
				}

				$this->response[] = $table;
			}

			return response()->json($this->response);

		} catch (\Exception $e) {
			return response()->json(["error_msg" => array($e->getMessage())]);
		}
	}

	/**
     * @param string $table
     * @param string $project
	 * @param FirebaseDatabase $firebaseDatabase
	 * @param Request $request
     * @return JsonResponse
	 */
	public function table(string $table, string $project, FirebaseDatabase $firebaseDatabase, Request $request)
	{
		$this->setDatabase($firebaseDatabase);

		if (empty($table))
			return response()->json(["error_msg" => "No {$table} parameters found"], 401);

		// An ID token given to your backend by a Client application
		$idTokenString = $request->bearerToken();

		$verifier = IdTokenVerifier::createWithProjectId(env('FIREBASE_PROJECT_ID'));

		try {
			$verifier->verifyIdToken($idTokenString);
		} catch (IdTokenVerificationFailed $e) {
			return response()->json(['error' => $e->getMessage()], 401);
		}

		$timestamp = $this->getTimeStamp($request);

		try {
			if (!$this->valuesToArray('tables/'. $table .'/data', $timestamp))
				return response()->json(["error_msg" => array("There is no (new) data available for table '" . $table . "'")]);
		} catch (UnsupportedQuery $e) {
			return response()->json(["error_msg" => $e->getMessage()]);
		}

		return response()->json($this->response);
	}

	/**
	 * @param $name
	 *
	 * @return JsonResponse
	 */
	public function getEditor($name)
	{
		$data = DB::table('cr_node_editor')
			->where('editor_name', '=', $name)
			->get();

		return response()->json(['data'=> $data]);
	}

	/**
	 * @param Request $request
	 */
	public function insertEditor(Request $request)
	{
		try {
			$errors = $this->validate($request, [
				'name' => 'required|unique:cr_node_editor',
				'data' => 'required'
			]);

			if(empty($errors))
			{
				$serialized = $request->get('data');

				$sql = 'INSERT INTO `cr_node_editor`(`editor_name`, `data`, `created_at`, `updated_at`) VALUES (?, ?)';
				DB::insert($sql, [$request->get('name'), $serialized]);
			}

		} catch (ValidationException $e) {
		}

		$user = User::create($request->all());
	}

	/** QA Data queries **/

	/**
	 * @brief -
	 * @param Request $request
	 * @return JsonResponse
	 */
	public function qaGet(Request $request)
	{
//		try {
//			$errors = $this->validate($request, [
//				'name' => 'required|unique:cr_node_editor',
//				'data' => 'required'
//			]);

//			if (empty($errors)) {
				$serialized = $request->get('data');

//				$sql = 'SELECT * FROM `cr_qa_data` WHERE id_qa = 0';
//				$arr = DB::select($sql); // , [$request->get('name'), $serialized]);
//				dd($arr);
//			}
//		}

		$this->response['tablename'][] = array("column_name" => "data");

		return response()->json($this->response);
	}

	/**
	 * @param FirebaseDatabase $firebaseDatabase
	 */
	private function setDatabase(FirebaseDatabase $firebaseDatabase)
	{
		$this->database = $firebaseDatabase;
		$this->response = [];
	}

	/**
	 * @return FirebaseDatabase\Reference
	 */
	private function getRootReference()
	{
		return $this->database->getReference();
	}

	/**
	 * @param Request $request
	 * @return int
	 */
	private function getTimeStamp(Request $request)
	{
		return intval($request->get("tstamp", 0));
	}

	/**
	 * @param string $reference
	 * @param int $timestamp
	 * @return FirebaseDatabase\Snapshot
	 * @throws UnsupportedQuery
	 */
	private function getValues(string $reference, int $timestamp = 0)
	{
		return
			$this->
			database->
			getReference($reference)->
			orderByChild('updated_at')->
			startAt($timestamp)->
			getSnapshot();
	}

	/**
	 * @param string $reference
	 * @param int $timestamp
	 * @return bool
	 * @throws UnsupportedQuery
	 */
	private function valuesToArray(string $reference, int $timestamp = 0)
	{
		$snapshot = $this->getValues($reference, $timestamp);

		$arr = $snapshot->getValue();

		if ($snapshot->exists() && !empty($arr))
		{
			$this->response = $arr;
			return true;
		}

		return false;
	}
}
