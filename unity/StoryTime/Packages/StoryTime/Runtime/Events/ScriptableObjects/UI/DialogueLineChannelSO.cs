using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/UI/Dialogue line Channel")]
	public class DialogueLineChannelSO : ScriptableObject
	{
		public UnityAction<Components.IDialogueLine, Components.ActorSO> OnEventRaised;

		/// <summary>
		///
		/// </summary>
		/// <param name="line"></param>
		/// <param name="actor"></param>
		public void RaiseEvent(Components.IDialogueLine line, Components.ActorSO actor) => OnEventRaised?.Invoke(line, actor);
	}
}
