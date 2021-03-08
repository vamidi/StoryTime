using UnityEditor;
using UnityEngine;
using UnityToolbarExtender;

namespace DatabaseSync
{
	static class ToolbarStyles
	{
		public static readonly GUIStyle CommandButtonStyle;

		static ToolbarStyles()
		{
			CommandButtonStyle = new GUIStyle("Command")
			{
				fontSize = 16,
				alignment = TextAnchor.MiddleCenter,
				imagePosition = ImagePosition.ImageAbove,
				fontStyle = FontStyle.Bold
			};
		}
	}

	[InitializeOnLoad]
	public class DatabaseSyncButton
	{
		static string iconLocation = "Packages/com.unity.vamidicreations.storytime/Editor/Images/";
		static DatabaseSyncButton()
		{
			ToolbarExtender.LeftToolbarGUI.Add(OnToolbarGUI);
		}

		static void OnToolbarGUI()
		{
			GUILayout.FlexibleSpace();

			Texture content = EditorGUIUtility.isProSkin
				? (Texture) EditorGUIUtility.Load( $"{iconLocation}sync-white.png")
				: (Texture) EditorGUIUtility.Load($"{iconLocation}sync.png");

			// When we press sync to get the table data from the server.
			if(GUILayout.Button(new GUIContent(content, "Sync the Database"), ToolbarStyles.CommandButtonStyle))
			{
				DatabaseSyncModule.Get.RequestTableUpdate();
			}
		}
	}

	public class DatabaseWindow : EditorWindow
	{
		public enum PropertyFlags
		{
			Normal = (1 << 0),
			Password = (1 << 1),
		}

		private static SerializedObject _databaseConfig;
		public static readonly string FileName = "DatabaseConfig";

		public static void Open(DatabaseConfig config)
		{
			_databaseConfig = new SerializedObject(config);
		}

		public void OnEnable()
		{
			_databaseConfig = LoadConfig();
		}

		public void OnGUI()
		{
			// window
			EditorGUILayout.LabelField("Database Configurations");

			EditorGUILayout.Space(10, true);

			DrawProperty(_databaseConfig.FindProperty("email"), false);
			DrawProperty(_databaseConfig.FindProperty("password"), false, PropertyFlags.Password);

			EditorGUILayout.Space(10, true);

			if (GUILayout.Button("Save Presets", EditorStyles.boldLabel))
			{
				SaveConfig();
			}
		}

		private void DrawProperty(SerializedProperty prop, bool drawChildren, PropertyFlags flags = PropertyFlags.Normal)
		{
			if (prop.isArray && prop.propertyType == SerializedPropertyType.Generic)
			{
				EditorGUILayout.BeginHorizontal();
				prop.isExpanded = EditorGUILayout.Foldout(prop.isExpanded, prop.displayName);
				EditorGUILayout.EndHorizontal();

				if (prop.isExpanded)
				{
					EditorGUI.indentLevel++;
					DrawProperty(prop, drawChildren);
					EditorGUI.indentLevel--;
				}
			}
			else
			{
				switch (flags)
				{
					case PropertyFlags.Normal:
					default:
						EditorGUILayout.PropertyField(prop, drawChildren);
						break;
					case PropertyFlags.Password:
						EditorGUILayout.BeginHorizontal();
						EditorGUILayout.LabelField("Password");
						EditorGUILayout.PasswordField(prop.stringValue);
						EditorGUILayout.EndHorizontal();
						break;
				}

			}
		}

		private void SaveConfig()
		{
			/*
			if (_databaseConfig == null)
				return;

			var configFile = CreateInstance<DatabaseConfig>();

			configFile.Email = _databaseConfig.FindProperty("email").stringValue;
			configFile.password = _databaseConfig.FindProperty("password").stringValue;

			// If folder does not exist make one.
			if (!AssetDatabase.IsValidFolder("Assets/Resources"))
				AssetDatabase.CreateFolder("Assets", "Resources");

			if (AssetDatabase.Contains(configFile)) { AssetDatabase.DeleteAsset($"Assets/Resources/{FileName}.asset"); }

			AssetDatabase.CreateAsset(configFile, $"Assets/Resources/{FileName}.asset");
			AssetDatabase.SaveAssets();
			*/
		}

		private SerializedObject LoadConfig()
		{
			var config = Resources.Load<DatabaseConfig>(FileName);
			if (!config)
			{
				return new SerializedObject(CreateInstance<DatabaseConfig>());
			}

			return new SerializedObject(config);
		}
	}
}
