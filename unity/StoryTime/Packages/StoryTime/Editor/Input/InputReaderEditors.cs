using UnityEditor;
using UnityEngine;

namespace DatabaseSync.Input
{
	[CustomEditor(typeof(InputReader))]
	public class InputReaderEditor : Editor
	{
		public override void OnInspectorGUI()
		{
			DrawDefaultInspector();

			if (!Application.isPlaying)
				return;

			ScriptableObjectHelper.GenerateButtonsForEvents<InputReader>(target);
		}
	}
}
