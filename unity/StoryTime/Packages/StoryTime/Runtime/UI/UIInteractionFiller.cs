using UnityEngine;
using TMPro;

namespace DatabaseSync.UI
{
	public class UIInteractionFiller : BaseUIInteractionItemFiller<InteractionSO>
	{
		public override void FillInteractionPanel(InteractionSO interactionItem)
		{
			// StringReference normally fire the update event and also updates the interaction title.
			interactionName.text /* .StringReference */ = interactionItem.InteractionName;
			interactionKeyButton.text = KeyCode.E.ToString(); // this keycode will be modified later on
		}
	}
}
