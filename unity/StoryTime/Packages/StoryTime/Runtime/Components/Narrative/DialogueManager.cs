using System;
using System.Collections;
using System.Collections.Generic;

using UnityEngine;
using Cinemachine;

namespace DatabaseSync.Components
{
	using Input;
	using Events;

	/// <summary>
	/// The Dialogue manager keeps track of the dialogue in the game.
	/// </summary>
	public class DialogueManager: MonoBehaviour
	{
		[SerializeField] private InputReader inputReader;

		private bool ReachedEndOfDialogue => m_CurrentDialogue.NextDialogue == null;

		[Header("Cameras")]
		public GameObject gameCam;
		public GameObject dialogueCam;

		[Header("Targets")]
		public CinemachineTargetGroup targetGroup;

		[Header("Listening on channels")]
		[SerializeField] private DialogueStoryChannelSO startStoryEvent;
		[SerializeField] private DialogueChoiceChannelSO makeDialogueChoiceEvent;

		[SerializeField] private TransformEventChannelSO startTransformDialogue;

		[Header("BroadCasting on channels")]
		[SerializeField] private DialogueLineChannelSO openUIDialogueEvent;
		[SerializeField] private DialogueChoiceChannelSO showChoicesUIEvent;

		// [SerializeField] private DialogueStoryChannelSO endStoryEvent;

		[SerializeField] private VoidEventChannelSO continueWithTask;
		[SerializeField] private VoidEventChannelSO closeDialogueUIEvent;
		[SerializeField] private VoidEventChannelSO closeChoiceUIEvent;

		[Tooltip("This will trigger an event when a dialogue or an option appears")]
		[SerializeField] private DialogueEventChannelSO dialogueEvent;

		[SerializeField] private TextRevealer revealer;

		private StorySO m_CurrentStory;
		private IDialogueLine m_CurrentDialogue;

		private bool _optionShown;
		private bool _interacting;
		private bool _isInputEnabled;

		void Start()
		{
			if (startStoryEvent != null)
			{
				startStoryEvent.OnEventRaised += Interact;
			}

			if (startTransformDialogue != null) // Set the target to the person we are talking to.
				startTransformDialogue.OnEventRaised += (tr) => targetGroup.m_Targets[1].target = tr;

			if(gameCam == null)
				gameCam = GameObject.FindWithTag("GameCamera");

			if(dialogueCam == null)
				dialogueCam = GameObject.FindWithTag("DialogueCamera");

			var virtualCam = dialogueCam.GetComponent<CinemachineVirtualCamera>();
			virtualCam.Follow = virtualCam.LookAt = targetGroup.transform;

			ToggleCameras(false);

			var player = GameObject.FindWithTag("Player");
			if(player)
			{
				targetGroup.m_Targets[0].target = player.transform;
			}
		}

		/// <summary>
		/// Displays DialogueData in the UI, one by one.
		/// Start interaction with the NPC
		/// </summary>
		/// <param name="dialogueDataSo"></param>
		/// <param name="dialogueLine"></param>
		public void Interact(StorySO dialogueDataSo, IDialogueLine dialogueLine)
		{
			BeginDialogueStory(dialogueDataSo);
			ShowDialogue(dialogueLine, dialogueDataSo.Actor);
			SetActiveDialogue(dialogueLine);
			ToggleCameras(true);
		}

		/// <summary>
		/// Displays a line of dialogue in the UI, by requesting it to the <c>DialogueManager</c>.
		/// This function is also called by <c>DialogueBehaviour</c> from clips on Timeline during cutscenes.
		/// </summary>
		/// <param name="dialogueLine"></param>
		/// <param name="actor"></param>
		public void ShowDialogue(IDialogueLine dialogueLine, ActorSO actor)
		{
			if (openUIDialogueEvent != null)
			{
				// send event out before the dialogue starts
				// InitEvents();
				// CallEvents(true);

				openUIDialogueEvent.RaiseEvent(dialogueLine, actor);
			}
			revealer.RevealNextParagraphAsync();

			// Call event when the dialogue begins
			if (dialogueEvent != null && dialogueLine.DialogueEvent != String.Empty)
			{
				dialogueEvent.RaiseEvent(dialogueLine.DialogueEvent, m_CurrentStory);
			}
		}

		/// <summary>
		///
		/// </summary>
		/// <param name="nextDialogueLineSo"></param>
		public void ShowNextDialogue(IDialogueLine nextDialogueLineSo)
		{
			// TODO make this work with increment only instead of setting the next dialogue.
			// increment to the next dialogue sequence
			DialogueChoiceEndAndCloseUI(true);
			ShowDialogue(nextDialogueLineSo, m_CurrentStory.Actor);
		}

		/// <summary>
		/// Prepare DialogueManager when first time displaying DialogueData.
		/// <param name="dialogueDataSo"></param>
		/// </summary>
		private void BeginDialogueStory(StorySO dialogueDataSo)
		{
			inputReader.EnableDialogueInput();
			inputReader.advanceDialogueEvent += OnAdvance;
			m_CurrentStory = dialogueDataSo;
			_isInputEnabled = false;
			StopAllCoroutines();
		}

