using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Components
{
	using Events;

	/// <summary>
	/// The Quest manager is in control of the quests
	/// </summary>
	public class QuestManager : MonoBehaviour
	{

		[Header("Data")]
		// Quest lines are a sequence of quests on a specific character.
		[SerializeField, Tooltip("These are the quests that are part of the main storyline")]
		private StoryLineSO currentStoryLine;

		[SerializeField, Tooltip("List of quests that are not part of the main story.")]
		private List<StorySO> stories;

		// Reference to the players inventory.
		[SerializeField] private InventorySO inventory;

		// [SerializeField] private Journal journal;

		[Header("Listening to channels")]

		// ReSharper disable once InvalidXmlDocComment
		/// <summary>
		/// Listen to incoming quests from i.e NPC through dialogue.
		/// </summary>
		[SerializeField] private DialogueEventChannelSO checkDialogueEvent;

		/// <summary>
		/// Check task validity. This is when a NPC that is part of the quest sends a request to check the validity of the task.
		/// </summary>
		[SerializeField] private VoidEventChannelSO checkTaskValidityEvent;

		[SerializeField] private EnemyChannelSO checkEnemyDestroyedEvent;

		/// <summary>
		///
		/// </summary>
		[SerializeField] private DialogueLineChannelSO endDialogueEvent;


		[Header("Broadcasting on channels")]
		// ReSharper disable once InvalidXmlDocComment
		/// <summary>
		/// We need to tell objects around the game to tell that a certain task has begun.
		/// </summary>
		[SerializeField] private TaskChannelSO startTaskEvent;

		/// <summary>
		/// We need to tell objects around the game to tell that a certain task has ended.
		/// </summary>
		[SerializeField] private VoidEventChannelSO endTaskEvent;

		[Tooltip("Dialogue to show when the condition is met")]
		// ReSharper disable once InvalidXmlDocComment
		/// <summary>
		/// Show complete dialogue
		/// </summary>
		[SerializeField] private VoidEventChannelSO completeDialogueEvent;

		[Tooltip("Dialogue condition to show when the condition is not met")]
		[SerializeField] private VoidEventChannelSO incompleteDialogueEvent;

		[Tooltip("Item we need to give for the quest")]
		[SerializeField] private ItemEventChannelSO giveItemEvent;

		[Tooltip("Reward we get for completing the quest")]
		[SerializeField] private ItemEventChannelSO rewardItemEvent;

		[SerializeField] private InteractionStoryUIEventChannel navigationInteractionUI;

		// private bool ReachedEndOfQuest => m_CurrentQuest && m_CurrentTaskIndex >= m_CurrentQuest.Tasks.Count;

		private StorySO m_CurrentStory;
		private TaskSO m_CurrentTask;
		private int m_CurrentQuestIndex;
		private int m_CurrentQuestLineIndex;
		private int m_CurrentTaskIndex;

		void Start()
		{
			if (checkTaskValidityEvent != null)
			{
				checkTaskValidityEvent.OnEventRaised += CheckTaskValidity;
			}

			if (endDialogueEvent != null)
			{
				endDialogueEvent.OnEventRaised += EndDialogue;
			}

			if (checkDialogueEvent != null)
			{
				checkDialogueEvent.OnEventRaised += CheckIncomingDialogueEvent;
			}

			if (checkEnemyDestroyedEvent != null)
			{
				checkEnemyDestroyedEvent.OnEventRaised += OnEnemyDefeated;
			}

			StartGame();
		}

		void CheckIncomingDialogueEvent(string eventName, Object story)
		{
			if (eventName == "AcceptQuest")
			{
				var qStory = story as StorySO;
				stories.Add(qStory);

				if (qStory != null)
				{
					navigationInteractionUI.RaiseEvent(true, new StoryInfo
					{
						// this is a new quest so grab the first quest.
						Story = qStory,
						Index = 0,
						State = StoryState.New
					}, InteractionType.Navigate);

					// TODO make it possible to start the quest from the quest manage window
					StartStory(qStory);
				}
			}
		}

		void OnEnemyDefeated(EnemySO enemySo)
		{
			// Check again if we are slaying the right enemy.
			if (m_CurrentTask != null && m_CurrentTask.EnemyCategory == enemySo.Category)
			{
				// Increment the count because we defeated this monster
				// or a monster from this category.
				m_CurrentTask.Increment();

				if (m_CurrentTask.Validate())
				{
					EndTask();
				}
			}
		}

		void StartGame()
		{
			// TODO Add code for saved information
			// TODO add check for active quest.
			// Start the main story of the game.
			if (currentStoryLine != null)
			{
				if (currentStoryLine.Stories.Exists(o => !o.IsDone))
				{
					m_CurrentQuestLineIndex = currentStoryLine.Stories.FindIndex(o => !o.IsDone);
					if (m_CurrentQuestLineIndex >= 0)
						m_CurrentStory = currentStoryLine.Stories.Find(o => !o.IsDone);

					// if we found a quest line. fetch the first quest.
					m_CurrentQuestIndex = currentStoryLine.Stories.FindIndex(o => o.IsDone == false);
					if (m_CurrentQuestIndex >= 0)
						StartStory(currentStoryLine.Stories[m_CurrentQuestIndex]);
				}
			}
		}

		void StartStory(StorySO currentStory)
		{
			m_CurrentStory = currentStory;
			m_CurrentTaskIndex = 0;
			m_CurrentTaskIndex = m_CurrentStory.Tasks.FindIndex(o => o.IsDone == false);
			if (m_CurrentTaskIndex >= 0)
				StartTask();
		}

		void StartTask()
		{
			if (m_CurrentStory.Tasks != null)
			{
				if (m_CurrentStory.Tasks.Count > m_CurrentTaskIndex)
				{
					m_CurrentTask = m_CurrentStory.Tasks[m_CurrentTaskIndex];

					startTaskEvent.RaiseEvent(m_CurrentTask);
				}
			}
		}

		/// <summary>
		/// User is able to implement their own task validity.
		/// </summary>
		protected virtual void CheckTaskValidity()
		{
			if (m_CurrentStory != null && m_CurrentStory.Tasks != null && m_CurrentStory.Tasks.Count > m_CurrentTaskIndex)
			{
				m_CurrentTask = m_CurrentStory.Tasks[m_CurrentTaskIndex];
				switch (m_CurrentTask.Type)
				{
					case TaskCompletionType.Collect:
						Debug.Log($"Collecting task: {m_CurrentTask.ID}");
						CheckCollectTask();
						break;
					case TaskCompletionType.Defeat:
						Debug.Log($"Defeat task: {m_CurrentTask.ID}");
						CheckDefeatTask();
						break;
					case TaskCompletionType.Interact:
						break;
					case TaskCompletionType.Defend:
						break;
					case TaskCompletionType.Talk:
						Debug.Log($"Talk task {m_CurrentTask.ID}");
						// dialogue has already been played
						TalkTask();
						break;
				}
			}
		}

		void EndDialogue(IDialogueLine dialogue, ActorSO actorSo)
		{
			// depending on the dialogue that ended, do something
			switch (dialogue.DialogueType)
			{
				case DialogueType.WinDialogue:
					EndTask();
					break;
			}
		}

		/// <summary>
		///
		/// </summary>
		protected virtual void EndTask()
		{
			m_CurrentTask = null;

			if (stories != null)
			{
				if (stories.Count > m_CurrentQuestIndex)
				{
					if (stories[m_CurrentQuestIndex].Tasks != null)
					{
						if (stories[m_CurrentQuestIndex].Tasks.Count > m_CurrentTaskIndex)
						{
							if (endTaskEvent != null)
								endTaskEvent.RaiseEvent();

							TaskSO task = stories[m_CurrentQuestIndex].Tasks[m_CurrentTaskIndex];

							// finish the task
							task.FinishTask();

							if (stories[m_CurrentQuestIndex].Tasks.Count > m_CurrentTaskIndex + 1)
							{
								m_CurrentTaskIndex++;

								navigationInteractionUI.RaiseEvent(true, new StoryInfo
								{
									// this is a new quest so grab the first quest.
									Story = m_CurrentStory,
									Index = m_CurrentTaskIndex,
									State = StoryState.Update
								}, InteractionType.Navigate);

								StartTask();
							}
							else
							{
								navigationInteractionUI.RaiseEvent(true, new StoryInfo
								{
									// this is a new quest so grab the first quest.
									Story = m_CurrentStory,
									Index = m_CurrentTaskIndex,
									State = StoryState.Complete
								}, InteractionType.Navigate);

								EndQuest();
							}
						}
					}
				}
			}
		}

		/// <summary>
		/// This function will simply complete the quest.
		/// The user can override this function to add behaviour on
		/// top of this (like i.e continue new quest).
		/// </summary>
		protected virtual void EndQuest()
		{
			if (m_CurrentStory != null)
			{
				// check if we dont have anything to do anymore in the quest.
				if (m_CurrentTaskIndex > m_CurrentStory.Tasks.Count)
				{
					foreach (var task in m_CurrentStory.Tasks)
					{
						// If we dont need to collect this item then it is probably
						// an item to give to the player
						if(task.Type != TaskCompletionType.Collect)
							// Reward
							rewardItemEvent.RaiseEvent(task.Items);
					}

					// complete that quest.
					m_CurrentStory.FinishStory();
				}
			}
		}

		/// <summary>
		/// Checks if the player meets the requirements inside the task.
		/// </summary>
		protected virtual void CheckCollectTask()
		{
			// Give away the item from the inventory
			bool oneItem = m_CurrentTask.Items.Count == 1;
			var itemToCheck = m_CurrentTask.Items[0];
			bool InventoryCheck()  => oneItem ? inventory.Contains(itemToCheck.Item, itemToCheck.Amount) : inventory.Contains(m_CurrentTask.Items);

			Debug.Log(oneItem);
			Debug.Log(itemToCheck);
			Debug.Log(InventoryCheck());

			if (InventoryCheck())
			{
				if (oneItem)
				{
					giveItemEvent.RaiseEvent(m_CurrentTask.Items[0]);
				}
				else
				{
					giveItemEvent.RaiseEvent(m_CurrentTask.Items);
				}

				// Trigger complete dialogue
				completeDialogueEvent.RaiseEvent();

				// we have completed the task so progress to the new one.
				EndTask();
			}
			else
			{
				//trigger incomplete dialogue
				incompleteDialogueEvent.RaiseEvent();
			}
		}

		protected virtual void CheckDefeatTask()
		{
			if (m_CurrentTask.Validate())
			{
				completeDialogueEvent.RaiseEvent();

				// we have completed the task so progress to the new one.
				EndTask();
			}
			else
			{
				//trigger incomplete dialogue
				incompleteDialogueEvent.RaiseEvent();
			}
		}

		protected virtual void TalkTask()
		{
			completeDialogueEvent.RaiseEvent();
			EndTask();
		}
	}
}
