using System;
using UnityEngine;

namespace DatabaseSync.Components
{
	using Binary;

	/// <summary>
	/// Dialogue Holder
	/// these are the base variables that we need to set
	/// up the dialogue system
	/// </summary>
	public class CharacterTable : BaseTable<ActorSO>
	{
		public new static ActorSO ConvertRow(TableRow row, ActorSO scriptableObject)
		{
			ActorSO actor = scriptableObject ? scriptableObject : ScriptableObject.CreateInstance<ActorSO>();

			if (row.Fields.Count == 0)
			{
				return actor;
			}

			foreach (var field in row.Fields)
			{
				if (field.Key.Equals("id"))
				{
					actor.ID = uint.Parse(field.Value.Data);
				}

				if (field.Key.Equals("name"))
				{
					actor.ActorName = (string) field.Value.Data;
				}
			}

			return actor;
		}
	}
}
