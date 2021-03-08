using System;
using UnityEngine;

namespace DatabaseSync.Components.Characters
{
	public class CharacterComponent : TableBehaviour
	{
		public CharacterComponent() : base("characters", "name") { }
	}
}
