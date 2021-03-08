using UnityEngine;

namespace DatabaseSync.Components
{
	public class CollectibleItem : MonoBehaviour
	{
		[SerializeField] private ItemStack currentItem;

		public virtual void PickedItem() { }

		public ItemStack GetItem()
		{
			return currentItem;
		}

		public void SetItem(ItemSO item, int amount)
		{
			currentItem = new ItemStack(item, amount);
		}
	}
}
