using UnityEngine;

namespace DatabaseSync
{
	[CreateAssetMenu(menuName = "DatabaseSync/Configurations/Config File", fileName = "DatabaseConfig")]
	public class DatabaseConfig : ScriptableObject
	{
		public string DatabaseURL => databaseURL;
		public string ProjectID => projectID;
		public string Email => email;
		public string Password => password;

		[SerializeField] private string databaseURL = "";

		[SerializeField] private string projectID = "";

		[SerializeField] private string email = "";

		[SerializeField] private string password = "";

		[SerializeField] public string dataPath = "";
	}
}
