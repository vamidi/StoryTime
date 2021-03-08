using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync
{
	using Components;
	using Events;

	public class InventoryManager : MonoBehaviour
	{
		[SerializeField] private InventorySO currentInventory;
		[SerializeField] private ItemEventChannelSO cookRecipeEvent;
		[SerializeField] private ItemEventChannelSO useItemEvent;
		[SerializeField] private ItemEventChannelSO equipItemEvent;
		[SerializeField] private ItemEventChannelSO rewardItemEvent;
		[SerializeField] private ItemEventChannelSO giveItemEvent;
		[SerializeField] private ItemEventChannelSO addItemEvent;
		[SerializeField] private ItemEventChannelSO addItemsEvent;
		[SerializeField] private ItemEventChannelSO removeItemEvent;

		private void OnEnable()
		{
			//Check if the event exists to avoid errors
			if (cookRecipeEvent != null)
			{
				cookRecipeEvent.OnItemEventRaised += CookRecipeEventRaised;
			}
			if (useItemEvent != null)
			{
				useItemEvent.OnItemEventRaised += UseItemEventRaised;
			}
			if (equipItemEvent != null)
			{
				equipItemEvent.OnItemEventRaised += EquipItemEventRaised;
			}
			if (addItemEvent != null)
			{
				addItemEvent.OnItemEventRaised += AddItem;
			}

			if (addItemsEvent != null)
			{
				addItemsEvent.OnItemsEventRaised += AddItems;
			}

			if (removeItemEvent != null)
			{
				removeItemEvent.OnItemEventRaised += RemoveItem;
			}
			if (rewardItemEvent != null)
			{
				rewardItemEvent.OnItemEventRaised += AddItem;
			}
			if (giveItemEvent != null)
			{
				giveItemEvent.OnItemEventRaised += RemoveItem;
			}
		}

		private void OnDisable()
		{
			if (cookRecipeEvent != null)
			{
				cookRecipeEvent.OnItemEventRaised -= CookRecipeEventRaised;
			}
			if (useItemEvent != null)
			{
				useItemEvent.OnItemEventRaised -= UseItemEventRaised;
			}
			if (equipItemEvent != null)
			{
				equipItemEvent.OnItemEventRaised -= EquipItemEventRaised;
			}
			if (addItemEvent != null)
			{
				addItemEvent.OnItemEventRaised -= AddItem;
			}
			if (removeItemEvent != null)
			{
				removeItemEvent.OnItemEventRaised -= RemoveItem;
			}
		}

		void AddItemWithUIUpdate(ItemSO item)
		{
			currentInventory.Add(item);
			if (currentInventory.Contains(item))
			{
				ItemStack itemToUpdate = currentInventory.Items.Find(o => o.Item == item);
				//	UIManager.Instance.UpdateInventoryScreen(itemToUpdate, false);
			}
		}

		void RemoveItemWithUIUpdate(ItemSO item)
		{
			ItemStack itemToUpdate = new ItemStack();

			if (currentInventory.Contains(item))
			{
				itemToUpdate = currentInventory.Items.Find(o => o.Item == item);
			}

			currentInventory.Remove(itemToUpdate);

			bool removeItem = currentInventory.Contains(item);
			//	UIManager.Instance.UpdateInventoryScreen(itemToUpdate, removeItem);

		}
		void AddItem(ItemStack item)
		{
			Debug.Log("Adding item to inventory");
			currentInventory.Add(item.Item, item.Amount);
		}

		void AddItems(List<ItemStack> items)
		{
			foreach (var item in items)
			{
				AddItem(item);
			}
		}

		void RemoveItem(ItemStack item)
		{
			currentInventory.Remove(item);
		}

		void CookRecipeEventRaised(ItemStack recipe)
		{

			//find recipe
			if (currentInventory.Contains(recipe.Item))
			{
				List<ItemStack> ingredients = recipe.Item.IngredientsList;
				//remove ingredients (when it's a consumable)
				if (currentInventory.HasIngredients(ingredients))
				{
					foreach (var ingredient in ingredients)
					{
						if(ingredient.Item.ItemType.ActionType == ItemInventoryActionType.Use)
							currentInventory.Remove(ingredient, ingredient.Amount);
					}

					// add dish
					currentInventory.Add(recipe.Item.ResultingDish);
				}
			}
		}

		public void UseItemEventRaised(ItemStack item)
		{
			RemoveItem(item);
		}

		public void EquipItemEventRaised(ItemStack item)
		{

		}
	}
}
