using System;
using UnityEngine;

namespace DatabaseSync.Components
{
	[CreateAssetMenu(fileName = "newDialogueEvent", menuName = "DatabaseSync/Events/Narrative/Dialogue Event")]
	public class DialogueEventSO : ScriptableObject
	{
		public string EventName => eventName;

		public ScriptableObject Value => value;

		[Tooltip("Dialogue Option Event name")]
		[SerializeField] private string eventName = String.Empty;

		[Tooltip("Dialogue Option Event value you want to pass")]
		[SerializeField] private ScriptableObject value;
	}
}
