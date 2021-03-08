#if UNITY_EDITOR

using UnityEngine;
using UnityEditor;

namespace DatabaseSync
{
	// This is second part of implementation of GameSceneSO
	// This part is responsible for the editor-related functionality
	public abstract partial class GameSceneSO : ISerializationCallbackReceiver
	{
		private SceneAsset m_PrevSceneAsset;

		void ISerializationCallbackReceiver.OnBeforeSerialize()
		{
			PopulateScenePath();
		}

		void ISerializationCallbackReceiver.OnAfterDeserialize()
		{
		}

		private void OnEnable()
		{
			// In case domain was not reloaded after entering play mode
			m_PrevSceneAsset = null;
			PopulateScenePath();
		}

		private void PopulateScenePath()
		{
			if (sceneAsset != null)
			{
				// To prevent constant invocation of AssetDatabase API
				// when this SO is opened in the Inspector.
				if (m_PrevSceneAsset != sceneAsset)
				{
					m_PrevSceneAsset = sceneAsset;
					scenePath = AssetDatabase.GetAssetPath(sceneAsset);
				}
			}
			else
			{
				scenePath = string.Empty;
			}
		}
	}
}
#endif
