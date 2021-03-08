using System.Collections;
using UnityEngine;
using UnityEngine.AI;

namespace Gamekit3D
{
	[System.Serializable]
	public class Spawn
	{
		public GameObject prefab;
		public float weight;
	}

	public class CombatDirector : MonoBehaviour
	{
		[Header("Objects to Spawn")] [SerializeField]
		Spawn[] spawns = default;

		[Header("Spawner Area")] [SerializeField]
		Vector2 levelBounds = Vector2.one;

		IEnumerator Start()
		{
			SpawnPrefabs(10);
			while (true)
			{
				yield return new WaitForSeconds(5);
				SpawnPrefab();
			}
		}

		void SpawnPrefabs(int num)
		{
			for (int i = 0; i < num; i++)
			{
				SpawnPrefab();
			}
		}

		void SpawnPrefab()
		{
			Vector3 origin = new Vector3(Random.Range(-levelBounds.x, levelBounds.x), 0,
				Random.Range(-levelBounds.y, levelBounds.y));
			if (RandomPoint(origin, 10, out Vector3 point))
			{
				float level = 1 + ((1 + ((Time.time / 60) * 0.046f)) - 1) / 0.33f;
				level = Mathf.Min(level, 1);

				Spawn spawn = GetRandomSpawn();
				if (spawn != null)
				{
					GameObject enemy = Instantiate(spawn.prefab, point, Quaternion.identity, transform);
					Damageable damageable = enemy.GetComponent<Damageable>();
					damageable.maxHitPoints = Mathf.RoundToInt(level);
					damageable.ResetDamage();
				}
			}
		}

		bool RandomPoint(Vector3 center, float range, out Vector3 result)
		{
			for (int i = 0; i < 30; i++)
			{
				Vector3 randomPoint = center + Random.insideUnitSphere * 10;
				NavMeshHit hit;
				if (NavMesh.SamplePosition(randomPoint, out hit, 1.0f, NavMesh.AllAreas))
				{
					result = hit.position;
					return true;
				}
			}

			result = Vector3.zero;
			return false;
		}

		Spawn GetRandomSpawn()
		{
			float sum = 0;
			float randomWeight = 0;
			foreach (Spawn spawn in spawns)
			{
				sum += spawn.weight;
			}

			do
			{
				if (sum == 0)
					return null;
				randomWeight = Random.Range(0, sum);
			} while (randomWeight == sum);

			foreach (Spawn spawn in spawns)
			{
				if (randomWeight < spawn.weight)
					return spawn;
				randomWeight -= spawn.weight;
			}

			return null;
		}
	}
}
