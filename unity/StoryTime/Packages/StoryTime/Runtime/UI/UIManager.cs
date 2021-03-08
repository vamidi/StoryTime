using UnityEngine;

namespace DatabaseSync.UI
{
	using Components;
	using Events;

	public class UIManager : MonoBehaviour
	{
		[Header("Listening on channels")]
		public DialogueLineChannelSO openUIDialogueEvent;

		public VoidEventChannelSO closeUIDialogueEvent;
		public VoidEventChannelSO openInventoryScreenEvent;
		public VoidEventChannelSO openInventoryScreenForCookingEvent;
		public VoidEventChannelSO closeInventoryScreenEvent;
		public VoidEventChannelSO onInteractionEndedEvent;

		public InteractionUIEventChannelSO setInteractionEvent;
		public InteractionStoryUIEventChannel showNavigationInteractionEvent;
		public InteractionItemUIEventChannel showItemInteractionEvent;

		[Header("References")]

		[SerializeField] UIDialogueManager dialogueController;

		// [SerializeField] UIInventoryManager inventoryPanel;

		[SerializeField] private UIInteractionManager interactionPanel;

		[SerializeField] private UIInteractionStoryManager navigationPanel;

		[SerializeField] private UIInteractionItemManager interactionItemPanel;

		bool isForCooking = false;

		private void OnEnable()
		{
			//Check if the event exists to avoid errors
			if (openUIDialogueEvent != null)
			{
				openUIDialogueEvent.OnEventRaised += OpenUIDialogue;
			}

			if (closeUIDialogueEvent != null)
			{
				closeUIDialogueEvent.OnEventRaised += CloseUIDialogue;
			}

			if (openInventoryScreenForCookingEvent != null)
			{
				openInventoryScreenForCookingEvent.OnEventRaised += SetInventoryScreenForCooking;
			}

			if (openInventoryScreenEvent != null)
			{
				openInventoryScreenEvent.OnEventRaised += SetInventoryScreen;
			}

			if (closeInventoryScreenEvent != null)
			{
				closeInventoryScreenEvent.OnEventRaised += CloseInventoryScreen;
			}

			if (setInteractionEvent != null)
			{
				setInteractionEvent.OnEventRaised += SetInteractionPanel;
			}

			if (showNavigationInteractionEvent != null)
				showNavigationInteractionEvent.OnEventRaised += ShowNavigationPanel;

			if (showNavigationInteractionEvent != null)
				showNavigationInteractionEvent.OnEventRaised += ShowNavigationPanel;

			if (showItemInteractionEvent != null)
				showItemInteractionEvent.OnEventRaised += ShowItemPanel;
		}

		private void Start()
		{
			CloseUIDialogue();
		}

		public void OpenUIDialogue(IDialogueLine dialogueLine, ActorSO actor)
		{
			dialogueController.SetDialogue(dialogueLine, actor);
			dialogueController.gameObject.SetActive(true);
		}

		public void CloseUIDialogue()
		{
			dialogueController.gameObject.SetActive(false);
		}

		public void SetInventoryScreenForCooking()
		{
			isForCooking = true;
			OpenInventoryScreen();

		}

		public void SetInventoryScreen()
		{
			isForCooking = false;
			OpenInventoryScreen();

		}

		void OpenInventoryScreen()
		{
			/*
			inventoryPanel.gameObject.SetActive(true);

			if (isForCooking)
			{
				inventoryPanel.FillInventory(TabType.recipe, true);

			}
			else
			{
				inventoryPanel.FillInventory();
			}
			*/
		}


		public void CloseInventoryScreen()
		{
			/*
			inventoryPanel.gameObject.SetActive(false);

			if (isForCooking)
			{
				OnInteractionEndedEvent.RaiseEvent();
			}
			*/
		}

		public void SetInteractionPanel(bool isOpenEvent, InteractionType interactionType)
		{
			if (isOpenEvent)
			{
				interactionPanel.FillInteractionPanel(interactionType);
			}

			interactionPanel.gameObject.SetActive(isOpenEvent);
		}

		public void ShowNavigationPanel(bool isOpenEvent, StoryInfo info, InteractionType interactionType)
		{
			if (isOpenEvent)
			{
				navigationPanel.SetQuest(info);
				navigationPanel.FillInteractionPanel(interactionType);
			}

			navigationPanel.gameObject.SetActive(isOpenEvent);
		}

		public void ShowItemPanel(bool isOpenEvent, ItemStack itemInfo, InteractionType interactionType)
		{
			if (isOpenEvent)
			{
				interactionItemPanel.SetItem(itemInfo);
				interactionItemPanel.FillInteractionPanel(interactionType);
			}

			interactionItemPanel.gameObject.SetActive(isOpenEvent);
		}
	}
}
