using System;
using System.Collections.Generic;
using System.IO;

using UnityEditor;
using UnityEngine;

using UnityEngine.Networking;

using Newtonsoft.Json.Linq;

namespace DatabaseSync
{
	using Database;
	using Binary;
	using UI;

	[Serializable]
	class DatabaseToken
	{
		[SerializeField]
		// ReSharper disable once InconsistentNaming
		public string token_type = "";

		[SerializeField]
		// ReSharper disable once InconsistentNaming
		public string access_token = "";

		[SerializeField]
		// ReSharper disable once InconsistentNaming
		public string id_token = "";

		[SerializeField]
		// ReSharper disable once InconsistentNaming
		public string refresh_token = "";

		[SerializeField]
		// ReSharper disable once InconsistentNaming
		public int expires_in = -1;

		[SerializeField]
		// ReSharper disable once InconsistentNaming
		public long expire_time;
	}

	public class DatabaseSyncModule
	{
		private static readonly string s_DataPath = "Packages/com.unity.vamidicreations.storytime";

		private static readonly string FirebaseAppFile;

		// ReSharper disable once InconsistentNaming
		private static DatabaseToken DATABASE_TOKEN = new DatabaseToken();

		public static event EventHandler FetchCompleted;

		private Int64 _lastTimeStamp;
		private bool _canFetch = true;

		// Check to see if we're about to be destroyed.
		// private static bool m_ShuttingDown = false;
		// private static object m_Lock = new object();
		private static DatabaseSyncModule s_Instance;

		/// <summary>
		/// Access singleton instance through this propriety.
		/// </summary>
		public static DatabaseSyncModule Get => new DatabaseSyncModule();

		static DatabaseSyncModule()
		{
			Debug.Log("Starting module");

			// TODO this file should already exist to override it in order projects.
			FirebaseAppFile = $"{s_DataPath}/firebase-storytime-app.json";

			// First retrieve the file
			RetrieveAppFile();

			// When we retrieved the file check if the user is already logged in
			CheckLogin(() => { });
		}

		/// <summary>
		/// Check if the user is logged in
		/// </summary>
		private static void RetrieveAppFile()
		{
			if (!File.Exists(FirebaseAppFile))
			{
				Debug.Log("Creating Firebase-storytime-app.json");
				return;
			}

			// TODO read file from disk to get the token.
			//Read the text from directly from the test.txt file
			StreamReader reader = new StreamReader(FirebaseAppFile);
			string jsonString = reader.ReadToEnd();
			reader.Close();
			try
			{
				DATABASE_TOKEN = JsonUtility.FromJson<DatabaseToken>(jsonString);
			}
			catch (ArgumentNullException e)
			{
				Debug.Log(e.Message);
			}
		}

		private static void CheckLogin(Action callback)
		{
			// See if the token is there, if not login
			if (string.IsNullOrEmpty(DATABASE_TOKEN.id_token))
			{
				// Login if everything is empty
				Login(callback);
				return;
			}

			// see if the token is expired
			// if the time is lower that means we are expired
			// Debug.Log(DATABASE_TOKEN.expire_time < DateTime.Now.Ticks);
			if (DATABASE_TOKEN.expire_time < DateTime.Now.Ticks)
			{
				DatabaseConfig configFile = Fetch();

				UnityWebRequest wr = UnityWebRequest.Get(configFile.DatabaseURL + "me");

				wr.timeout = 60;
				wr.SetRequestHeader("User-Agent", "X-Unity3D-Agent");
				wr.SetRequestHeader("Content-Type", "application/json; charset=utf-8");
				wr.SetRequestHeader("Authorization", "Bearer " + DATABASE_TOKEN.id_token);

				wr.SendWebRequest().completed += operation =>
				{
					if (wr.responseCode == 401)
					{
						// Log the user in again
						Refresh(callback);
					}
				};

				return;
			}

			// We can call the callback immediately
			callback();
		}

		// First try to login
		private static void Login(Action callback)
		{
			DatabaseConfig configFile = Fetch();

			if (string.IsNullOrEmpty(configFile.Email) || string.IsNullOrEmpty(configFile.Password))
			{
				Debug.Log("Database configuration are not configured!");
				return;
			}

			Debug.Log("Login in to retrieve token");

			var form = new Dictionary<string, string>
			{
				{ "email", configFile.Email },
				{ "password", configFile.Password }
			};

			UnityWebRequest wr = UnityWebRequest.Post($"{configFile.DatabaseURL}authenticate", form);

			wr.timeout = 60;
			wr.SetRequestHeader("User-Agent", "X-Unity3D-Agent");
			wr.SetRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			wr.SendWebRequest().completed += operation =>
			{
				if (wr.isNetworkError || wr.responseCode == 401 || wr.responseCode == 500)
					throw new ArgumentException("Error: ", wr.error);

				// Handle result
				string str = wr.downloadHandler.text;

				try
				{
					DATABASE_TOKEN = JsonUtility.FromJson<DatabaseToken>(str);
					// add the 3600 seconds for the next iteration
					var exp = DateTime.Now;
					exp = exp.AddSeconds(DATABASE_TOKEN.expires_in);
					DATABASE_TOKEN.expire_time += exp.Ticks;
					File.WriteAllText(FirebaseAppFile, JsonUtility.ToJson(DATABASE_TOKEN));
					Debug.Log(FirebaseAppFile);
				}
				catch (ArgumentNullException e)
				{
					throw new ArgumentException(e.Message);
				}

				callback();
			};
		}

