using System;
using UnityEngine;

namespace DatabaseSync.Components
{
	[CreateAssetMenu(fileName = "newEnemy", menuName = "DatabaseSync/Quests/Enemy")]
	public class EnemySO : TableBehaviour
	{
		public string EnemyName { get => enemyName; set => enemyName = value; }
		public uint Category { get => category; set => category = value; }

		[SerializeField] private string enemyName;
		[SerializeField] private uint category = UInt32.MaxValue;

		public EnemySO() : base("enemies", "name") { }

	}
}
