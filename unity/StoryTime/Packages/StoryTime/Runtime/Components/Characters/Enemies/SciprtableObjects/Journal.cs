using System;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync.Components
{
	/// <summary>
	/// This class is responsible for tracking down the monsters.
	/// </summary>
	[CreateAssetMenu(fileName = "journal", menuName = "DatabaseSync/Characters/Enemy Journal", order = 51)]
	public class Journal : ScriptableObject
	{
		public uint Track { get => currentEnemy; set => currentEnemy = value; }

		// Current tracking of the monster we should destroy
		[SerializeField] private uint currentEnemy;
	}
}
