using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	public struct StoryInfo
	{
		public Components.StorySO Story;
		public int Index;
		public StoryState State;
	}

	/// <summary>
	/// This class is used for Events to toggle the interaction UI.
	/// Example: Display or hide the interaction UI via a bool and the interaction type from the enum via int
	/// </summary>
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Toggle Interaction Story UI Event Channel")]
	public class InteractionStoryUIEventChannel : ScriptableObject
	{
		public UnityAction<bool, StoryInfo, InteractionType> OnEventRaised;

		/// <summary>
		///
		/// </summary>
		/// <param name="state"></param>
		/// <param name="questInfo"></param>
		/// <param name="interactionType"></param>
		public void RaiseEvent(bool state, StoryInfo questInfo, InteractionType interactionType)
			=> OnEventRaised?.Invoke(state, questInfo, interactionType);
	}
}
