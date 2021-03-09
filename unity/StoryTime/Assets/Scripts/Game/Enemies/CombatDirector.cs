using System;

using UnityEngine;
using UnityEngine.AI;

using Random = UnityEngine.Random;

using DatabaseSync.Components;
using DatabaseSync.Events;

[Serializable]
public class Spawn
{
    public EnemyTracker prefab;
    public float weight;
}

/// <summary>
///
/// </summary>
public class CombatDirector : MonoBehaviour
{
    [Header("Objects to Spawn")]
    [SerializeField] Spawn[] spawns;

    [Header("Spawner Area")]
    [SerializeField] Vector2 levelBounds = Vector2.one;
    [SerializeField] private float range = 10f;

    [SerializeField] private TaskSO taskToListen;

    [Header("Listening to channels")]
    // Event where we should listen for incoming tasks that might involves killing monsters.
    [SerializeField] private TaskEventChannelSO startTaskEvent;

    private int m_EnemyAmount;
    private bool m_Spawn;

    void Start()
    {
	    if (startTaskEvent)
		    startTaskEvent.OnEventRaised += (task) =>
		    {
			    m_Spawn = false;
			    if (task == taskToListen)
			    {
				    m_EnemyAmount = (int) task.RequiredCount;
				    m_Spawn = true;
			    }
		    };
    }

    private void OnDrawGizmos()
    {
	    Gizmos.color = Color.yellow;
	    var position = transform.position;
	    Gizmos.DrawWireSphere(position, range);
	    Gizmos.color = Color.green;
	    Gizmos.DrawWireCube(position, new Vector3(levelBounds.x, range, levelBounds.y));
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
        Vector3 origin = new Vector3(Random.Range(-levelBounds.x, levelBounds.x), 0, Random.Range(-levelBounds.y, levelBounds.y));
        if (RandomPoint(origin, out Vector3 point))
        {
	        float level = 1 + ((1 + ((Time.time / 60) * 0.046f)) - 1) / 0.33f;
            level = Mathf.Min(level, 1);

            Spawn spawn = GetRandomSpawn();
            if (spawn != null)
            {
	            EnemyTracker enemy = Instantiate(spawn.prefab, point, Quaternion.identity, transform);
	            enemy.StartTask(taskToListen);

	            Gamekit3D.Damageable damageable = enemy.GetComponent<Gamekit3D.Damageable>();
                damageable.maxHitPoints = Mathf.RoundToInt(level);
                damageable.ResetDamage();
            }
        }
    }

    bool RandomPoint(Vector3 center, out Vector3 result)
    {
        for (int i = 0; i < 30; i++)
        {
            Vector3 randomPoint = center + Random.insideUnitSphere * 10;
            NavMeshHit hit;
            if (NavMesh.SamplePosition(randomPoint, out hit, range, NavMesh.AllAreas))
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
        float randomWeight;
        foreach (Spawn spawn in spawns)
        {
            sum += spawn.weight;
        }

        do
        {
            if (sum == 0)
                return null;

            randomWeight = Random.Range(0, sum);
        }
        while (randomWeight == sum);

        foreach (Spawn spawn in spawns)
        {
            if (randomWeight < spawn.weight)
                return spawn;

            randomWeight -= spawn.weight;
        }

        return null;
    }

    private void OnTriggerEnter(Collider other)
    {
	    // TODO you can split them up in batches if you want to.
	    if (other.CompareTag("Player") && m_Spawn)
	    {
		    SpawnPrefabs(m_EnemyAmount);
		    m_Spawn = false;
	    }
    }
}
