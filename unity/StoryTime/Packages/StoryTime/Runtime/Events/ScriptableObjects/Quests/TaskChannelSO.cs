using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Quests/Task Channel")]
	// ReSharper disable once InconsistentNaming
	public class TaskChannelSO : ScriptableObject
	{
		public UnityAction<Components.TaskSO> OnEventRaised;


		/// <summary>
		///
		/// </summary>
		/// <param name="task"></param>
		public void RaiseEvent(Components.TaskSO task)
		{
			OnEventRaised?.Invoke(task);
		}
	}
}
