using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Quests/NPC Channel")]
	public class NpcChannelSO : ScriptableObject
	{
		public UnityAction<Components.NonPlayableActorSO> OnEventRaised;
		public void RaiseEvent(Components.NonPlayableActorSO nonPlayableActorSo)
		{
			OnEventRaised?.Invoke(nonPlayableActorSo);
		}
	}
}
