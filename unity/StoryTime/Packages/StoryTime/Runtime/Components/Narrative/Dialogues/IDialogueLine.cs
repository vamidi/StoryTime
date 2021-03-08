using System.Collections.Generic;

namespace DatabaseSync.Components
{
	public interface IDialogueLine
	{
		uint ID { get; }
		string Sentence { get; }
		string DialogueEvent { get; }
		DialogueType DialogueType { get; }
		IDialogueLine NextDialogue { get; set; }
		uint NextDialogueID { get; }
		List<DialogueChoiceSO> Choices { get; }
	}
}
