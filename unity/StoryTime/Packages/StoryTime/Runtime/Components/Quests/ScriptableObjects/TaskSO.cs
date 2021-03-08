using System;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Components
{
	public enum TaskCompletionType
	{
		None, //
		Collect, // collect an or multiple item(s) 1
		Defeat, // defeat a certain enemy. 2
		Talk, // Talk to a npc. 3
		Interact, // Interact with an object 4
		Defend // Defend an object or npc. 5
	}

	[CreateAssetMenu(fileName = "Task", menuName = "DatabaseSync/Quests/Task", order = 51)]
	// ReSharper disable once InconsistentNaming
	public class TaskSO : TableBehaviour
	{
		public uint NextId { get => nextId; set => nextId = value; }
		public string Description { get => description; set => description = value; }
		public bool Hidden { get => hidden; set => hidden = value; }
		public uint Npc { get => npc; set => npc = value; }
		public uint EnemyCategory { get => enemyCategory; set => enemyCategory = value; }
		public uint ParentId { get => parentId; set => parentId = value; }
		public uint RequiredCount { get => requiredCount; set => requiredCount = value; }
		public List<ItemStack> Items { get => items; set => items = value; }
		public TaskCompletionType Type { get => type; set => type = value; }
		public DialogueLineSO DialogueBeforeTask => dialogueBeforeTask;
		public DialogueLineSO WinDialogue => completeDialogue;
		public DialogueLineSO LoseDialogue => incompleteDialogue;
		public bool IsDone => isDone;
		public ActorSO Actor => actor;
		public TaskEventSO TaskEvent => taskEvent;

		[Tooltip("The description of the mission")]
		[SerializeField] private string description;

		[Tooltip("Whether the mission is hidden")]
		[SerializeField] private bool hidden;

		// the next task that the player needs to perform.
		private uint nextId = UInt32.MaxValue;

		// Reference to the interactable id, could be a monster or a npc
		// It could be even a reference to a group of monsters of some type.
		private uint npc = UInt32.MaxValue;

		[Tooltip("Which enemy category do we need to hunt")]
		[SerializeField] private uint enemyCategory = UInt32.MaxValue;

		// Reference to the parent, which is the quest.
		private uint parentId = UInt32.MaxValue;

		[Tooltip("Requirement amount to complete the mission")]
		[SerializeField] private uint requiredCount;

		// Keep reference to the amount we killed or collected.
		private int m_Count;

		[Tooltip("The Character this mission belongs to and will need to interaction with")]
		[SerializeField] private ActorSO actor;

		[Tooltip("The dialogue that will be displayed before an action, if any")]
		[SerializeField] private DialogueLineSO dialogueBeforeTask;

		[Tooltip("The dialogue that will be displayed when the step is achieved")]
		[SerializeField] private DialogueLineSO completeDialogue;

		[Tooltip("The dialogue that will be displayed if the step is not achieved yet")]
		[SerializeField] private DialogueLineSO incompleteDialogue;

		[Tooltip("The item to check/give/reward (can be multiple)")]
		[SerializeField] private List<ItemStack> items;

		[Tooltip("The type of the task")]
		[SerializeField] private TaskCompletionType type;

		[Tooltip("An event that we can trigger when a certain task is being enabled")]
		[SerializeField] private TaskEventSO taskEvent;

		[SerializeField] bool isDone;

		public void OnEnable()
		{
			m_Count = 0;
			isDone = false;
		}

		// Increase the amount of
		public void Increment()
		{
			m_Count++;
		}

		/// <summary>
		/// This function will validate whether the required amount is met.
		/// </summary>
		/// <returns></returns>
		public bool Validate()
		{
			return m_Count >= requiredCount;
		}

		public void FinishTask()
		{
			isDone = true;
		}

		TaskSO(): base("tasks", "description") {}
	}
}
