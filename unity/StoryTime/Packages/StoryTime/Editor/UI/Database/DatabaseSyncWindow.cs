using System;
using System.Collections.Generic;

using UnityEditor;
using UnityEditor.UIElements;

using UnityEngine;
using UnityEngine.UIElements;

using TMPro;

namespace DatabaseSync.UI
{
	public class DatabaseSyncWindow : EditorWindow
    {
        // const string EditorPrefTabValueKey = "DatabaseSync-Window-Settings-Tab";
        const string EditorPrefConfigValueKey = "DatabaseSync-Window-Settings-Config";
        const string EditorPrefDialogueConfigValueKey = "DatabaseSync-Window-Dialogue-Settings-Config";
        const string WindowTitle = "DatabaseSync Settings";

        // static readonly Vector2 MinSize = new Vector2(450, 600);
        // List<ToolbarToggle> m_TabToggles;
        // List<VisualElement> m_TabPanels;
	    List<VisualElement> m_TableRows;

	    /*
	    public bool IsDocked
	    {
			get
		   {
				BindingFlags flags = BindingFlags.NonPublic | BindingFlags.Instance;
				MethodInfo method = GetType().GetProperty( "docked", flags ).GetGetMethod( true );
				return (bool)method.Invoke( this, null );
			}
	    }

        internal int SelectedTab
        {
            get => EditorPrefs.GetInt(EditorPrefTabValueKey, 0);
            set => EditorPrefs.SetInt(EditorPrefTabValueKey, value);
        }
		*/

        public static string SelectedConfig
        {
	        get => EditorPrefs.GetString(EditorPrefConfigValueKey, "");
	        private set => EditorPrefs.SetString(EditorPrefConfigValueKey, value);
        }

        public static string SelectedDialogueConfig
        {
	        get => EditorPrefs.GetString(EditorPrefDialogueConfigValueKey, "");
	        private set => EditorPrefs.SetString(EditorPrefDialogueConfigValueKey, value);
        }

        [MenuItem("Window/DatabaseSync/Global Settings")]
        public static void ShowWindow() => OpenWindow();

        public static void OpenWindow()
        {
	        var window = GetWindow<DatabaseSyncWindow>(false, WindowTitle, true);
	        window.titleContent = new GUIContent("DatabaseSync Settings", EditorIcons.LocalizationSettings.image);
	        window.Show();
        }

        void OnEnable()
        {
	        var asset = Resources.GetTemplateAsset(nameof(DatabaseSyncWindow));
	        var styles = Resources.GetStyleAsset(nameof(DatabaseSyncWindow));

	        asset.CloneTree(rootVisualElement);
	        rootVisualElement.styleSheets.Add(styles);
	        Init();
        }

        void Init()
        {
	        var root = rootVisualElement;

	        // TODO able to reset the token if users are switching to different environments.

	        /*
	        m_TabToggles = root.Query<ToolbarToggle>().ToList();
            m_TabPanels = new List<VisualElement>();
            for (int i = 0; i < m_TabToggles.Count; ++i)
            {
                var toggle = m_TabToggles[i];
                var panelName = $"{toggle.name}-panel";
                var panel = root.Q(panelName);
                Debug.Assert(panel != null, $"Could not find panel \"{panelName}\"");
                m_TabPanels.Add(panel);
                panel.style.display = SelectedTab == i ? DisplayStyle.Flex : DisplayStyle.None;
                toggle.value = SelectedTab == i;
                int idx = i;
                toggle.RegisterValueChangedCallback((chg) => TabSelected(idx));
            }
            Debug.Assert(m_TabPanels.Count == m_TabToggles.Count, "Expected the same number of tab toggle buttons and panels.");
            */

            // First get the config instance id if existing
            var field = root.Q<ObjectField>("config-field");
            field.objectType = typeof(DatabaseConfig);
            field.RegisterValueChangedCallback(OnConfigFileChanged);

            if (SelectedConfig != String.Empty)
            {
	            var configFile = AssetDatabase.LoadAssetAtPath<DatabaseConfig>(AssetDatabase.GUIDToAssetPath(SelectedConfig));
	            if (configFile)
	            {
		            field.value = configFile;
		            root.Q<VisualElement>("rowSettings").style.display = DisplayStyle.Flex;
		            root.Bind(new SerializedObject(field.value));

		            // configure the buttons
		            root.Q<Button>("btn-save").clickable.clicked += () => SaveConfig(configFile);

		            root.Q<Button>("btn-choose-path").clickable.clicked += () =>
		            {
			            var assetDirectory = EditorUtility.SaveFolderPanel("Data location", Application.dataPath, "");
			            if (string.IsNullOrEmpty(assetDirectory))
				            return;

			            configFile.dataPath = assetDirectory;
			            SaveConfig(configFile);
		            };

		            // <ui:Button label="Save Asset" name="btn-choose-path" class="unity-property-button-input"/>
	            }
            }

            // First get the dialogue config instance id if existing
            var dialogueConfigField = root.Q<ObjectField>("dialogue-config-field");
            dialogueConfigField.objectType = typeof(DialogueSettingConfig);
            dialogueConfigField.RegisterValueChangedCallback(OnDialogueFileChanged);

            var fontField = root.Q<ObjectField>("dialogue-font-field");
            fontField.objectType = typeof(TMP_FontAsset);

            if (SelectedDialogueConfig != String.Empty)
            {
	            var dialogueConfigFile = AssetDatabase.LoadAssetAtPath<DialogueSettingConfig>(AssetDatabase.GUIDToAssetPath(SelectedDialogueConfig));
	            if (dialogueConfigFile)
	            {
		            dialogueConfigField.value = dialogueConfigFile;
		            root.Q<VisualElement>("dialogueSettings").style.display = DisplayStyle.Flex;
		            root.Bind(new SerializedObject(dialogueConfigField.value));
	            }
            }
        }

