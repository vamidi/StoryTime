using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.UI
{
	using Components;
	using Events;

	public class UIDialogueManager : MonoBehaviour
	{
		[SerializeField]
		DBLocalizeStringEvent sentence;

		[SerializeField]
		DBLocalizeStringEvent actorName;

		[SerializeField]
		private UIDialogueChoicesManager choicesManager;

		[SerializeField]
		private DialogueChoiceChannelSO showChoicesEvent;

		[SerializeField]
		private VoidEventChannelSO hideChoicesEvent;

		private void Start()
		{
			if (showChoicesEvent != null)
				showChoicesEvent.OnChoicesEventRaised += ShowChoices;

			if(hideChoicesEvent != null)
				hideChoicesEvent.OnEventRaised += HideChoices;

			HideChoices();
		}

		public void SetDialogue(IDialogueLine dialogueLine, ActorSO actor)
		{
			// TODO see class LocalizeStringEvent for the reference variables
			sentence.StringReference = dialogueLine.Sentence;
			actorName.StringReference = actor.ActorName;
		}

		void ShowChoices(List<DialogueChoiceSO> choices)
		{
			choicesManager.gameObject.SetActive(true);
			choicesManager.FillChoices(choices);
		}
		void HideChoices()
		{
			choicesManager.gameObject.SetActive(false);
		}
	}
}
