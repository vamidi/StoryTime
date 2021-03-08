using UnityEditor;
using UnityEngine;

namespace DatabaseSync.UI
{
	[CustomEditor(typeof(DatabaseConfig), true)]
	public class DatabaseConfigEditor : Editor
	{
		static readonly GUIContent EditConfig = new GUIContent("Change", "Open config file in the Database settings window.");

		public override void OnInspectorGUI()
		{
			if (GUILayout.Button(EditConfig))
			{
			}
		}
	}
}
