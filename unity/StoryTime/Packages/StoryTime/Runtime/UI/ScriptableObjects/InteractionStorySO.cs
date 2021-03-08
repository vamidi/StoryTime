using UnityEngine;

namespace DatabaseSync
{
	public enum StoryState
	{
		New,
		Update,
		Complete
	}

	public class InteractionStorySO : InteractionSO
	{
		[Tooltip("The Story title")]
		[SerializeField] public string interactionStoryState;

		[Tooltip("The Story title")]
		[SerializeField] public string interactionStoryTitle;

		[Tooltip("The Task title")]
		[SerializeField] public string interactionTaskDescription;
	}
}
