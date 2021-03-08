using System.Collections;
using System.Collections.Generic;

using UnityEngine;
using UnityEngine.SceneManagement;

namespace DatabaseSync
{
	/// <summary>
	/// This script loads the persistent managers and gameplay Scenes, to allow to start the game from any gameplay Scene
	/// It can also be used for menu scene by just adding the persistent managers scene on the inspector
	/// </summary>
	public class EditorInitialisationLoader : MonoBehaviour
	{
#if UNITY_EDITOR
		[Header("Scenes")]
		public GameSceneSO[] scenesToLoad;

		[Header("Debugging")]
		public int targetFramerate; // For debugging purposes

		//bool to know if we are coming from editor initializer mode
		[HideInInspector] public bool isEditorInitializerMode;

		private void Start()
		{
			Application.targetFrameRate = targetFramerate; // For debugging purposes

			StopAllCoroutines();

			for (int i = 0; i < SceneManager.sceneCount; ++i)
			{
				Scene scene = SceneManager.GetSceneAt(i);
				foreach (var t in scenesToLoad)
				{
					if (scene.path == t.scenePath)
					{
						return;
					}

					// StartCoroutine(LoadScene(t.scenePath));
					LoadScene(t.scenePath);
					// Inform that we are pressing play from a location or menu
					isEditorInitializerMode = true;
				}
			}
		}

		/// <summary>
		/// The Application loads the Scene in the background as the current Scene runs.
		/// This is particularly good for creating loading screens.
		/// You could also load the Scene by using sceneBuildIndex. In this case Scene2 has
		/// a sceneBuildIndex of 1 as shown in Build Settings.
		/// </summary>
		/// <returns></returns>
		private /* IEnumerator */ void LoadScene(string scenePath)
		{
			// Start loading the scene
			AsyncOperation asyncLoadLevel = SceneManager.LoadSceneAsync(scenePath, LoadSceneMode.Additive);
			// Wait until the level finish loading
			// while (!asyncLoadLevel.isDone)
				// yield return null;
			// Wait a frame so every Awake and Start method is called
			// yield return new WaitForEndOfFrame();
		}
#endif
	}
}
