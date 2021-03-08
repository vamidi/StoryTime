using UnityEngine;

using TMPro;

namespace DatabaseSync.UI
{
	public class UIInteractionItemFiller : BaseUIInteractionItemFiller<InteractionItemSO>
	{
		public override void FillInteractionPanel(InteractionItemSO interactionItem)
		{
			base.FillInteractionPanel(interactionItem);

			// TODO add ui for pickup up items.
			// TODO add new for items that we dont have.
		}
	}
}
