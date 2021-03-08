using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Narrative/Dialogue Event Channel")]
	// ReSharper disable once InconsistentNaming
	public class DialogueEventChannelSO : EventChannelBaseSO
	{
		// TODO maybe make a string to see where the event is coming from.
		public UnityAction<string, Object> OnEventRaised;

		public void RaiseEvent(string choiceType, Object value) => OnEventRaised?.Invoke(choiceType, value);
	}
}
