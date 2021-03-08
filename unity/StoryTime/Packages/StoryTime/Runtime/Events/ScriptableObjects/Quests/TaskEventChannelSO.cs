using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	public enum TaskEventType
	{
		CurrentCharacterRevision
	}

	[CreateAssetMenu(menuName = "DatabaseSync/Events/Quests/Task Event Channel")]
	public class TaskEventChannelSO : ScriptableObject
	{
		public UnityAction<TaskEventType, Object> OnEventRaised;

		public void RaiseEvent(TaskEventType type, Object value) => OnEventRaised?.Invoke(type, value);
	}
}
