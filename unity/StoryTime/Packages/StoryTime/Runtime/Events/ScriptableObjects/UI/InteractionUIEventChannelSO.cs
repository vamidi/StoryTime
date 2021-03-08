using UnityEngine.Events;
using UnityEngine;

namespace DatabaseSync.Events
{
	/// <summary>
	/// This class is used for Events to toggle the interaction UI.
	/// Example: Display or hide the interaction UI via a bool and the interaction type from the enum via int
	/// </summary>
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Toggle Interaction UI Event Channel")]
	public class InteractionUIEventChannelSO : ScriptableObject
	{
		public UnityAction<bool, InteractionType> OnEventRaised;

		public void RaiseEvent(bool state, InteractionType interactionType)
		{
			if (OnEventRaised != null)
				OnEventRaised.Invoke(state, interactionType);
		}
	}
}

