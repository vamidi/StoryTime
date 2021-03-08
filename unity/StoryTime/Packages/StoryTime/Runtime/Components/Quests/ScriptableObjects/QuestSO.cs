using System;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Components
{
	public enum QuestType
	{
		WorldQuest
		// Extend with own quest types.
	}

	[CreateAssetMenu(fileName = "Quest", menuName = "DatabaseSync/Quests/Quest", order = 51)]
	// ReSharper disable once InconsistentNaming
	public class QuestSO : TableBehaviour
	{
		public string Title { get => title; set => title = value; }
		public string Description { get => description; set => description = value; }
		public uint ChildId { get => childId; set => childId = value; }
		public QuestType TypeId { get => typeId; set => typeId = value; }
		public List<TaskSO> Tasks => tasks;
		public bool IsDone => m_IsDone;

		[Tooltip("The title of the quest")]
		[SerializeField] private string title = String.Empty;

		[Tooltip("The description of the quest")]
		[SerializeField] private string description = String.Empty;

		[Tooltip("The id of the quest this task belongs to")]
		[SerializeField] private uint childId = UInt32.MaxValue;

		[Tooltip("Show the type of the quest. i.e could be part of the main story")]
		[SerializeField] private QuestType typeId;

		[Tooltip("The collection of tasks composing the Quest")]
		[SerializeField] private List<TaskSO> tasks = new List<TaskSO>();

		private bool m_IsDone;

		public List<QuestEvent> QuestEvents = new List<QuestEvent>();

		public void Print()
		{
			foreach (var questEvent in QuestEvents)
			{
				Debug.Log($"title: {questEvent.Title} order: {questEvent.Order}");
			}
		}

		public void FinishQuest()
		{
			m_IsDone = true;
		}

		public QuestSO() : base("quests", "title") { }
	}
}