		private static void Refresh(Action callback)
		{
			DatabaseConfig configFile = Fetch();

			if (string.IsNullOrEmpty(configFile.Email) || string.IsNullOrEmpty(configFile.Password))
			{
				Debug.Log("Database configuration are not configured!");
				return;
			}

			UnityWebRequest wr = UnityWebRequest.Get($"{configFile.DatabaseURL}refresh");

			wr.timeout = 60;
			wr.SetRequestHeader("User-Agent", "X-Unity3D-Agent");
			wr.SetRequestHeader("Content-Type", "application/json; charset=utf-8");
			wr.SetRequestHeader("Authorization", "Bearer " + DATABASE_TOKEN.refresh_token);
			wr.SendWebRequest().completed += operation =>
			{
				if (wr.isNetworkError || wr.responseCode == 401 || wr.responseCode == 500)
				{
					Debug.Log("Error: " + wr.error);
					return;
				}

				// Handle result
				string str = wr.downloadHandler.text;
				try
				{
					DATABASE_TOKEN = JsonUtility.FromJson<DatabaseToken>(str);
					// add the 3600 seconds for the next iteration
					var exp = DateTime.Now;
					exp = exp.AddSeconds(DATABASE_TOKEN.expires_in);
					DATABASE_TOKEN.expire_time += exp.Ticks;
					File.WriteAllText(FirebaseAppFile, JsonUtility.ToJson(DATABASE_TOKEN));
				}
				catch (ArgumentNullException e)
				{
					Debug.Log(e.Message);
				}

				callback();
			};
		}

		/// <summary>
		/// Request data from Firebase.
		/// This methods allows the user to fetch all tables or a single table
		/// from the Firebase database
		/// </summary>
		/// <param name="tableID"></param>
		public void RequestTableUpdate(string tableID = "")
		{
			// Wait few seconds before we let the user click again.
			if (!_canFetch)
			{
				EditorUtility.DisplayDialog("Please wait", "We are already processing data from server!", "OK");
				return;
			}

			_canFetch = false;

			// This is the url on which to process the request
			// TODO make timestamp work
			// string page = string.IsNullOrEmpty(table) ? "?tstamp=" : "tables/" + table + "?tstamp=";
			// check if we are logged in and then fetch data
			CheckLogin(() =>
			{
				DatabaseConfig configFile = Fetch();
				UnityWebRequest wr = UnityWebRequest.Get($"{configFile.DatabaseURL}firebase/projects/{configFile.ProjectID}/tables/{tableID}");

				wr.timeout = 60;
				wr.SetRequestHeader("User-Agent", "X-Unity3D-Agent");
				wr.SetRequestHeader("Content-Type", "application/json; charset=utf-8");
				wr.SetRequestHeader("Authorization", "Bearer " + DATABASE_TOKEN.id_token);

				wr.SendWebRequest().completed += operation => OnResponseReceived(wr, tableID);
			});
		}

		private void OnResponseReceived(UnityWebRequest request, string tableID = "")
		{
			// FetchNotification->SetCompletionState(bWasSuccessful? SNotificationItem::CS_Success : SNotificationItem::CS_Fail);
			// FetchNotification->ExpireAndFadeout();

			if (request.isNetworkError || request.responseCode == 401 || request.responseCode == 500)
			{
				Debug.Log("Error: " + request.error);
				Debug.Log("Error: " + request.downloadHandler.text);
				_canFetch = true;
				return;
			}

			// Debug.Log("Received: " + request.downloadHandler.text);

			// Handle result
			string str = request.downloadHandler.text;
			bool hasTable = tableID != "";

			// Create a pointer to hold the json serialized data

			if (hasTable)
			{
				var jsonToken = JToken.Parse(str);

				Table tableData = jsonToken.ToObject<Table>() ?? throw new ArgumentException($"Can't make Table from JSON file");

				// Get table name and store it as individual data
				TableBinary bin = TableDatabase.Get.GetBinary(tableData.metadata.title);
				bin.Import(jsonToken);
			}
			else
			{
				var jsonArray = JArray.Parse(str);
				// now we can get the values from json of any attribute.
				foreach (var item in jsonArray.Children())
				{
					Table tableData = item.ToObject<Table>();
					if(tableData.metadata == null || tableData.metadata.title == "")
						throw new ArgumentException("Can't make Table from JSON file");

					// Get table name and store it as individual data
					TableBinary bin = TableDatabase.Get.GetBinary(tableData.metadata.title);
					bin.Import(item);
				}
			}

#if UNITY_EDITOR // TODO see if unity has notify system
				// Update editor
				// auto& PropertyModule = FModuleManager::LoadModuleChecked< FPropertyEditorModule >("PropertyEditor");
				// PropertyModule.NotifyCustomizationModuleChanged();
#endif

			// Update timestamp
			_lastTimeStamp = DateTime.Now.Ticks;
			string dir = $"{s_DataPath}/Data";
			string destination = dir + "/uptime.txt";
			File.WriteAllText(destination, _lastTimeStamp.ToString());

			Debug.Log("Invoking fetch");
			FetchCompleted?.Invoke(this, EventArgs.Empty);
			Debug.Log("Fetching complete");
			_canFetch = true;
		}

		public static DatabaseConfig Fetch()
		{
			var configFile = AssetDatabase.LoadAssetAtPath<DatabaseConfig>(AssetDatabase.GUIDToAssetPath(DatabaseSyncWindow.SelectedConfig));
			if (configFile == null)
				throw new ArgumentNullException($"{nameof(configFile)} must not be null.", nameof(configFile));

			return configFile;
		}
	}
}
