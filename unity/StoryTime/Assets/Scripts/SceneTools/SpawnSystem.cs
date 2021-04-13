using System;
using UnityEngine;
using UnityEngine.Rendering;

using Cinemachine;
using Gamekit3D;

using DatabaseSync;

/// <summary>
/// @brief - Spawn system that spawns the player in the world.
/// It inherits from BaseSpawnSystem that listens if the scene is loaded.
/// </summary>
public class SpawnSystem : BaseSpawnSystem
{
	[Header("Asset References")]
	[SerializeField] private PlayerController playerPrefab;
	[SerializeField] private TransformAnchor playerTransformAnchor;

	[Header("Player Settings")]
	[SerializeField] private CinemachineFreeLook gameCamera;				// Reference to the game camera.
	[SerializeField] private CinemachineVirtualCamera aimCamera;            // Reference to the aim camera.
	[SerializeField] private CinemachineVirtualCamera dialogueCamera;       // Reference to the dialogue camera.
	[SerializeField] private Volume dashVolume;

	[SerializeField] private HealthUI playerHealth;

	protected override void Spawn(int spawnIndex)
	{
		Transform spawnLocation = GetSpawnLocation(spawnIndex, m_SpawnLocations);
		PlayerController playerInstance = InstantiatePlayer(playerPrefab, spawnLocation);

		// Catch the player transform
		Transform playerTransform = playerInstance.transform;

		// Set the game camera variable.
		playerInstance.gameCamera = gameCamera;
		playerInstance.aimCamera = aimCamera;

		playerHealth.representedDamageable = playerInstance.GetComponent<Damageable>();

		// Grab the dash ability to set the game cam and volume.
		DashAbility dashAbility = playerInstance.GetComponent<DashAbility>();
		if (dashAbility != null)
		{
			dashAbility.originalCam = gameCamera;
			dashAbility.dashVolume = dashVolume;
		}

		// set the camera to look at the right target
		gameCamera.Follow = playerTransform;
		gameCamera.LookAt = playerTransform;

		aimCamera.Follow = playerInstance.headTarget;

		// The CameraSystem will pick this up to frame the player
		playerTransformAnchor.Transform = playerTransform;
	}

	private Transform GetSpawnLocation(int index, Transform[] spawnLocations)
	{
		if (spawnLocations == null || spawnLocations.Length == 0)
			throw new Exception("No spawn locations set.");

		index = Mathf.Clamp(index, 0, spawnLocations.Length - 1);
		return spawnLocations[index];
	}

	private PlayerController InstantiatePlayer(PlayerController playerControllerPrefab, Transform spawnLocation)
	{
		if (playerPrefab == null)
			throw new Exception("Player Prefab can't be null.");

		PlayerController playerInstance = Instantiate(playerControllerPrefab, spawnLocation.position, spawnLocation.rotation);

		return playerInstance;
	}
}
