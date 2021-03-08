using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;

namespace DatabaseSync.UI
{
    static class Resources
    {
	    const string m_ResourceRoot = "Packages/com.unity.vamidicreations.storytime/Editor/Resources";
        const string m_TemplateRoot = "Packages/com.unity.vamidicreations.storytime/Editor/UI/Templates";
        const string m_StyleRoot = "Packages/com.unity.vamidicreations.storytime/Editor/UI/Styles";

        public static string GetStyleSheetPath(string filename) => $"{m_StyleRoot}/{filename}.uss";

        public static string GetResourcePath(string filename) => $"{m_ResourceRoot}/{filename}.asset";

        static string TemplatePath(string filename) => $"{m_TemplateRoot}/{filename}.uxml";

        public static VisualTreeAsset GetTemplateAsset(string templateFilename)
        {
            var path = TemplatePath(templateFilename);

            var asset = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(path);

            if (asset == null)
                throw new FileNotFoundException("Failed to load UI Template at path " + path);
            return asset;
        }

        public static VisualElement GetTemplate(string templateFilename)
        {
            return GetTemplateAsset(templateFilename).CloneTree();
        }

        public static StyleSheet GetStyleAsset(string styleFileName)
        {
	        var path = GetStyleSheetPath(styleFileName);

	         var asset = AssetDatabase.LoadAssetAtPath<StyleSheet>(path);

	        if (asset == null)
		        throw new FileNotFoundException("Failed to load UI Styles at path " + path);
	        return asset;
        }

        public static Object GetObject(string objectFilename)
        {
	        var path = GetResourcePath(objectFilename);

	        var asset = AssetDatabase.LoadAssetAtPath<Object>(path);

	        if (asset == null)
		        throw new FileNotFoundException("Failed to load UI Template at path " + path);
	        return asset;
        }
    }
}
