using UnityEngine;
using TMPro;

namespace DatabaseSync.UI
{
	public class UIInteractionStoryFiller : BaseUIInteractionItemFiller<InteractionStorySO>
	{
		[SerializeField] TextMeshProUGUI interactionQuestTitle;

		[SerializeField] TextMeshProUGUI interactionQuestState;

		[SerializeField] TextMeshProUGUI interactionTaskDescription;

		public override void FillInteractionPanel(InteractionStorySO interactionItem)
		{
			base.FillInteractionPanel(interactionItem);

			interactionQuestTitle.text = interactionItem.interactionStoryTitle;
			interactionQuestState.text = interactionItem.interactionStoryState;
			interactionTaskDescription.text = interactionItem.interactionTaskDescription;

			// show the text if the quest is not completed
			interactionTaskDescription.gameObject.SetActive(!interactionQuestState.text.Contains("Completed"));
		}
	}
}
