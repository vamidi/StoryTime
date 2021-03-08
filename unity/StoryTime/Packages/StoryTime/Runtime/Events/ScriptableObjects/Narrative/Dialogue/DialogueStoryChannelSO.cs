using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Narrative/Dialogue Story Channel")]
	// ReSharper disable once InconsistentNaming
	public class DialogueStoryChannelSO : ScriptableObject
	{
		public UnityAction<Components.StorySO, Components.IDialogueLine> OnEventRaised;
		public void RaiseEvent(Components.StorySO story, Components.IDialogueLine dialogueLine)
		{
			OnEventRaised?.Invoke(story, dialogueLine);
		}
	}
}
