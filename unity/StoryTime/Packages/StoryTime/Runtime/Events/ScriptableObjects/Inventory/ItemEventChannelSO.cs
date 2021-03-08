using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Inventory/Item Event Channel")]
	public class ItemEventChannelSO : ScriptableObject
	{
		public UnityAction<Components.ItemStack> OnItemEventRaised;
		public UnityAction<List<Components.ItemStack>> OnItemsEventRaised;

		public void RaiseEvent(Components.ItemStack item) => OnItemEventRaised?.Invoke(item);

		public void RaiseEvent(List<Components.ItemStack> items) => OnItemsEventRaised?.Invoke(items);
	}
}
