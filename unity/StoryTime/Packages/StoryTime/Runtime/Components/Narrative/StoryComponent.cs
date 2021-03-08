using System;
using System.Collections.Generic;
using DatabaseSync.Binary;
using UnityEngine;

namespace DatabaseSync.Components
{
    public class StoryComponent : MonoBehaviour
    {
	    public DialogueLineSO StartDialogue => _startDialogue;

	    private DialogueLineSO _startDialogue;
	    public StoryComponent() /* : base("stories", "title", "parentId") */ { }

	    private void Start()
	    {
		    // if (ID != UInt32.MaxValue)
			    // InitStory();
	    }

	    public void InitStory()
	    {
		    // get the first field
		    // TableField field = GetField("stories", "childId", ID);
		    // if (field != null)
		    // {
			    // Get the first dialogue
			    // _startDialogue = Dialogue.ConvertRow(GetRow("dialogues", (uint) field.Data));
		    // }
	    }
    }
}
