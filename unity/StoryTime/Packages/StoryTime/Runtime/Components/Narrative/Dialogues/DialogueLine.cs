using System;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Components
{
	using Binary;

	[Serializable]
	public class DialogueLine : IDialogueLine
	{
		public UInt32 ID => m_Id;
		public string Sentence => sentence;
		public string DialogueEvent => dialogueEvent;
		public DialogueType DialogueType => dialogueType;
		public IDialogueLine NextDialogue
		{
			get => m_NextDialogue;
			set
			{
				Debug.Assert(value is DialogueLine || value == null, "Expected to pass in a DialogueLine in class DialogueLine.");
				m_NextDialogue = (DialogueLine) value;
			}
		}

		public uint NextDialogueID => nextDialogueID;
		public List<DialogueChoiceSO> Choices => m_Choices;

		private uint m_Id = UInt32.MaxValue;

		/// <summary>
		///
		/// </summary>
		private DialogueLine m_NextDialogue;

		[SerializeField, HideInInspector]
		private uint nextDialogueID = UInt32.MaxValue;

		[SerializeField]
		private DialogueType dialogueType;


		/// <summary>
		///
		/// </summary>
		[SerializeField, Tooltip("Sentence that will showed when interacting")]
		private string sentence = String.Empty;

		[SerializeField, Tooltip("Event that will be fired once filled in.")]
		private string dialogueEvent = String.Empty;

		[NonSerialized]
		private List<DialogueChoiceSO> m_Choices = new List<DialogueChoiceSO>();

		// TODO we need to serialize this back.
		// [SerializeField, HideInInspector]
		// private List<int> choiceIds = new List<int>();

		public override string ToString()
		{
			// public uint NextDialogueID => nextDialogueID;
			// public List<DialogueOption> Choices => choices;
			return $"ID: {nextDialogueID}, Choices: {m_Choices.Count}, Sentence: {sentence}";
		}

		public static DialogueLine ConvertRow(TableRow row, DialogueLine dialogueLine = null)
		{
			DialogueLine dialogue = dialogueLine ?? new DialogueLine();

			if (row.Fields.Count == 0)
			{
				return dialogue;
			}

			foreach (var field in row.Fields)
			{
				/*
				if (field.Key.Equals("id"))
				{
					dialogue.ID = uint.Parse(field.Value.Data);
				}
				*/

				if (field.Key.Equals("nextId"))
				{
					uint data = (uint) field.Value.Data;
					dialogue.nextDialogueID = data == UInt32.MaxValue - 1 ? UInt32.MaxValue : data;
				}

				if (field.Key.Equals("text"))
				{
					dialogue.sentence = (string) field.Value.Data;
				}

				if (field.Key.Equals("options"))
				{
					dialogue.sentence = (string) field.Value.Data;
				}

				// if (field.Key.Equals("parentId"))
				// {
				// uint data = (uint) field.Value.Data;
				// dialogue.parentId = data == UInt32.MaxValue - 1 ? UInt32.MaxValue : data;
				// }
			}

			return dialogue;
		}

		protected DialogueLine() { }

	}
}
