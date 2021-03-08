using UnityEngine;

namespace DatabaseSync.Components
{
	/// <summary>
	/// Scriptable Object that represents an "Actor", that is the protagonist of a Dialogue
	/// </summary>

	[CreateAssetMenu(fileName = "newActor", menuName = "DatabaseSync/Narrative/Actor")]
	// ReSharper disable once InconsistentNaming
	public class ActorSO : TableBehaviour
	{
		public string ActorName
		{
			get => _actorName;
			set => _actorName = value;
		}

		[SerializeField] private string _actorName = default;

		public ActorSO() : base("characters", "name") { }
	}
}
