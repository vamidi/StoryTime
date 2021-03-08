using UnityEngine;

namespace DatabaseSync.UI
{
	using Events;

	public class UIInteractionStoryManager : BaseUIInteractionManager<InteractionStorySO, UIInteractionStoryFiller>
	{
		private InteractionStorySO m_InteractionQuestSo;

		public void SetQuest(StoryInfo info)
		{
			if (m_InteractionQuestSo == null)
			{
				m_InteractionQuestSo = ScriptableObject.CreateInstance<InteractionStorySO>();
				m_InteractionQuestSo.InteractionName = "Press [V] to navigate";
			}

			m_InteractionQuestSo.interactionStoryState = StateToString(info.State);
			m_InteractionQuestSo.interactionStoryTitle = info.Story.Title;
			m_InteractionQuestSo.interactionTaskDescription = info.Story.Tasks[info.Index].Description;
		}

		public override void FillInteractionPanel(InteractionType interactionType)
		{
			if (interactionItem != null)
			{
				interactionItem.FillInteractionPanel(m_InteractionQuestSo);
			}
		}

		string StateToString(StoryState state)
		{
			switch (state)
			{
				case StoryState.New: return "Incoming Quest";
				case StoryState.Update: return "Quest Updated";
				case StoryState.Complete: return "Quest Completed";
			}

			return "";
		}
	}
}
