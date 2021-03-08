using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace DatabaseSync.Components
{
	using Database;
	using Binary;

	public enum DialogueType
	{
		StartDialogue,
		WinDialogue,
		LoseDialogue,
		DefaultDialogue,

	}

	public enum ChoiceActionType
	{
		DoNothing,
		ContinueWithQuest,
		ContinueWithTask,
	}

	/// <summary>
	/// A Dialogue is a list of consecutive DialogueLines. They play in sequence using the input of the player to skip forward.
	/// In future versions it might contain support for branching conversations.
	/// </summary>
	[CreateAssetMenu(fileName = "newStory", menuName = "DatabaseSync/Narrative/Story")]
	// ReSharper disable once InconsistentNaming
	public partial class StorySO : TableBehaviour
	{
		public string Title => title;
		public string CharacterName => characterName;
		public string Description => description;
		public uint ParentId => parentId;
		public uint ChildId => childId;
		public QuestType TypeId => typeId;
		public List<TaskSO> Tasks => tasks;
		public bool IsDone => m_IsDone;
		public ActorSO Actor => actor;

		// rename Dialogue line to story lines
		public DialogueLine StartDialogue => m_StartDialogue;

		[Tooltip("The collection of tasks composing the Quest")] [SerializeField]
		private List<TaskSO> tasks = new List<TaskSO>();

		private bool m_IsDone;

		// public QuestSO() : base("quests", "title") { }

		[SerializeField] private ActorSO actor;

		// Is being calculated in the story editor.
		private DialogueLine m_StartDialogue;

		/** ------------------------------ DATABASE FIELD ------------------------------ */

		[SerializeField, Tooltip("The title of the quest")]
		private string title = String.Empty;

		[SerializeField, Tooltip("The description of the quest")]
		private string description = String.Empty;

		[SerializeField, HideInInspector]
		private string characterName = String.Empty;

		/// <summary>
		///
		/// </summary>
		[SerializeField, HideInInspector]
		private uint characterID = UInt32.MaxValue;

		[SerializeField, HideInInspector] // Tooltip("The character id where this story belongs to.")]
		private uint parentId = UInt32.MaxValue;

		[SerializeField, HideInInspector] // Tooltip("The id where the dialogue should go first")]
		private uint childId = UInt32.MaxValue;

		[SerializeField, Tooltip("Show the type of the quest. i.e could be part of the main story")]
		private QuestType typeId;

		public StorySO() : base("stories", "title", "parentId") { }

		public virtual void OnEnable()
		{
			if (childId != UInt32.MaxValue)
			{
				// Only get the first dialogue.
				// TODO use custom scripter
				m_StartDialogue = DialogueLine.ConvertRow(TableDatabase.Get.GetRow("dialogues", childId));

				var field = TableDatabase.Get.GetField(Name, "data", ID);
				if (field != null)
				{
					StoryTable.ParseNodeData(this, (JObject) field.Data);
				}
			}

			if (characterID != UInt32.MaxValue)
			{
				TableDatabase database = TableDatabase.Get;
				Tuple<uint, TableRow> link = database.FindLink("characters", "name", characterID);
				if (link != null)
				{
					var field = database.GetField(link.Item2, "name");
					if (field != null) characterName = (string) field.Data;

					Debug.Log(characterName);
				}
			}
		}

		public void FinishStory()
		{
			m_IsDone = true;
		}
	}
}

