using System.Collections.Generic;

using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/UI/Dialogue Choice Channel")]
	public class DialogueChoiceChannelSO : ScriptableObject
	{
		public UnityAction<Components.DialogueChoiceSO> OnChoiceEventRaised;
		public UnityAction<List<Components.DialogueChoiceSO>> OnChoicesEventRaised;

		public void RaiseEvent(Components.DialogueChoiceSO choice) => OnChoiceEventRaised?.Invoke(choice);

		public void RaiseEvent(List<Components.DialogueChoiceSO> choices) => OnChoicesEventRaised?.Invoke(choices);
	}
}
