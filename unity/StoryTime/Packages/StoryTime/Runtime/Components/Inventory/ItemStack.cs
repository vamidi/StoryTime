using System;
using UnityEngine;

namespace DatabaseSync.Components
{
	[Serializable]
	public class ItemStack
	{
		[SerializeField] private ItemSO item;
		[SerializeField] private int amount;
		public ItemSO Item => item;

		public int Amount { get => amount; set => amount = value; }

		public ItemStack()
		{
			item = null;
			amount = 0;
		}

		public ItemStack(ItemSO item, int amount)
		{
			this.item = item;
			this.amount = amount;
		}
	}
}
