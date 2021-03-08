using System;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Components
{
	using Binary;

	/// <summary>
	/// DialogueLine is a Scriptable Object that represents one line of spoken dialogue.
	/// It references the Actor that speaks it.
	/// </summary>
	[CreateAssetMenu(fileName = "newDialogueLine", menuName = "DatabaseSync/Narrative/Dialogue Line")]
	// ReSharper disable once InconsistentNaming
	public class DialogueLineSO : TableBehaviour, IDialogueLine
	{
		public string Sentence => sentence;
		public string DialogueEvent => dialogueEvent;
		public DialogueType DialogueType => dialogueType;
		public IDialogueLine NextDialogue
		{
			get => nextDialogue;
			set
			{
				Debug.Assert(value is DialogueLineSO || value == null, "Expected to pass in a DialogueLineSO in class DialogueLineSO.");
				nextDialogue = (DialogueLineSO) value;
			}
		}
		public uint NextDialogueID => nextDialogueID;
		public List<DialogueChoiceSO> Choices => choices;

		/// <summary>
		///
		/// </summary>
		[SerializeField] private DialogueLineSO nextDialogue;

		[SerializeField, HideInInspector]
		private uint nextDialogueID = UInt32.MaxValue;

		[SerializeField]
		private DialogueType dialogueType;

		/// <summary>
		///
		/// </summary>
		[SerializeField, TextArea(1, 5), Tooltip("Sentence that will showed when interacting")]
		private string sentence = "";

		[SerializeField, Tooltip("Event that will be fired once filled in.")]
		string dialogueEvent = String.Empty;

		[SerializeField]
		private List<DialogueChoiceSO> choices = new List<DialogueChoiceSO>();

		public static DialogueLineSO ConvertRow(TableRow row, DialogueLineSO dialogueLine = null)
		{
			DialogueLineSO dialogue = dialogueLine ? dialogueLine : CreateInstance<DialogueLineSO>();

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

				// if (field.Key.Equals("parentId"))
				// {
					// uint data = (uint) field.Value.Data;
					// dialogue.parentId = data == UInt32.MaxValue - 1 ? UInt32.MaxValue : data;
				// }
			}

			return dialogue;
		}

		/// <summary>
		/// Dialogue Holder
		/// these are the base variables that we need to set
		/// up the dialogue system
		/// </summary>
		public DialogueLineSO() : base("dialogues", "text") { }
	}
}