        /*
        void TabSelected(int idx)
        {
            if (SelectedTab == idx)
                return;

            m_TabToggles[SelectedTab].SetValueWithoutNotify(false);
            m_TabPanels[SelectedTab].style.display = DisplayStyle.None;

            m_TabToggles[idx].SetValueWithoutNotify(true);
            m_TabPanels[idx].style.display = DisplayStyle.Flex;

            SelectedTab = idx;
        }

        public void AddItemsToMenu(GenericMenu menu)
        {
            // menu.AddItem(new GUIContent("Import/XLIFF Directory"), false, Plugins.XLIFF.MenuItems.ImportXliffDirectory);

            // int idx = m_TabPanels.FindIndex(p => p is EditAssetTables);

            // var panel = m_TabPanels[idx] as EditAssetTables;
            // if (SelectedTab != idx)
                // return;

            // var selectedCollection = panel.SelectedCollection as StringTableCollection;
            // if (selectedCollection != null)
            // {
                // menu.AddItem(new GUIContent("Import/XLIFF File"), false, () => Plugins.XLIFF.MenuItems.ImportIntoCollection(new MenuCommand(selectedCollection)));
                // menu.AddItem(new GUIContent("Import/CSV File"), false, () => Plugins.CSV.MenuItems.ImportCollection(new MenuCommand(selectedCollection)));
                // menu.AddItem(new GUIContent("Export/XLIFF"), false, () => Plugins.XLIFF.MenuItems.ExportCollection(new MenuCommand(selectedCollection)));
                // menu.AddItem(new GUIContent("Export/CSV"), false, () => Plugins.CSV.MenuItems.ExportCollection(new MenuCommand(selectedCollection)));
                // menu.AddItem(new GUIContent("Export/CSV(With Comments)"), false, () => Plugins.CSV.MenuItems.ExportCollectionWithComments(new MenuCommand(selectedCollection)));
            // }
        }
        */

        void OnConfigFileChanged(ChangeEvent<UnityEngine.Object> evt)
        {
	        var config = evt.newValue as DatabaseConfig;
	        if (config != null)
	        {
		        // then get the config file is selected
		        rootVisualElement.Q<VisualElement>("rowSettings").style.display = DisplayStyle.Flex;
		        rootVisualElement.Bind(new SerializedObject(config));
		        SelectedConfig = AssetDatabase.AssetPathToGUID(AssetDatabase.GetAssetPath(config));
	        }
	        else
	        {
		        rootVisualElement.Q<VisualElement>("rowSettings").style.display = DisplayStyle.None;
		        SelectedConfig = "";
	        }
        }

        void OnDialogueFileChanged(ChangeEvent<UnityEngine.Object> evt)
        {
	        var config = evt.newValue as DialogueSettingConfig;
	        if (config != null)
	        {
		        // then get the config file is selected
		        rootVisualElement.Q<VisualElement>("dialogueSettings").style.display = DisplayStyle.Flex;
		        rootVisualElement.Bind(new SerializedObject(config));
		        SelectedDialogueConfig = AssetDatabase.AssetPathToGUID(AssetDatabase.GetAssetPath(config));
	        }
	        else
	        {
		        rootVisualElement.Q<VisualElement>("dialogueSettings").style.display = DisplayStyle.None;
		        SelectedDialogueConfig = "";
	        }
        }

        void SaveConfig(DatabaseConfig configFile)
        {
	        Debug.Log("Saving Database Config file");
	        EditorUtility.SetDirty(configFile);
	        AssetDatabase.SaveAssets();
        }
    }
}
