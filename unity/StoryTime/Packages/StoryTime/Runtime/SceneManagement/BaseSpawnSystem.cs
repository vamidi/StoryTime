using System;
using System.Linq;

using UnityEngine;

namespace DatabaseSync
{
	using Events;
	/// <summary>
	/// BaseSpawnSystem listens to the scene ready channel to see if the scene is loaded
	/// when the scene is loaded it calls the function to let the
	/// </summary>
	public abstract class BaseSpawnSystem : MonoBehaviour
	{
		[Header("Settings")]
		[SerializeField] protected int defaultSpawnIndex;
		[SerializeField] private PathAnchor pathTaken;

		[Header("Scene Ready Event")]
		[SerializeField] protected VoidEventChannelSO onSceneReady; //Raised when the scene is loaded and set active

		[Header("Scene References")]
		protected Transform[] m_SpawnLocations;

		protected void OnEnable()
		{
			if (onSceneReady != null)
			{
				onSceneReady.OnEventRaised += SpawnPlayer;
			}
		}

		protected void OnDisable()
		{
			if (onSceneReady != null)
			{
				onSceneReady.OnEventRaised -= SpawnPlayer;
			}
		}

		protected void SpawnPlayer()
		{
			GameObject[] spawnLocationsGO = GameObject.FindGameObjectsWithTag("SpawnLocation");
			m_SpawnLocations = new Transform[spawnLocationsGO.Length];
			for (int i = 0; i < spawnLocationsGO.Length; ++i)
			{
				m_SpawnLocations[i] = spawnLocationsGO[i].transform;
			}

			// ReSharper disable once Unity.NoNullPropagation
			// ReSharper disable once Unity.NoNullCoalescing
			Spawn(FindSpawnIndex(pathTaken?.Path));
		}

		protected abstract void Spawn(int spawnIndex);

		private void Reset()
		{
			AutoFill();
		}

		/// <summary>
		/// This function tries to autofill some of the parameters of the component, so it's easy to drop in a new scene
		/// </summary>
		[ContextMenu("Attempt Auto Fill")]
		private void AutoFill()
		{
			if (m_SpawnLocations == null || m_SpawnLocations.Length == 0)
				m_SpawnLocations = transform.GetComponentsInChildren<Transform>(true)
					.Where(t => t != /* this. */transform)
					.ToArray();
		}

		private int FindSpawnIndex(PathSO pathSoTaken)
		{
			if (pathTaken == null)
				return defaultSpawnIndex;

			int index = Array.FindIndex(m_SpawnLocations, element =>
				// ReSharper disable once Unity.NoNullPropagation
				element?.GetComponent<LocationEntrance>()?.EntrancePath == pathSoTaken
			);

			return (index < 0) ? defaultSpawnIndex : index;
		}
	}
}
