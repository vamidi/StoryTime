using UnityEngine;

namespace DatabaseSync.Components
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Quests/Task Event")]
	public class TaskEventSO : ScriptableObject
	{
		public ActorSO Actor => actor;
		public Events.TaskEventType TaskEventType => taskEventType;
		public ScriptableObject Value => value;

		[Tooltip("Actor reference")]
		[SerializeField] private ActorSO actor;

		[Tooltip("Specify the type of the event")]
		[SerializeField] private Events.TaskEventType taskEventType;

		[Tooltip("Value we want to pass")]
		[SerializeField] private ScriptableObject value;
	}
}
