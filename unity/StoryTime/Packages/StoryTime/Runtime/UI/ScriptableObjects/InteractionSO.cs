using DatabaseSync.UI;
using UnityEngine;

namespace DatabaseSync
{
	[CreateAssetMenu(fileName = "Interaction", menuName = "DatabaseSync/UI/Interaction", order = 51)]
	public class InteractionSO : ScriptableObject
	{
		public string InteractionName
		{
			get => interactionName;
			set => interactionName = value;
		}

		public InteractionType InteractionType => interactionType;

		// TODO add multi language support
		[Tooltip("The interaction name")]
		[SerializeField] private string interactionName;

		[Tooltip("The Interaction Type")]
		[SerializeField] private InteractionType interactionType;
	}
}
