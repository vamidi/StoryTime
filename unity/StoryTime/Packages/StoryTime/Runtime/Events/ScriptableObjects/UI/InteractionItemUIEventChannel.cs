using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Toggle Interaction Item UI Event Channel")]
	public class InteractionItemUIEventChannel : ScriptableObject
	{
		public UnityAction<bool, Components.ItemStack, InteractionType> OnEventRaised;

		/// <summary>
		///
		/// </summary>
		/// <param name="state"></param>
		/// <param name="itemInfo"></param>
		/// <param name="interactionType"></param>
		public void RaiseEvent(bool state, Components.ItemStack itemInfo, InteractionType interactionType)
			=> OnEventRaised?.Invoke(state, itemInfo, interactionType);
	}
}
