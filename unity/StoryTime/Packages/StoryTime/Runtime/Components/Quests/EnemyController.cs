using UnityEngine;

namespace DatabaseSync.Components
{
	public class EnemyController : MonoBehaviour
	{
		public NonPlayableActorSO Npc => npc;

		[Header("Data")]
		[SerializeField] private NonPlayableActorSO npc;
	}
}
