using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Components
{
	using Events;

	[CreateAssetMenu(fileName = "QuestContainer", menuName = "DatabaseSync/Quests/QuestContainer", order = 51)]
	public class QuestContainer : ScriptableObject
	{
		[Header("Data")]
		// Quest lines are a sequence of quests on a specific character.
		[SerializeField] private List<StoryLineSO> questLines;
		// Reference to the inventory of the player.
		[SerializeField] private InventorySO inventory;

		[Header("Listening to channels")]
		[SerializeField] private VoidEventChannelSO checkStepValidityEvent;
		[SerializeField] private DialogueStoryChannelSO endDialogueEvent;

		[Header("Broadcasting on channels")]
		[SerializeField] private VoidEventChannelSO completeDialogueEvent;
		[SerializeField] private VoidEventChannelSO incompleteDialogueEvent;

		[SerializeField] private ItemEventChannelSO giveItemEvent;
		[SerializeField] private ItemEventChannelSO rewardItemEvent;
	}
}
