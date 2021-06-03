<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use GuzzleHttp\Promise\PromiseInterface;
use GuzzleHttp\Promise\Utils;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Kreait\Firebase\Database as FirebaseDatabase;
use Kreait\Firebase\Storage as FirebaseStorage;
use Kreait\Firebase\Exception\Database\UnsupportedQuery;
use Kreait\Firebase\Exception\FirebaseException;
use Kreait\Firebase\JWT\Error\IdTokenVerificationFailed;
use Kreait\Firebase\JWT\IdTokenVerifier;
use Psr\Http\Message\StreamInterface;

class FirebaseController extends Controller
{
	/** @var FirebaseDatabase $database */
	private $database = null;

    /** @var FirebaseStorage $storage */
    private $storage = null;

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
     * @param FirebaseStorage $firebaseStorage
	 * @param Request $request
	 * @return JsonResponse
	 */
	public function tables(string $project, FirebaseDatabase $firebaseDatabase, FirebaseStorage $firebaseStorage, Request $request)
	{
        $this->setDatabase($firebaseDatabase, $firebaseStorage);

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
                    // we are dealing with the story table
                    // TODO we need to remove unnecessary data.
                    if($table["metadata"]["title"] === "stories")
                    {
                        $promises = [];

                        foreach ($table["data"] as $rowId => $row)
                        {
                            $storySnapshot = $this->database->getReference('stories')
                                ->orderByChild('storyId')
                                ->equalTo($rowId)
                                ->limitToFirst(1)
                                ->getSnapshot();

                            if($storySnapshot->exists())
                            {
                                $storyVal = $storySnapshot->getValue();
                                foreach ($storyVal as $id => $story)
                                {
                                    if (isset($story["url"]) && $story["url"] !== "")
                                    {
                                        $promise = $this->parseNodeData($story["url"], $table["data"][$rowId]);
                                        if ($promise !== null) $promises[] = $promise;
                                    } else
                                        $table["data"][$rowId]["data"] = (object)null;
                                }
                            }
                        }

                        // unwrap all promises
                        Utils::unwrap($promises);
                    }

                    $table["data"] = (object)$table["data"];

                }

                $this->response[] = $table;
            }

            return response()->json($this->response);

        } catch (\Exception $e) {
            return response()->json(["error_msg" => array($e->getMessage())]);
        } catch (\Throwable $e) {
            return response()->json(["error_msg" => array($e->getMessage())]);
        }
	}

	/**
     * @param string $table
     * @param string $project
     * @param FirebaseDatabase $firebaseDatabase
     * @param FirebaseStorage $firebaseStorage
     * @param Request $request
     * @param string $tableID
     * @return JsonResponse
	 */
    public function table(string $table, string $project, FirebaseDatabase $firebaseDatabase, FirebaseStorage $firebaseStorage, Request $request, string $tableID)
	{
        $this->setDatabase($firebaseDatabase, $firebaseStorage);

        if (empty($tableID))
            return response()->json(["error_msg" => "No {$tableID} parameters found"], 401);

        // An ID token given to your backend by a Client application
        $idTokenString = $request->bearerToken();

        $verifier = IdTokenVerifier::createWithProjectId(env('FIREBASE_PROJECT_ID'));

        try {
            $verifier->verifyIdToken($idTokenString);
        } catch (IdTokenVerificationFailed $e) {
            return response()->json(['error' => $e->getMessage()], 401);
        }

        try {

            $snapshot = $this->
            database->
            getReference('tables/'. $tableID)->
            getSnapshot();

            if (!$snapshot->exists())
                return response()->json(["error_msg" => array("There is no (new) data available for table '" . $tableID . "'")]);

            $table = $snapshot->getValue();

            $table['id'] = $tableID;

            if(!empty($table["data"]))
            {
                if($table["metadata"]["title"] === "stories")
                {
                    $promises = [];

                    foreach ($table["data"] as $rowId => $row)
                    {
                        $storySnapshot = $this->database->getReference('stories')
                            ->orderByChild('storyId')
                            ->equalTo($rowId)
                            ->limitToFirst(1)
                            ->getSnapshot();

                        if($storySnapshot->exists())
                        {
                            $storyVal = $storySnapshot->getValue();
                            foreach ($storyVal as $id => $story)
                            {
                                if (isset($story["url"]) && $story["url"] !== "")
                                {
                                    $promise = $this->parseNodeData($story["url"], $table["data"][$rowId]);
                                    if ($promise !== null) $promises[] = $promise;
                                } else
                                    $table["data"][$rowId]["data"] = (object)null;
                            }
                        }
                    }


                    // unwrap all promises
                    Utils::unwrap($promises);
                }

                $table["data"] = (object)$table["data"];
            }

            $this->response = $table;

        } catch (FirebaseException | \Throwable $e) {
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
     * @param FirebaseStorage|null $firebaseStorage
     */
    private function setDatabase(FirebaseDatabase $firebaseDatabase, FirebaseStorage $firebaseStorage = null)
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

    /**
     * @param string $url
     * @param $rowData
     * @return PromiseInterface<StreamInterface>|null
     */
    private function parseNodeData(string $url, &$rowData): ?PromiseInterface
    {
        $defaultBucket = $this->storage->getBucket();
        $reference = urldecode(current(explode('?', substr(strrchr($url, "/"), 1))));
        $object = $defaultBucket->object($reference);

        if($object->exists())
        {
            return $object->downloadAsStreamAsync()
                ->then(function (StreamInterface $data) use (&$rowData) {
                    // Remove unnecessary items
                    $contents = json_decode($data->getContents());
                    if (isset($contents->nodes)) {
                        foreach ($contents->nodes as $nodeId => $node) {
                            unset($node->position);
                        }
                    }

                    //
                    $rowData["data"] = $contents;
                }
                );
        }

        return null;
    }
}
