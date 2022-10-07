using StoryTime.Components;
using StoryTime.Components.UI;
using UnityEngine;

public class Inventory : InventoryManager
{
	[SerializeField] private UIInventoryManager inventoryPanel;

    // Start is called before the first frame update
    void Start()
    {
	    inventoryPanel.gameObject.SetActive(true);
	    inventoryPanel.FillInventory();
    }
}
