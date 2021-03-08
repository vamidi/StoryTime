using UnityEngine;

namespace DatabaseSync
{
	public enum ItemInventoryType
	{
		Recipe,
		Utensil,
		Ingredient,
		Customisation,
		Dish,

	}
	public enum ItemInventoryActionType
	{
		Cook,
		Use,
		Equip,
		DoNothing
	}

	[CreateAssetMenu(fileName = "ItemType", menuName = "DatabaseSync/Inventory/ItemType", order = 51)]
	public class ItemType : ScriptableObject
	{
		[Tooltip("The action associated with the item type")]
		[SerializeField]
		private string actionName;

		[Tooltip("The action associated with the item type")]
		[SerializeField]
		private string typeName;

		[Tooltip("The Item's background color in the UI")]
		[SerializeField] private Color typeColor = default;

		[Tooltip("The Item's type")]
		[SerializeField] private ItemInventoryType type = default;

		[Tooltip("The Item's action type")]
		[SerializeField] private ItemInventoryActionType actionType = default;

		[Tooltip("The tab type under which the item will be added")]
		[SerializeField] private InventoryTabType tabType = default;

		public string ActionName => actionName;
		public string TypeName => typeName;
		public Color TypeColor => typeColor;
		public ItemInventoryActionType ActionType => actionType;
		public ItemInventoryType Type => type;
		public InventoryTabType TabType => tabType;
	}
}