		private void SetActiveDialogue(IDialogueLine dialogue)
		{
			m_CurrentDialogue = dialogue;
		}

		/// <summary>
		/// Show the full dialogue
		/// </summary>
		private void Skip()
		{
			// This means we are already showing text
			revealer.ShowEverythingWithoutAnimation();
		}

		/// <summary>
		/// Show the next dialogue
		/// </summary>
		private void OnAdvance()
		{
			bool hasOptions = m_CurrentDialogue.Choices.Count > 0;
			if (revealer.IsRevealing && !revealer.IsAllRevealed())
			{
				Skip();
				return;
			}

			if (hasOptions)
			{
				DisplayChoices(m_CurrentDialogue.Choices);
				return;
			}

			// Hide the option when advancing. // TODO this will be helpful for later when we use index instead of next dialogue
			DialogueChoiceEndAndCloseUI();

			if (!ReachedEndOfDialogue)
			{
				m_CurrentDialogue = m_CurrentDialogue.NextDialogue;
				// TODO grab the actor from the node editor.

				ShowDialogue(m_CurrentDialogue, m_CurrentStory.Actor);
				return;
			}

			// if we reached the end of the dialogue then close everything.
			StartCoroutine(DialogueEndedAndCloseDialogueUI());
		}

		private void DisplayChoices(List<DialogueChoiceSO> choices)
		{
			inputReader.advanceDialogueEvent -= OnAdvance;
			if (makeDialogueChoiceEvent != null)
			{
				makeDialogueChoiceEvent.OnChoiceEventRaised += MakeDialogueChoice;
			}

			if (showChoicesUIEvent != null)
			{
				showChoicesUIEvent.RaiseEvent(choices);
			}
		}

		private void MakeDialogueChoice(DialogueChoiceSO choice)
		{
			if (makeDialogueChoiceEvent != null)
			{
				makeDialogueChoiceEvent.OnChoiceEventRaised -= MakeDialogueChoice;
			}

			if (dialogueEvent != null && choice.DialogueChoiceEvent != String.Empty)
			{
				dialogueEvent.RaiseEvent(choice.DialogueChoiceEvent, m_CurrentStory);
			}
			else if (choice.ActionType == ChoiceActionType.ContinueWithTask)
			{
				if (continueWithTask != null)
					continueWithTask.RaiseEvent();
			}

			if (choice.NextDialogue != null)
			{
				ShowNextDialogue(choice.NextDialogue);
				SetActiveDialogue(choice.NextDialogue);
			}
			else
				StartCoroutine(DialogueEndedAndCloseDialogueUI());

		}

		private void DialogueChoiceEndAndCloseUI(bool resubscribe = false)
		{
			if (closeChoiceUIEvent != null)
				closeChoiceUIEvent.RaiseEvent();

			if (resubscribe)
			{
				inputReader.advanceDialogueEvent += OnAdvance;
			}
		}

		private IEnumerator DialogueEndedAndCloseDialogueUI()
		{
			if (_isInputEnabled) yield break;

			yield return new WaitForSeconds(1.0f);

			if (closeDialogueUIEvent != null)
				closeDialogueUIEvent.RaiseEvent();

			ToggleCameras(false);

			yield return new WaitForSeconds(1.5f);

			// if (endStoryEvent != null) endStoryEvent.RaiseEvent(m_CurrentStory, null);

			inputReader.advanceDialogueEvent -= OnAdvance;
			inputReader.EnableGameplayInput();

			_isInputEnabled = true;

			yield return null;
		}

		private void ToggleCameras(bool enable)
		{
			gameCam.SetActive(!enable);
			dialogueCam.SetActive(enable);
		}

		/*
		private void InitEvents()
		{
			// Search dialogue events for dialogue id
			var links = TableDatabase.Get.FindLinks("dialogueOptionEvents", "dialogueId", m_CurrentStory.DialogueLines[m_Counter].ID);

			// Create all events
			int i = 0;
			foreach (var link in links)
			{
				bool nameFound = false;
				bool valueFound = false;
				bool svalueFound = false;

				string s = "";
				double d = 0;
				double d2 = 0;

				foreach (var field in link.Item2.Fields)
				{
					if (field.Key.ColumnName == "name")
					{
						nameFound = true;

						s = (string) field.Value.Data;
					}
					else if (field.Key.ColumnName == "value")
					{
						valueFound = true;
						d = (double) field.Value.Data;
					}
					else if (field.Key.ColumnName == "secondaryValue")
					{
						svalueFound = true;
						d2 = (double) field.Value.Data;
					}

					if (nameFound && valueFound && svalueFound)
					{
						break;
					}
				}

				string eventName = s;
				i++;
			}
		}

		/// <summary>
		///
		/// </summary>
		/// <param name="onEnter"></param>
		private void CallEvents(bool onEnter) { }
		*/
	}
}
