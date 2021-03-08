using System.IO;
using UnityEditor;
using UnityEngine;

namespace DatabaseSync
{
    public class EditorIcons
    {
        const string k_IconRoot = "Packages/com.unity.localization/Editor/Icons";

        public static GUIContent LocalizationSettings { get; private set; }
        public static GUIContent AssetTable { get; private set; }
        public static GUIContent StringTable { get; private set; }

        public static Texture WarningIcon { get; private set; }

        public static Texture ScriptableObjectIcon { get; private set; }

        static EditorIcons()
        {
            LocalizationSettings = new GUIContent(AssetDatabase.LoadAssetAtPath<Texture>(Path.Combine(k_IconRoot, "Localization Icon.png")));
            AssetTable = new GUIContent(AssetDatabase.LoadAssetAtPath<Texture>(Path.Combine(k_IconRoot, "Localization_AssetTable.png")));
            StringTable = new GUIContent(AssetDatabase.LoadAssetAtPath<Texture>(Path.Combine(k_IconRoot, "Localization_StringTable.png")));

            WarningIcon = EditorGUIUtility.IconContent("console.warnicon").image;
            ScriptableObjectIcon = EditorGUIUtility.IconContent("d_ScriptableObject Icon").image;
        }
    }
}
