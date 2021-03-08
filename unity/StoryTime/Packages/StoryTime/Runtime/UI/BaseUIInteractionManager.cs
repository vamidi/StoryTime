using System.Collections.Generic;

using UnityEngine;

using TMPro;

namespace DatabaseSync.UI
{
	public abstract class BaseUIInteractionManager<T, TB> : MonoBehaviour where T : InteractionSO where TB : BaseUIInteractionItemFiller<T>
	{
		[SerializeField] protected List<T> listInteractions;

		[SerializeField] protected TB interactionItem;

		public virtual void FillInteractionPanel(InteractionType interactionType)
		{
			if (listInteractions != null && interactionItem != null)
			{
				if (listInteractions.Exists(o => o.InteractionType == interactionType))
				{
					interactionItem.FillInteractionPanel(listInteractions.Find(o =>
						o.InteractionType == interactionType));
				}
			}
		}
	}

	public abstract class BaseUIInteractionItemFiller<T> : MonoBehaviour
	{
		// TODO make multi language and change it back to string reference
		[SerializeField] protected TextMeshProUGUI interactionName;

		[SerializeField] protected TextMeshProUGUI interactionKeyButton;

		public virtual void FillInteractionPanel(T interactionItem)
		{
			if (interactionItem is InteractionSO interaction)
			{
				// StringReference normally fire the update event and also updates the interaction title.
				interactionName.text /* .StringReference */ = interaction.InteractionName;
				interactionKeyButton.text = KeyCode.E.ToString(); // this keycode will be modified later on
			}
		}
	}
}
