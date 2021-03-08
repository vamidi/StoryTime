using UnityEngine;

namespace DatabaseSync.Components
{
	using Binary;
	public class ItemTable : BaseTable<ItemSO>
	{
		public new static ItemSO ConvertRow(TableRow row, ItemSO scriptableObject = null)
		{
			ItemSO item = scriptableObject ? scriptableObject : ScriptableObject.CreateInstance<ItemSO>();

			if (row.Fields.Count == 0)
			{
				return item;
			}

			// public ItemType ItemType => itemType;

			foreach (var field in row.Fields)
			{
				if (field.Key.Equals("id"))
				{
					item.ID = uint.Parse(field.Value.Data);
				}

				if (field.Key.Equals("sellValue"))
				{
					item.SellValue = (double) field.Value.Data;
				}

				if (field.Key.Equals("sellable"))
				{
					item.Sellable = (bool) field.Value.Data;
				}

				if (field.Key.Equals("name"))
				{
					item.ItemName = (string) field.Value.Data;
				}

				if (field.Key.Equals("description"))
				{
					item.Description = (string) field.Value.Data;
				}

				// TODO keep reference
				// if (field.Key.Equals("itemType"))
				// {
					// item.ItemType = (uint) field.Value.Data
				// }
			}

			return item;
		}

	}
}
