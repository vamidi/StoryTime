using UnityEngine;

namespace DatabaseSync.Components
{
	using Events;

	/// <summary>
	/// The enemy tracker keeps track of the current enemy.
	/// </summary>
	public class EnemyTracker : MonoBehaviour
	{
		[Tooltip("This is the reference to the enemy/enemies that we have to destroy.")]
		[SerializeField] private EnemySO enemy;

		[Header("BroadCasting on channels")]
		[SerializeField] private EnemyChannelSO enemyDestroyedEvent;

		/// <summary>
		///
		/// </summary>
		private bool m_Track;

		public void StartTask(TaskSO task)
		{
			// Keep track if the task is to defeat and
			// the we are the type of monster he needs to slay
			m_Track = task.Type == TaskCompletionType.Defeat && task.EnemyCategory == enemy.Category;
		}

		// TODO temporary
		public void OnDeath()
		{
			if (m_Track)
			{
				enemyDestroyedEvent.RaiseEvent(enemy);
			}
		}
	}
}
