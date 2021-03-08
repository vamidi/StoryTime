using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync
{
	public enum TabType
	{
		None,
		Customization,
		CookingItem,
		Recipe,
	}
	[CreateAssetMenu(fileName = "TabType", menuName = "DatabaseSync/Inventory/TabType", order = 51)]
	public class InventoryTabType : ScriptableObject
	{
		[Tooltip("The tab Name that will be displayed in the inventory")]
		[SerializeField]
		private string tabName = default;

		[Tooltip("The tab type used to reference the item")]
		[SerializeField] private TabType tabType = default;

		public string TabName => tabName;
		public TabType TabType => tabType;
	}
}
