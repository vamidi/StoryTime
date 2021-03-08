using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Quests/Enemy Channel")]
	public class EnemyChannelSO : ScriptableObject
	{
		public UnityAction<Components.EnemySO> OnEventRaised;
		public void RaiseEvent(Components.EnemySO enemySo)
		{
			OnEventRaised?.Invoke(enemySo);
		}
	}
}
