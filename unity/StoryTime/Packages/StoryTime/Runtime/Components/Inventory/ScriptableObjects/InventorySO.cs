using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Components
{
	// Created with collaboration from:
	// https://forum.unity.com/threads/inventory-system.980646/
	[CreateAssetMenu(fileName = "Inventory", menuName = "DatabaseSync/Inventory/Inventory", order = 51)]
	// ReSharper disable once InconsistentNaming
	public class InventorySO : ScriptableObject
	{
		[Tooltip("The collection of items and their quantities.")]
		[SerializeField] private List<ItemStack> items = new List<ItemStack>();

		public List<ItemStack> Items => items;

		public void Add(ItemSO item, int count = 1)
		{
			if (count <= 0)
				return;

			foreach (var currentItemStack in items)
			{
				if (item == currentItemStack.Item)
				{
					// only add to the amount if the item is usable
					if (currentItemStack.Item.ItemType.ActionType == ItemInventoryActionType.Use)
					{
						currentItemStack.Amount += count;
					}

					return;
				}
			}

			items.Add(new ItemStack(item, count));
		}

		public void Remove(ItemStack item, int count = 1)
		{
			if (count <= 0)
				return;

			foreach (var currentItemStack in items)
			{
				if (currentItemStack.Item == item.Item)
				{
					currentItemStack.Amount -= count;

					if (currentItemStack.Amount <= 0)
						items.Remove(currentItemStack);

					return;
				}
			}
		}

		public bool Contains(ItemSO item, int amount = 1)
		{
			foreach (var currentItemStack in items)
			{
				if (item == currentItemStack.Item && currentItemStack.Amount >= amount)
				{
					return true;
				}
			}

			return false;
		}

		public bool Contains(List<ItemStack> itemsCollected)
		{
			bool hasAllItems = false;
			foreach (var item in itemsCollected)
			{
				hasAllItems = Contains(item.Item, item.Amount);
			}

			return hasAllItems;
		}

		public ItemSO Get(uint itemID)
		{
			foreach (var currentItemStack in items)
			{
				if (itemID == currentItemStack.Item.ID)
				{
					return currentItemStack.Item;
				}
			}

			return null;
		}

		public int Count(ItemSO item)
		{
			foreach (var currentItemStack in items)
			{
				if (item == currentItemStack.Item)
				{
					return currentItemStack.Amount;
				}
			}

			return 0;
		}

		public bool[] IngredientsAvailability(List<ItemStack> ingredients)
		{

			bool[] availabilityArray = new bool[ingredients.Count];

			for (int i = 0; i < ingredients.Count; i++)
			{
				availabilityArray[i] = items.Exists(o => o.Item == ingredients[i].Item && o.Amount >= ingredients[i].Amount);
			}

			return availabilityArray;


		}

		public bool HasIngredients(List<ItemStack> ingredients)
		{
			bool hasIngredients = !ingredients.Exists(j => !items.Exists(o => o.Item == j.Item && o.Amount >= j.Amount));

			return hasIngredients;
		}
	}
}
