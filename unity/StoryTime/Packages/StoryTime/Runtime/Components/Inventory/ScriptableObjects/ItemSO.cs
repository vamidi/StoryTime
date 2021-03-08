using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Components
{
	[CreateAssetMenu(fileName = "Item", menuName = "DatabaseSync/Inventory/Item", order = 51)]
	// ReSharper disable once InconsistentNaming
	public class ItemSO : TableBehaviour
	{
		public string ItemName { get => itemName; set => itemName = value; }
		public string Description { get => description; set => description = value; }
		public bool Sellable { get => sellable; set => sellable = value; }
		public double SellValue { get => sellValue; set => sellValue = value; }
		public ItemType ItemType { get => itemType; set => itemType = value; }
		public Sprite PreviewImage => previewImage;
		public GameObject Prefab => prefab;
		public List<ItemStack> IngredientsList => ingredientsList;
		public ItemSO ResultingDish => resultingDish;

		[Tooltip("The name of the item")]
		[SerializeField] private string itemName;

		[Tooltip("A preview image for the item")]
		[SerializeField] private Sprite previewImage;

		[Tooltip("A description of the item")]
		[SerializeField] private string description;

		[Tooltip("The type of item")]
		[SerializeField] private ItemType itemType;

		[Tooltip("A prefab reference for the model of the item")]
		[SerializeField] private GameObject prefab;

		[Tooltip("If the player is able to sell this item")]
		[SerializeField] private bool sellable;

		[Tooltip("If the item is sellable, how much will it cost")]
		[SerializeField] private double sellValue;

		// Effect Primary Value
		// Effect Type Id

		// TODO add Recipe functionality
		[Tooltip("The list of the ingredients necessary to the recipe")]
		[SerializeField]
		private List<ItemStack> ingredientsList = new List<ItemStack>();

		[Tooltip("The resulting dish to the recipe")]
		[SerializeField]
		private ItemSO resultingDish;

		ItemSO(): base("items", "name") {}

	}
}
