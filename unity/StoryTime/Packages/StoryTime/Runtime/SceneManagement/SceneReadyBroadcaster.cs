﻿using UnityEngine;

namespace DatabaseSync.Events
{
	/// <summary>
	/// This class manages the case we are in editor and we want to press play from any scene
	/// It takes care of telling the SpawnSystem that the scene is ready since we pressed play from it
	/// and it is therefore already loaded
	/// </summary>
	public class SceneReadyBroadcaster : MonoBehaviour
	{
#if UNITY_EDITOR
		[Header("Broadcasting on")]
		[SerializeField] private VoidEventChannelSO onSceneReady = default;

		private void Start()
		{
			if (GetComponent<EditorInitialisationLoader>().isEditorInitializerMode)
			{
				onSceneReady.RaiseEvent();
			}
		}
#endif
	}
}
